import React, { useEffect, useState } from 'react';
import { getDevolucionDetail, recalculateCedulas } from '../services/devolucionesIvaService';

interface Expediente {
  rfcEmpresa: string;
  periodo: string;
  tipo: string;
  estado: string;
  resumen: {
    totalBase: number;
    totalIVA: number;
  };
  cedulas: Array<{ tipoCedula: string; datos: { isDummy: boolean } }>;
}

interface DevolucionDetailProps {
  id: string;
}

const DevolucionDetail: React.FC<DevolucionDetailProps> = ({ id }) => {
  const [expediente, setExpediente] = useState<Expediente | null>(null);

  useEffect(() => {
    fetchExpedienteDetail();
  }, []);

  const fetchExpedienteDetail = async () => {
    const data = await getDevolucionDetail(id);
    setExpediente(data as Expediente);
  };

  const handleRecalculate = async () => {
    await recalculateCedulas(id);
    fetchExpedienteDetail();
  };

  if (!expediente) return <div>Cargando...</div>;

  if (!expediente.cedulas || expediente.cedulas.length === 0) {
    return (
      <div>
        <h1>Detalle de Expediente</h1>
        <p>No se han generado cédulas para este expediente.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Detalle de Expediente</h1>
      <div>
        <h2>Resumen</h2>
        <p>RFC: {expediente.rfcEmpresa}</p>
        <p>Periodo: {expediente.periodo}</p>
        <p>Tipo: {expediente.tipo}</p>
        <p>Estado: {expediente.estado}</p>
        <p>Total Base: {expediente.resumen.totalBase}</p>
        <p>Total IVA: {expediente.resumen.totalIVA}</p>
      </div>
      <button onClick={handleRecalculate}>Recalcular Cédulas</button>
    </div>
  );
};

export default DevolucionDetail;