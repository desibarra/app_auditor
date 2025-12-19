import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Tag, Button, Dropdown, Menu } from 'antd';

interface Cfdi {
  uuid: string;
  fecha: string;
  emisorReceptor: string;
  monto: number;
  tipo: 'Ingreso' | 'Egreso';
  tipoGasto?: string;
  estadoExpediente: 'Completo' | 'En progreso' | 'Sin iniciar';
  riesgo: 'Alto' | 'Medio' | 'Bajo';
}

const ListaCFDI: React.FC = () => {
  const [data, setData] = useState<Cfdi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/cfdi/list');
        setData(response.data);
      } catch (err) {
        setError('Error al cargar la lista de CFDI.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      title: 'UUID',
      dataIndex: 'uuid',
      key: 'uuid',
      render: (text: string) => <a href={`/expediente/${text}`}>{text}</a>,
    },
    {
      title: 'Fecha Emisión',
      dataIndex: 'fecha',
      key: 'fecha',
    },
    {
      title: 'Emisor / Receptor',
      dataIndex: 'emisorReceptor',
      key: 'emisorReceptor',
    },
    {
      title: 'Monto Total',
      dataIndex: 'monto',
      key: 'monto',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: 'Ingreso' | 'Egreso') => (
        <Tag color={tipo === 'Ingreso' ? 'green' : 'red'}>{tipo}</Tag>
      ),
    },
    {
      title: 'Tipo de Gasto',
      dataIndex: 'tipoGasto',
      key: 'tipoGasto',
      render: (tipoGasto, record) => (
        record.tipo === 'Egreso' ? (
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="servicios">Servicios</Menu.Item>
                <Menu.Item key="publicidad">Publicidad</Menu.Item>
                <Menu.Item key="arrendamiento">Arrendamiento</Menu.Item>
                <Menu.Item key="intragrupo">Intragrupo</Menu.Item>
                <Menu.Item key="importaciones">Importaciones</Menu.Item>
                <Menu.Item key="otros">Otros</Menu.Item>
              </Menu>
            }
          >
            <Button>{tipoGasto || 'Seleccionar'}</Button>
          </Dropdown>
        ) : (
          '-'
        )
      ),
    },
    {
      title: 'Estado Expediente',
      dataIndex: 'estadoExpediente',
      key: 'estadoExpediente',
      render: (estado) => (
        <Tag color={estado === 'Completo' ? 'green' : estado === 'En progreso' ? 'yellow' : 'red'}>
          {estado}
        </Tag>
      ),
    },
    {
      title: 'Riesgo',
      dataIndex: 'riesgo',
      key: 'riesgo',
      render: (riesgo) => (
        <Tag color={riesgo === 'Alto' ? 'red' : riesgo === 'Medio' ? 'yellow' : 'green'}>
          {riesgo}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        record.tipo === 'Egreso' && record.estadoExpediente === 'Sin iniciar' ? (
          <Button type="primary" href={`/expediente/${record.uuid}`}>Crear expediente</Button>
        ) : (
          '-'
        )
      ),
    },
  ];

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Table columns={columns} dataSource={data} rowKey="uuid" pagination={{ pageSize: 10 }} />
  );
}

export default ListaCFDI;