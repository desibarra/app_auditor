import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface ChartData {
  month: string;
  ingresos: number;
  egresos: number;
}

const IngresosEgresosChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/dashboard/ingresos-egresos');
        setData(response.data);
      } catch (err) {
        setError('Error al cargar datos de ingresos y egresos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="ingresos" fill="#82ca9d" />
        <Bar dataKey="egresos" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IngresosEgresosChart;