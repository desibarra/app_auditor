import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Select, Upload, Button, Progress, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface CfdiData {
  uuid: string;
  emisor: string;
  receptor: string;
  monto: number;
  tipoGasto?: string;
  notas?: string;
}

interface ExpedienteDetailProps {
  uuid: string;
}

const ExpedienteDetail: React.FC<ExpedienteDetailProps> = ({ uuid }) => {
  const [cfdiData, setCfdiData] = useState<CfdiData | null>(null);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchCfdiData = async () => {
      try {
        const response = await axios.get(`/api/cfdi/${uuid}`);
        setCfdiData(response.data);
      } catch (err) {
        message.error('Error al cargar datos del CFDI.');
      }
    };

    fetchCfdiData();
  }, [uuid]);

  const handleFileUpload = async (options: any) => {
    const { file } = options;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uuid', uuid);

    try {
      await axios.post('/api/expediente/upload', formData);
      setFiles((prev) => [...prev, file]);
      message.success(`${file.name} subido exitosamente.`);
    } catch (err) {
      message.error(`Error al subir ${file.name}.`);
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post(`/api/expediente/${uuid}/complete`);
      message.success('Expediente marcado como completo.');
    } catch (err) {
      message.error('Error al marcar expediente como completo.');
    }
  };

  const calculateProgress = () => {
    let progress = 0;
    if (cfdiData?.tipoGasto) progress += 30;
    if (files.some((file) => file.type === 'contrato')) progress += 40;
    if (files.some((file) => file.type === 'pago')) progress += 30;
    setProgress(progress);
  };

  useEffect(() => {
    calculateProgress();
  }, [cfdiData, files]);

  return (
    <div className="expediente-detail">
      <h2>Expediente de Materialidad</h2>
      {cfdiData && (
        <div className="cfdi-info">
          <p><strong>UUID:</strong> {cfdiData.uuid}</p>
          <p><strong>Emisor:</strong> {cfdiData.emisor}</p>
          <p><strong>Receptor:</strong> {cfdiData.receptor}</p>
          <p><strong>Monto:</strong> ${cfdiData.monto}</p>
        </div>
      )}

      <Form layout="vertical">
        <Form.Item label="Tipo de Gasto">
          <Select
            options={[
              { value: 'servicios', label: 'Servicios' },
              { value: 'publicidad', label: 'Publicidad' },
              { value: 'arrendamiento', label: 'Arrendamiento' },
              { value: 'intragrupo', label: 'Intragrupo' },
              { value: 'importaciones', label: 'Importaciones' },
              { value: 'otros', label: 'Otros' },
            ]}
            onChange={(value) => setCfdiData((prev) => ({ ...prev, tipoGasto: value }))}
          />
        </Form.Item>

        <Form.Item label="Notas Internas">
          <Input.TextArea rows={4} onChange={(e) => setCfdiData((prev) => ({ ...prev, notas: e.target.value }))} />
        </Form.Item>

        <Form.Item label="Carga de Documentos">
          <Upload customRequest={handleFileUpload} multiple>
            <Button icon={<UploadOutlined />}>Subir Archivos</Button>
          </Upload>
        </Form.Item>

        <div className="progress-bar">
          <Progress percent={progress} />
        </div>

        <Button type="primary" onClick={handleComplete} disabled={progress < 100}>
          Marcar como Completo
        </Button>
      </Form>
    </div>
  );
}

export default ExpedienteDetail;