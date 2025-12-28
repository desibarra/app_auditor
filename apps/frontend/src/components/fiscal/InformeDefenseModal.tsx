import React, { useEffect, useState } from 'react';
import axios from 'axios';


interface DefenseReport {
    meta: {
        empresa: string;
        rfc: string;
        periodo: string;
        fechaGeneracion: string;
        hashIntegridad: string;
    };
    dictamen: {
        calificacion: 'GREEN' | 'YELLOW' | 'RED';
        etiqueta: string;
        justificacion: string;
        fundamentoLegal: string;
    };
    escenarioSAT: {
        tipoRevision: string;
        probabilidad: string;
        focoAtencion: string;
    };
    resumenNumerico: {
        totalEmitidos: number;
        totalRecibidos: number;
        ivaTrasladado: number;
        ivaAcreditable: number;
        proporcionIVA: number;
        saldoFavor: number;
    };
    checklist: {
        tecnica: boolean;
        fiscal: boolean;
        materialidad: boolean;
        listasNegras: boolean;
    }[];
    riesgosDetectados: string[];
    avisoLegal: string;
    conclusion: string;
}

interface InformeDefenseModalProps {
    empresaId: string; // Para volver a fetchear si es necesario o pasar datos
    mes: string;
    isOpen: boolean;
    onClose: () => void;
}

