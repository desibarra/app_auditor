const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'empresas-demo.json');
const UPLOAD_STATS_FILE = path.join(__dirname, 'upload-stats.json');

// --- DATABASE INITIALIZATION ---
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([
        {
            id: "1767074265037",
            razonSocial: "TRASLADOS DE VANGUARDIA SA DE CV",
            rfc: "TVA060209QL6",
            regimen_fiscal: "601",
            satAuthMode: "FIEL",
            satStatus: "ACTIVE",
            lastSatSyncAt: new Date().toISOString()
        }
    ], null, 2));
}

if (!fs.existsSync(UPLOAD_STATS_FILE)) {
    fs.writeFileSync(UPLOAD_STATS_FILE, JSON.stringify({
        count: 24083,
        lastUpdate: new Date().toISOString(),
        distribution: {} // mes -> count
    }, null, 2));
}

app.use(cors());
app.use(express.json());

// Log todas las peticiones (Arquitectura de Auditoría)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[AUDIT] ${new Date().toISOString()} ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Silenciar warning de apple-touch-icon
app.get('/apple-touch-icon.png', (req, res) => res.status(204).end());
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- ENDPOINTS CORE ---

app.get('/api/health', (req, res) => res.json({ status: 'SENTINEL_OK', timestamp: new Date().toISOString() }));

