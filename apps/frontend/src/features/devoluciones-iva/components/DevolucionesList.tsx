import React, { useEffect, useState } from 'react';
import { getDevoluciones, createDevolucion } from '../services/devolucionesIvaService';

interface Devolucion {
  id: string;
  rfcEmpresa: string;
  periodo: string;
  tipo: string;
  estado: string;
}

interface FormData {
  rfcEmpresa: string;
  periodo: string;
  tipo: string;
}

const DevolucionesList: React.FC = () => {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({ rfcEmpresa: '', periodo: '', tipo: '' });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    fetchDevoluciones();
  }, []);

  const fetchDevoluciones = async () => {
    const data = await getDevoluciones('ABC123456789'); // Replace with dynamic empresaId
    setDevoluciones(data);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.rfcEmpresa) newErrors.rfcEmpresa = 'El RFC de la empresa es obligatorio.';
    if (!formData.periodo.match(/^\d{4}-\d{2}$/)) newErrors.periodo = 'El periodo debe tener el formato YYYY-MM.';
    if (!formData.tipo) newErrors.tipo = 'El tipo de devolución es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await createDevolucion(formData);
    setShowForm(false);
    fetchDevoluciones();
  };

  return (
    <div>
      <h1>Devoluciones de IVA</h1>
      <div style={{ backgroundColor: '#e7f3ff', padding: '10px', marginBottom: '20px', border: '1px solid #b3d4fc' }}>
        <p>
          Este módulo está diseñado para ayudar a las PyMEs y despachos a preparar papeles de trabajo para solicitudes de devolución de IVA, incluyendo cédulas, expedientes y exportación de documentos.
        </p>
      </div>
      {showForm && (
        <form onSubmit={handleCreate}>
          <div>
            <input
              type="text"
              placeholder="RFC Empresa"
              value={formData.rfcEmpresa}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, rfcEmpresa: e.target.value })
              }
            />
            {errors.rfcEmpresa && <span style={{ color: 'red' }}>{errors.rfcEmpresa}</span>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Periodo (YYYY-MM)"
              value={formData.periodo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, periodo: e.target.value })
              }
            />
            {errors.periodo && <span style={{ color: 'red' }}>{errors.periodo}</span>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Tipo"
              value={formData.tipo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
            />
            {errors.tipo && <span style={{ color: 'red' }}>{errors.tipo}</span>}
          </div>
          <button type="submit">Crear</button>
        </form>
      )}
      <button onClick={() => setShowForm(true)}>Crear nuevo expediente</button>
      <table>
        <thead>
          <tr>
            <th>RFC</th>
            <th>Periodo</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {devoluciones.map((devolucion) => (
            <tr key={devolucion.id}>
              <td>{devolucion.rfcEmpresa}</td>
              <td>{devolucion.periodo}</td>
              <td>{devolucion.tipo}</td>
              <td>{devolucion.estado}</td>
              <td>
                <button onClick={() => console.log(`Go to detail ${devolucion.id}`)}>
                  Ver Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DevolucionesList;