import { Test, TestingModule } from '@nestjs/testing';
import { DevolucionesIvaService } from '../../../src/modules/devoluciones-iva/devoluciones-iva.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { expedientesDevolucionIva } from '../../../src/database/schema/expedientes_devolucion_iva';
import { NotFoundException } from '@nestjs/common';

const mockExpedientesRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('DevolucionesIvaService', () => {
  let service: DevolucionesIvaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevolucionesIvaService,
        {
          provide: getRepositoryToken(expedientesDevolucionIva),
          useValue: mockExpedientesRepository,
        },
      ],
    }).compile();

    service = module.get<DevolucionesIvaService>(DevolucionesIvaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExpediente', () => {
    it('should create and return a new expediente', async () => {
      const dto = { rfcEmpresa: 'ABC123456789', periodo: '2025-12', tipo: 'saldos a favor de IVA' };
      const savedExpediente = { id: 1, ...dto, estado: 'Borrador' };

      mockExpedientesRepository.create.mockReturnValue(savedExpediente);
      mockExpedientesRepository.save.mockResolvedValue(savedExpediente);

      const result = await service.createExpediente(dto);

      expect(mockExpedientesRepository.create).toHaveBeenCalledWith({
        rfcEmpresa: 'ABC123456789',
        periodo: '2025-12',
        tipo: 'saldos a favor de IVA',
        estado: 'Borrador',
      });
      expect(mockExpedientesRepository.save).toHaveBeenCalledWith(savedExpediente);
      expect(result).toEqual(savedExpediente);
    });

    it('should throw NotFoundException if empresa does not exist', async () => {
      const dto = { rfcEmpresa: '', periodo: '2025-12', tipo: 'saldos a favor de IVA' };

      await expect(service.createExpediente(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listExpedientes', () => {
    it('should return a list of expedientes for a given empresaId', async () => {
      const empresaId = 'ABC123456789';
      const expedientes = [
        { id: 1, rfcEmpresa: empresaId, periodo: '2025-12', tipo: 'saldos a favor de IVA', estado: 'Borrador' },
      ];

      mockExpedientesRepository.find.mockResolvedValue(expedientes);

      const result = await service.listExpedientes(empresaId);

      expect(mockExpedientesRepository.find).toHaveBeenCalledWith({ where: { rfcEmpresa: empresaId } });
      expect(result).toEqual(expedientes);
    });

    it('should return an empty array if no expedientes are found', async () => {
      const empresaId = 'NON_EXISTENT';

      mockExpedientesRepository.find.mockResolvedValue([]);

      const result = await service.listExpedientes(empresaId);

      expect(mockExpedientesRepository.find).toHaveBeenCalledWith({ where: { rfcEmpresa: empresaId } });
      expect(result).toEqual([]);
    });
  });

  describe('generateCedulaIvaAcreditable', () => {
    it('should generate and save a basic IVA acreditable worksheet', async () => {
      const expedienteId = 1;
      const expediente = {
        id: expedienteId,
        rfcEmpresa: 'ABC123456789',
        periodo: '2025-12',
        tipo: 'saldos a favor de IVA',
        estado: 'Borrador',
      };

      const dummyCedula = {
        expedienteId,
        tipoCedula: 'IVA_ACREDITABLE',
        datos: [
          {
            proveedor: 'Proveedor 1',
            uuid: 'UUID1',
            base: 1000,
            iva: 160,
            total: 1160,
            fecha: '2025-12-01',
            formaPago: 'Transferencia',
            tipoGasto: 'Gasto General',
          },
        ],
      };

      mockExpedientesRepository.findOne.mockResolvedValue(expediente);
      mockExpedientesRepository.create.mockReturnValue(dummyCedula);
      mockExpedientesRepository.save.mockResolvedValue(dummyCedula);

      const result = await service.generateCedulaIvaAcreditable(expedienteId);

      expect(mockExpedientesRepository.findOne).toHaveBeenCalledWith({ where: { id: expedienteId } });
      expect(mockExpedientesRepository.save).toHaveBeenCalledWith(dummyCedula);
      expect(result).toEqual(dummyCedula);
    });

    it('should throw NotFoundException if expediente does not exist', async () => {
      const expedienteId = 999;

      mockExpedientesRepository.findOne.mockResolvedValue(null);

      await expect(service.generateCedulaIvaAcreditable(expedienteId)).rejects.toThrow(NotFoundException);
    });
  });
});