app.get('/api/empresas', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/empresas/:id', (req, res) => {
    try {
        const empresas = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const empresa = empresas.find(e => e.id == req.params.id);
        if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });

        res.json({
            ...empresa,
            configuracion: empresa.configuracion || JSON.stringify({
                umbrales: { maxEgresosFueraGiro: 15, isrBajo: 10, concentracionProveedor: 25 },
                sector: 'Transporte y Logística'
            })
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/empresas/:id (Para guardar configuración)
app.put('/api/empresas/:id', (req, res) => {
    try {
        const empresas = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const index = empresas.findIndex(e => e.id == req.params.id);
        if (index !== -1) {
            const updated = { ...empresas[index], ...req.body };
            // Si viene 'configuracion' como objeto, lo stringificamos
            if (req.body.configuracion && typeof req.body.configuracion === 'object') {
                updated.configuracion = JSON.stringify(req.body.configuracion);
            }
            empresas[index] = updated;
            fs.writeFileSync(DB_FILE, JSON.stringify(empresas, null, 2));
            res.json({ success: true, data: updated });
        } else {
            res.status(404).json({ error: 'Empresa no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/empresas
app.post('/api/empresas', (req, res) => {
    try {
        const { razonSocial, rfc, regimen_fiscal } = req.body;

        // Validaciones
        if (!razonSocial || !rfc) {
            return res.status(400).json({
                success: false,
                error: 'Razón Social y RFC son requeridos'
            });
        }

        // Validar formato RFC
        const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
        if (!rfcRegex.test(rfc)) {
            return res.status(400).json({
                success: false,
                error: 'RFC inválido. Formato: 3-4 letras, 6 números, homoclave (3 caracteres). Ejemplo: TVA060209QL6'
            });
        }

        // Leer empresas existentes
        const empresas = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

        // Verificar si RFC ya existe
        if (empresas.some(e => e.rfc === rfc)) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una empresa con ese RFC'
            });
        }

        // Crear nueva empresa
        const nuevaEmpresa = {
            id: Date.now().toString(),
            razonSocial,
            rfc,
            regimen_fiscal: regimen_fiscal || '601',
            created_at: new Date().toISOString()
        };

        empresas.push(nuevaEmpresa);
        fs.writeFileSync(DB_FILE, JSON.stringify(empresas, null, 2));

        res.json({
            success: true,
            message: 'Empresa registrada exitosamente',
            data: nuevaEmpresa
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Configuración de almacenamiento para certificados
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads', 'certs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.params.id}_${file.fieldname}${ext}`);
    }
});

const upload = multer({ storage });

// Endpoint para cargar FIEL y CIEC
app.post('/api/empresas/:id/fiel', upload.fields([
    { name: 'cer', maxCount: 1 },
    { name: 'key', maxCount: 1 }
]), (req, res) => {
    try {
        const { id } = req.params;
        const { passwordFiel, passwordCiec } = req.body;

        const empresas = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const index = empresas.findIndex(e => e.id == id);

        if (index === -1) return res.status(404).json({ error: 'Empresa no encontrada' });

        // Actualizar datos de la empresa
        empresas[index].satAuthMode = 'FIEL';
        empresas[index].satStatus = 'ACTIVE';
        empresas[index].lastSatSyncAt = new Date().toISOString();

        // Guardar metadatos (En un sistema real, no guardaríamos passwords en texto plano aquí)
        const config = empresas[index].configuracion ? JSON.parse(empresas[index].configuracion) : {};
        config.fiel = {
            hasCer: !!req.files['cer'],
            hasKey: !!req.files['key'],
            updatedAt: new Date().toISOString()
        };
        config.credentials = {
            ciec: passwordCiec ? '******' : null,
            fiel: passwordFiel ? '******' : null
        };

        empresas[index].configuracion = JSON.stringify(config);
        fs.writeFileSync(DB_FILE, JSON.stringify(empresas, null, 2));

        console.log(`[FIEL] Empresa ${id} actualizada con éxito.`);

        res.json({
            success: true,
            message: 'Certificados y credenciales actualizados correctamente',
            data: {
                satStatus: 'ACTIVE',
                satAuthMode: 'FIEL'
            }
        });
    } catch (error) {
        console.error('Error al procesar FIEL:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ENGINE FISCAL (VISIÓN ANUAL) ---

const getDistribution = (total) => {
    const distribution = {};
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    let remaining = total;
    months.forEach((m, idx) => {
        if (idx === 11) {
            distribution[m] = remaining;
        } else {
            const part = Math.floor(total / 12) + Math.floor(Math.random() * 100);
            distribution[m] = part;
            remaining -= part;
        }
    });
    return distribution;
};

const getEngineData = (empresaId, anio = '2025', mes) => {
    const stats = JSON.parse(fs.readFileSync(UPLOAD_STATS_FILE, 'utf8'));
    const total = stats.count || 24083;
    const distribution = getDistribution(total);

    const mesKey = mes ? mes.split('-')[1] : null;
    const totalMes = mesKey ? (distribution[mesKey] || 0) : 0;

    return {
        anual: {
            totalXml: total,
            totalImporte: total * 1500,
            totalIva: total * 1500 * 0.16
        },
        mensual: Object.keys(distribution).reduce((acc, m) => {
            const count = distribution[m];
            acc[`${anio}-${m}`] = {
                totalXml: count,
                importe: count * 1500,
                iva: count * 1500 * 0.16,
                clientes: Math.floor(count * 0.1) || 5
            };
            return acc;
        }, {}),
        metricas: {
            cfdi_del_mes: totalMes,
            importe_total_mes: totalMes * 1500,
            clientes_activos: Math.floor(totalMes * 0.1) || 5,
            cargados_hoy: 0,
            total_general: total
        },
        resumen: Object.keys(distribution).map(m => ({
            mes: `${anio}-${m}`,
            total: distribution[m],
            importe_total: distribution[m] * 1500,
            clientes: Math.floor(distribution[m] * 0.1) || 5
        })),
        dominio: 'SENTINEL ENGINE v2',
        rol: 'FISCAL',
        tipo: 'GLOBAL',
        periodo: mes || `ANUAL ${anio}`
    };
};

app.get('/api/cfdi/emitidos/ingresos', (req, res) => {
    res.json(getEngineData(req.query.empresaId, req.query.anio, req.query.mes));
});

app.get('/api/cfdi/recibidos/gastos', (req, res) => {
    const data = getEngineData(req.query.empresaId, req.query.anio, req.query.mes);
    data.rol = 'RECEPTOR';
    data.tipo = 'GASTOS';
    res.json(data);
});

app.get('/api/cfdi/complementos-pago', (req, res) => {
    const { empresaId, periodo } = req.query;
    const data = getEngineData(empresaId, '2025', periodo);
    res.json({
        meta: {
            empresaId,
            empresaNombre: 'TRASLADOS DE VANGUARDIA SA DE CV',
            empresaRfc: 'TVA060209QL6',
            periodo,
            totalCFDI: data.metricas.cfdi_del_mes,
            pagados: Math.floor(data.metricas.cfdi_del_mes * 0.8),
            ppdSinComplemento: Math.floor(data.metricas.cfdi_del_mes * 0.2),
            pue: 0,
            riesgoFiscal: data.metricas.cfdi_del_mes > 0,
            mensajeRiesgo: "Se detectaron omisiones en complementos de pago PPD."
        },
        data: []
    });
});

app.get('/api/cfdi/detalle-mes/:empresaId/:mes/:dominio/:tipo', (req, res) => {
    const { mes, dominio, tipo } = req.params;
    const cfdis = [];
    const count = 50; // Siempre mostramos una muestra significativa
    for (let i = 0; i < count; i++) {
        cfdis.push({
            uuid: `550E8400-E29B-41D4-A716-${446655440000 + i}`,
            fecha: `${mes}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T10:00:00Z`,
            rfcEmisor: dominio === 'emitidos' ? 'TVA060209QL6' : 'PROV880101XYZ',
            nombreEmisor: dominio === 'emitidos' ? 'TRASLADOS DE VANGUARDIA SA DE CV' : 'PROVEEDOR LOGÍSTICO MX',
            rfcReceptor: dominio === 'recibidos' ? 'TVA060209QL6' : 'CLI990101ABC',
            nombreReceptor: dominio === 'recibidos' ? 'TRASLADOS DE VANGUARDIA SA DE CV' : 'CLIENTE ESTRATÉGICO SA',
            tipoCfdi: 'I',
            moneda: 'MXN',
            importeMxn: 1500,
            status: 'VIGENTE',
            complementos: []
        });
    }
    res.json({ success: true, cfdis });
});

// Mock Sentinel Summary
app.get('/api/stats/sentinel-summary', (req, res) => {
    const { empresaId, periodo, flujo } = req.query;
    const data = getEngineData(empresaId, '2025', periodo);
    res.json({
        empresaId,
        periodo,
        flujo,
        kpis: {
            ingresos: data.anual.totalImporte * 0.6,
            egresos: data.anual.totalImporte * 0.4,
            totalCfdis: data.anual.totalXml,
            perfilRiesgo: 'OPTIMO',
            vistaActiva: flujo
        },
        alertas: [
            { id: 1, tipo: 'INFO', titulo: 'Auditoría Anual Consistente', desc: `Visualizando ${data.anual.totalXml} registros consolidados.`, puntos: 0 }
        ],
        perfilRiesgo: 95,
        statusDistribucion: { validos: 98, cancelados: 2, error: 0 }
    });
});

// Mock de Alertas
app.get('/api/sentinel/alerts', (req, res) => {
    res.json([
        { id: '1', mensaje: 'Proveedor en lista negra del SAT (EFOS)', nivel: 'alta', fecha: new Date().toISOString() },
        { id: '2', mensaje: 'Factura con fecha futura detectada', nivel: 'media', fecha: new Date().toISOString() }
    ]);
});

// Importación XML masiva
const bulkUpload = multer();
app.post('/api/cfdi/importar-xml', bulkUpload.any(), (req, res) => {
    const stats = JSON.parse(fs.readFileSync(UPLOAD_STATS_FILE, 'utf8'));
    const added = req.files ? req.files.length : 1;
    stats.count += added;
    stats.lastUpdate = new Date().toISOString();
    fs.writeFileSync(UPLOAD_STATS_FILE, JSON.stringify(stats, null, 2));
    res.json({ success: true, nuevos: added, duplicados: 0, errores: 0 });
});

// Endpoints vacíos con estructura consistente
const emptyResponse = (req, res) => res.json({ success: true, data: [], message: 'Fallback Sentinel' });
app.get('/api/expedientes', emptyResponse);
app.get('/api/devoluciones', emptyResponse);
app.get('/api/bancos/movimientos', emptyResponse);
app.get('/api/cfdi/empres', (req, res) => res.redirect('/api/empresas'));

// Catch-all robusto
app.use('/api', (req, res) => {
    console.warn(`[WARN] Endpoint no implementado o movido: ${req.originalUrl}`);
    res.status(200).json({ success: true, data: [], infoContent: 'Sentinel Engine Fallback' });
});

app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 SENTINEL CORE ENGINE ACTIVADO`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📊 VISION ANUAL: HABILITADA`);
    console.log(`=========================================\n`);
});
