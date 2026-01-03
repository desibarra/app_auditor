import { RiskEngineService } from '../../../src/modules/risk/risk.service';
import { DatabaseService } from '../../../src/database/database.service';

describe('RiskEngineService Integration - validateCFDIREPConsistency', () => {
  let riskEngineService: RiskEngineService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.connect();

    riskEngineService = new RiskEngineService(databaseService);
  });

  afterAll(async () => {
    await databaseService.disconnect();
  });

  it('should insert findings into hallazgos_discrepancias table', async () => {
    const cfdiXmlRaw = '<cfdi><ObjetoImp>02</ObjetoImp></cfdi>'; // Mock CFDI XML
    const repXmlRaw = '<rep><ObjetoImpDR>01</ObjetoImpDR></rep>'; // Mock REP XML

    const result = await riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);

    const findings = await databaseService.query('SELECT * FROM hallazgos_discrepancias WHERE type = $1', ['ObjetoImpMismatch']);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      type: 'ObjetoImpMismatch',
    });
  });

  it('should update the score correctly', async () => {
    const cfdiXmlRaw = '<cfdi><Base>1000</Base></cfdi>'; // Mock CFDI XML
    const repXmlRaw = '<rep><Base>900</Base></rep>'; // Mock REP XML

    await riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);

    const score = await databaseService.query('SELECT score FROM dashboard WHERE id = $1', [1]);

    expect(score[0].score).toBeLessThan(100); // Assuming score decreases on discrepancies
  });

  it('should reflect findings in the dashboard', async () => {
    const cfdiXmlRaw = '<cfdi><ObjetoImp>02</ObjetoImp></cfdi>'; // Mock CFDI XML
    const repXmlRaw = '<rep><ObjetoImpDR>01</ObjetoImpDR></rep>'; // Mock REP XML

    await riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);

    const dashboard = await databaseService.query('SELECT * FROM dashboard WHERE discrepancies > 0');

    expect(dashboard).toHaveLength(1);
  });

  it('should include findings in Excel and PDF reports', async () => {
    const cfdiXmlRaw = '<cfdi><ObjetoImp>02</ObjetoImp></cfdi>'; // Mock CFDI XML
    const repXmlRaw = '<rep><ObjetoImpDR>01</ObjetoImpDR></rep>'; // Mock REP XML

    await riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);

    const excelReport = await databaseService.query('SELECT * FROM reports WHERE format = $1', ['excel']);
    const pdfReport = await databaseService.query('SELECT * FROM reports WHERE format = $1', ['pdf']);

    expect(excelReport[0].content).toContain('ObjetoImpMismatch');
    expect(pdfReport[0].content).toContain('ObjetoImpMismatch');
  });

  it('should validate large datasets and ensure database consistency', async () => {
    const cfdiXmlRaw = '<cfdi><UUID>123</UUID></cfdi>'; // Mock CFDI XML
    const repXmls = Array.from({ length: 1000 }, (_, i) => `<rep><UUID>123</UUID><ObjetoImpDR>${i % 2 === 0 ? '01' : '02'}</ObjetoImpDR></rep>`);

    for (const repXmlRaw of repXmls) {
      await riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);
    }

    const findings = await databaseService.query('SELECT * FROM hallazgos_discrepancias WHERE type = $1', ['ObjetoImpMismatch']);
    const expectedFindings = repXmls.filter(rep => rep.includes('<ObjetoImpDR>02</ObjetoImpDR>')).length;

    expect(findings).toHaveLength(expectedFindings);
  });
});