const InformeDefenseModal: React.FC<InformeDefenseModalProps> = ({ empresaId, mes, isOpen, onClose }) => {
    const [report, setReport] = useState<DefenseReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && empresaId && mes) {
            fetchReport();
        }
    }, [isOpen, empresaId, mes]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/cfdi/defense-report', {
                params: { empresaId, mes }
            });
            setReport(response.data);
        } catch (err: any) {
            console.error(err);
            setError('Error generando el informe de defensa.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-90 backdrop-blur-sm flex justify-center items-start pt-10 px-4 pb-20 print:p-0 print:bg-white print:static print:overflow-visible print:block">
            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">

                {/* Header Actions (No Print) */}
                <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center print:hidden">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        🛡️ Informe Mensual SAT-Grade
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold transition-colors">
                            🖨️ Imprimir / PDF
                        </button>
                        <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-900"></div>
                        <p className="mt-4 text-gray-600 font-bold animate-pulse">Generando Dictamen Forense...</p>
                        <p className="text-xs text-gray-400 mt-2">Analizando materialidad y coherencia fiscal</p>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center">
                        <p className="text-red-600 font-bold text-xl">⚠️ {error}</p>
                        <button onClick={onClose} className="mt-4 text-indigo-600 underline">Cerrar</button>
                    </div>
                ) : report ? (
                    <div className="p-8 font-serif text-gray-900 print:p-0" id="report-content">
                        {/* ENCABEZADO OFICIAL */}
                        <div className="border-b-4 border-gray-900 pb-6 mb-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">
                                    Informe de Defensa Fiscal
                                </h1>
                                <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                    Análisis de Viabilidad de Devolución de IVA • RMF 2026
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase">Expediente Digital</p>
                                <p className="font-mono text-lg font-bold">{report.meta.rfc}</p>
                                <p className="text-sm text-gray-600">{report.meta.periodo}</p>
                                {(report.meta as any).reglasAplicadas && (
                                    <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                        {(report.meta as any).reglasAplicadas}
                                    </p>
                                )}
                                <p className="text-[10px] font-mono text-gray-400 mt-2">HASH: {report.meta.hashIntegridad?.substring(0, 16)}...</p>
                            </div>
                        </div>

                        {/* I. DICTAMEN EJECUTIVO */}
                        <section className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 mb-4 pb-1">I. Dictamen Ejecutivo</h3>
                            <div className={`p-6 rounded-lg border-l-8 shadow-sm ${report.dictamen.calificacion === 'GREEN' ? 'bg-green-50 border-green-600' :
                                report.dictamen.calificacion === 'YELLOW' ? 'bg-yellow-50 border-yellow-500' :
                                    'bg-red-50 border-red-600'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`text-2xl font-black ${report.dictamen.calificacion === 'GREEN' ? 'text-green-800' :
                                            report.dictamen.calificacion === 'YELLOW' ? 'text-yellow-800' :
                                                'text-red-800'
                                            }`}>
                                            {report.dictamen.etiqueta}
                                        </h4>
                                        <p className="mt-2 font-bold text-gray-800 text-lg">
                                            {report.dictamen.justificacion}
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500 italic">
                                            Fundamento: {report.dictamen.fundamentoLegal || 'CFF Art 22, RMF 2.3.9'}
                                        </p>
                                    </div>
                                    <div className="text-4xl">
                                        {report.dictamen.calificacion === 'GREEN' ? '🛡️' :
                                            report.dictamen.calificacion === 'YELLOW' ? '⚠️' : '⛔'}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* II. RESUMEN FINANCIERO */}
                        <section className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 mb-4 pb-1">II. Resumen Financiero (Base IVA)</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">IVA Trasladado (Cobrado)</p>
                                    <p className="text-xl font-mono font-bold text-gray-900 mt-1">{formatCurrency(report.resumenNumerico.ivaTrasladado)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">IVA Acreditable (Pagado)</p>
                                    <p className="text-xl font-mono font-bold text-gray-900 mt-1">{formatCurrency(report.resumenNumerico.ivaAcreditable)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Saldo Calculado</p>
                                    <p className={`text-xl font-mono font-bold mt-1 ${report.resumenNumerico.saldoFavor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(report.resumenNumerico.saldoFavor)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 uppercase">{report.resumenNumerico.saldoFavor > 0 ? 'A FAVOR' : 'A CARGO'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Proporción IVA</p>
                                    <p className={`text-xl font-mono font-bold mt-1 ${report.resumenNumerico.proporcionIVA > 1.1 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {(report.resumenNumerico.proporcionIVA * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-[10px] text-gray-400 uppercase">Ratio Acreditable/Trasladado</p>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-8">
                            {/* III. RIESGOS DETECTADOS */}
                            <section className="mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 mb-4 pb-1">III. Riesgos y Brechas</h3>
                                {report.riesgosDetectados.length > 0 ? (
                                    <ul className="space-y-2">
                                        {report.riesgosDetectados.map((riesgo, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100">
                                                <span className="font-bold">×</span> {riesgo}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-4 bg-green-50 text-green-800 text-sm rounded border border-green-100 flex items-center gap-2">
                                        <span>✓</span> No se detectaron riesgos críticos en la muestra.
                                    </div>
                                )}
                            </section>

                            {/* IV. ESCENARIO SAT */}
                            <section className="mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 mb-4 pb-1">IV. Escenario SAT Probable</h3>
                                <div className="bg-indigo-50 p-4 rounded border border-indigo-100 text-indigo-900">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm uppercase">Tipo de Revisión:</span>
                                        <span className="font-black text-lg">{report.escenarioSAT.tipoRevision.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm uppercase">Probabilidad:</span>
                                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${report.escenarioSAT.probabilidad === 'ALTA' ? 'bg-red-200 text-red-900' :
                                            report.escenarioSAT.probabilidad === 'MEDIA' ? 'bg-yellow-200 text-yellow-900' :
                                                'bg-green-200 text-green-900'
                                            }`}>{report.escenarioSAT.probabilidad}</span>
                                    </div>
                                    <p className="text-xs mt-3 pt-3 border-t border-indigo-200 italic">
                                        "{report.escenarioSAT.focoAtencion}"
                                    </p>
                                </div>
                            </section>
                        </div>

                        {/* V. CONCLUSIÓN LEGAL */}
                        <section className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 mb-4 pb-1">V. Conclusión Legal</h3>
                            <div className="p-6 bg-gray-100 rounded-lg text-justify text-sm text-gray-800 font-medium leading-relaxed">
                                {report.conclusion}
                            </div>
                        </section>

                        {/* VI. AVISO LEGAL */}
                        <section className="mt-8 pt-8 border-t-2 border-gray-200 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Aviso Legal y Alcance</p>
                            <p className="text-[10px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
                                {report.avisoLegal}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-4 font-mono">
                                Generado por SENTINEL AUDITOR v2.0 • {report.meta.fechaGeneracion}
                            </p>
                        </section>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default InformeDefenseModal;
