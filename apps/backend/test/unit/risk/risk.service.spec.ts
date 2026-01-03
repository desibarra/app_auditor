import { RiskEngineService } from '../../../src/modules/risk/risk.service';

describe('RiskEngineService - validateCFDIREPConsistency', () => {
  let riskEngineService: RiskEngineService;

  beforeEach(() => {
    riskEngineService = new RiskEngineService();
  });

  it('should return no findings for valid CFDI and REP consistency', () => {
    const cfdiXmlRaw = '<cfdi>...</cfdi>'; // Mock valid CFDI XML
    const repXmlRaw = '<rep>...</rep>'; // Mock valid REP XML

    const result = riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);

    expect(result.findings).toHaveLength(0);
    expect(result.scoreImpact).toBe(0);
  });

  it('should detect mismatch in ObjetoImp and ObjetoImpDR', () => {
    const cfdiXmlRaw = '<cfdi><ObjetoImp>02</ObjetoImp></cfdi>'; // Mock CFDI XML
    const repXmlRaw = '<rep><ObjetoImpDR>01</ObjetoImpDR></rep>'; // Mock REP XML

    const result = riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      type: 'ObjetoImpMismatch',
    });
    expect(result.scoreImpact).toBeGreaterThan(0);
  });

  it('should handle malformed XML inputs gracefully', () => {
    const cfdiXmlRaw = '<cfdi><malformed>'; // Malformed CFDI XML
    const repXmlRaw = '<rep><malformed>'; // Malformed REP XML

    expect(() => {
      riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);
    }).toThrowError('Invalid XML format');
  });

  it('should detect discrepancies in bases declared in REP and CFDI', () => {
    const cfdiXmlRaw = '<cfdi><Base>1000</Base></cfdi>'; // Mock CFDI XML
    const repXmlRaw = '<rep><Base>900</Base></rep>'; // Mock REP XML

    const result = riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      type: 'BaseMismatch',
    });
    expect(result.scoreImpact).toBeGreaterThan(0);
  });

  it('should validate multiple REPs for a single CFDI', () => {
    const cfdiXmlRaw = '<cfdi><UUID>123</UUID></cfdi>'; // Mock CFDI XML
    const repXmlRaw1 = '<rep><UUID>123</UUID><ObjetoImpDR>01</ObjetoImpDR></rep>'; // Mock REP XML 1
    const repXmlRaw2 = '<rep><UUID>123</UUID><ObjetoImpDR>02</ObjetoImpDR></rep>'; // Mock REP XML 2

    const result1 = riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw1);
    const result2 = riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw2);

    expect(result1.findings).toHaveLength(0);
    expect(result2.findings).toHaveLength(1);
    expect(result2.findings[0]).toMatchObject({
      type: 'ObjetoImpMismatch',
    });
  });

  it('should handle large datasets efficiently', () => {
    const cfdiXmlRaw = '<cfdi><UUID>123</UUID></cfdi>'; // Mock CFDI XML
    const repXmls = Array.from({ length: 1000 }, (_, i) => `<rep><UUID>123</UUID><ObjetoImpDR>${i % 2 === 0 ? '01' : '02'}</ObjetoImpDR></rep>`);

    repXmls.forEach((repXmlRaw) => {
      const result = riskEngineService.validateCFDIREPConsistency(cfdiXmlRaw, repXmlRaw);
      if (repXmlRaw.includes('<ObjetoImpDR>02</ObjetoImpDR>')) {
        expect(result.findings).toHaveLength(1);
      } else {
        expect(result.findings).toHaveLength(0);
      }
    });
  });
});