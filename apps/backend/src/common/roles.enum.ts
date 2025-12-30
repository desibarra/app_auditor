export enum Role {
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
  LECTOR = 'LECTOR',
}

export const Permissions = {
  INICIAR_ANALISIS: [Role.ADMIN, Role.AUDITOR],
  RE_ANALIZAR_PERIODO: [Role.ADMIN, Role.AUDITOR],
  GENERAR_PDF_EXCEL: [Role.ADMIN, Role.AUDITOR],
  VER_RESULTADOS: [Role.ADMIN, Role.AUDITOR, Role.LECTOR],
};