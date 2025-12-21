export const DEMO_METRICAS = {
    cfdi_del_mes: 154,
    importe_total_mes: 4528900.50,
    clientes_activos: 12,
    cargados_hoy: 5,
    total_general: 4528900.50
};

export const DEMO_RESUMEN = [
    { mes: '2025-01', total: 10, importe_total: 120000, clientes: 2 },
    { mes: '2025-02', total: 15, importe_total: 150000, clientes: 3 },
    { mes: '2025-03', total: 20, importe_total: 200000, clientes: 5 },
    { mes: '2025-04', total: 18, importe_total: 180000, clientes: 4 },
    { mes: '2025-05', total: 25, importe_total: 250000, clientes: 6 },
    { mes: '2025-06', total: 30, importe_total: 300000, clientes: 8 },
    { mes: '2025-07', total: 40, importe_total: 450000, clientes: 10 },
    { mes: '2025-08', total: 120, importe_total: 1200000, clientes: 12 },
    { mes: '2025-09', total: 154, importe_total: 4528900.50, clientes: 15 }, // Mes actual demo
    { mes: '2025-10', total: 0, importe_total: 0, clientes: 0 },
    { mes: '2025-11', total: 0, importe_total: 0, clientes: 0 },
    { mes: '2025-12', total: 0, importe_total: 0, clientes: 0 },
];

export const DEMO_CFDI_LIST = [
    {
        uuid: 'DEMO-8745-AC33-F123',
        serie: 'A',
        folio: '1001',
        fecha: '2025-09-15T12:00:00',
        tipo_comprobante: 'I',
        moneda: 'MXN',
        tipo_cambio: 1,
        total: 125000.00,
        rfc_emisor: 'TRL980520REQ',
        nombre_emisor: 'TRASLADOS DE VANGUARDIA SA DE CV',
        rfc_receptor: 'GEN800101UA2',
        nombre_receptor: 'CLIENTE GENERAL S.A.',
        estado_sat: 'Vigente',
        version: '4.0',
        xmlOriginal: '<cfdi:Comprobante ...> <cfdi:Complemento><cartaportemx:CartaPorte .../></cfdi:Complemento></cfdi:Comprobante>'
    },
    {
        uuid: 'DEMO-9999-USD-BIG',
        serie: 'EXP',
        folio: '500',
        fecha: '2025-09-10T14:30:00',
        tipo_comprobante: 'I',
        moneda: 'USD',
        tipo_cambio: 19.50,
        total: 15000.00,
        rfc_emisor: 'TRL980520REQ',
        nombre_emisor: 'TRASLADOS DE VANGUARDIA SA DE CV',
        rfc_receptor: 'INT900101000',
        nombre_receptor: 'INTERNATIONAL LOGISTICS INC',
        estado_sat: 'Vigente',
        version: '4.0',
        xmlOriginal: '<cfdi:Comprobante Moneda="USD" Total="15000.00" ... />'
    },
    // Rellenos para paginación
    ...Array.from({ length: 23 }).map((_, i) => ({
        uuid: `FILL-${i}-2025`,
        serie: 'F',
        folio: `${2000 + i}`,
        fecha: `2025-09-${(i % 30) + 1}T10:00:00`,
        tipo_comprobante: 'I',
        moneda: 'MXN',
        tipo_cambio: 1,
        total: 5000 + (i * 100),
        rfc_emisor: 'TRL980520REQ',
        nombre_emisor: 'TRASLADOS DE VANGUARDIA SA DE CV',
        rfc_receptor: 'CLI990909ABC',
        nombre_receptor: 'CLIENTE DISTRIBUIDOR S.A.',
        estado_sat: 'Vigente',
        version: '4.0',
        xmlOriginal: '<cfdi:Comprobante ... />'
    }))
];

export const DEMO_DASHBOARD_DATA = {
    alertasActivas: {
        alta: 3,
        media: 12
    },
    historico: DEMO_RESUMEN.map(r => ({
        mes: r.mes,
        ingresos: r.importe_total,
        egresos: r.importe_total * 0.7, // Simulado 70% margen
        fecha: r.mes + '-01'
    }))
};
