import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Replace with your backend URL

interface Devolucion {
  id: string;
  rfcEmpresa: string;
  periodo: string;
  tipo: string;
  estado: string;
}

export const getDevoluciones = async (empresaId: string): Promise<Devolucion[]> => {
  const response = await axios.get(`${API_BASE_URL}/devoluciones-iva`, {
    params: { empresaId },
  });
  return response.data;
};

export const createDevolucion = async (data: Partial<Devolucion>): Promise<Devolucion> => {
  const response = await axios.post(`${API_BASE_URL}/devoluciones-iva`, data);
  return response.data;
};

export const getDevolucionDetail = async (id: string): Promise<Devolucion> => {
  const response = await axios.get(`${API_BASE_URL}/devoluciones-iva/${id}`);
  return response.data;
};

export const recalculateCedulas = async (id: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/devoluciones-iva/${id}/cedulas/recalcular`);
};