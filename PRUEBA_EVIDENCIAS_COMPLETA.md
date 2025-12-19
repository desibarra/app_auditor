# 🎯 PRUEBA RÁPIDA - MÓDULO DE EVIDENCIAS COMPLETO

## ⚡ INICIO RÁPIDO (2 minutos)

### **1. Iniciar el Sistema**
```bash
# Terminal 1: Backend
cd apps/backend
npm run start:dev

# Terminal 2: Frontend
cd apps/frontend
npm run dev
```

---

## 🧪 FLUJO DE PRUEBA COMPLETO

### **Paso 1: Acceder al Sistema**
1. Abrir http://localhost:3000
2. Seleccionar una empresa del dropdown
3. Verificar que aparecen CFDIs en la tabla

---

### **Paso 2: Abrir un CFDI**
1. Hacer clic en cualquier fila de la tabla
2. El drawer se abre a la derecha
3. Verificar que muestra:
   - ✅ Información general del CFDI
   - ✅ Detalle fiscal (impuestos)
   - ✅ Estatus de expediente: 🔴 (0 documentos)
   - ✅ Sección "Evidencias de Materialidad"

---

### **Paso 3: Subir Primera Evidencia**

#### **Opción A: Drag & Drop**
1. Arrastrar un archivo PDF o imagen al área punteada
2. Verificar que aparece el preview (si es imagen)
3. Hacer clic en "📤 Subir Evidencia"
4. Ver la barra de progreso: 0% → 100%

#### **Opción B: Click para Seleccionar**
1. Hacer clic en el área punteada
2. Seleccionar un archivo
3. Hacer clic en "📤 Subir Evidencia"

**Resultado Esperado:**
- ✅ Mensaje de éxito
- ✅ Archivo aparece en "Documentos Adjuntos"
- ✅ Semáforo cambia a 🟡 (1 documento)
- ✅ Formulario se limpia automáticamente

---

### **Paso 4: Probar Preview de Archivo**

#### **Para PDF:**
1. Hacer clic en el botón 👁️ del PDF
2. Modal se abre en pantalla completa
3. PDF se muestra en el iframe
4. Hacer scroll en el PDF
5. Hacer clic en "⬇️ Descargar" (debe descargar)
6. Presionar ESC o hacer clic en "✕ Cerrar"

#### **Para Imagen:**
1. Hacer clic en el botón 👁️ de la imagen
2. Modal se abre con la imagen
3. Hacer clic en 🔍+ (acerca la imagen)
4. Hacer clic en 🔍− (aleja la imagen)
5. Hacer clic en "100%" (restablece zoom)
6. Presionar ESC para cerrar

---

### **Paso 5: Subir Más Evidencias**
1. Subir una segunda evidencia
2. Verificar que el semáforo sigue en 🟡 (2 documentos)
3. Subir una tercera evidencia
4. Verificar que el semáforo cambia a 🟢 (3 documentos)
5. Mensaje cambia a "Materialización completa"

---

### **Paso 6: Descargar Evidencia**
1. Hacer clic en el botón ⬇️ de cualquier evidencia
2. Verificar que el archivo se descarga
3. Abrir el archivo descargado
4. Verificar que es el archivo correcto

---

### **Paso 7: Eliminar Evidencia**
1. Hacer clic en el botón 🗑️ de una evidencia
2. Confirmar la eliminación
3. Verificar que desaparece de la lista
4. Verificar que el contador se actualiza
5. Verificar que el semáforo cambia de color

---

### **Paso 8: Cerrar y Reabrir**
1. Cerrar el drawer (botón ✕)
2. Verificar que vuelve a la tabla
3. Hacer clic en el mismo CFDI
4. Verificar que las evidencias siguen ahí
5. Verificar que el semáforo muestra el estado correcto

---

### **Paso 9: Verificar Contador en Tabla**
1. Cerrar el drawer
2. Ver la columna "Materialidad" en la tabla
3. Verificar que muestra el semáforo correcto (🔴/🟡/🟢)
4. Hacer clic en otro CFDI
5. Verificar que cada CFDI tiene su propio contador

---

## ✅ CHECKLIST DE PRUEBA

### **Upload**
- [ ] Drag & drop funciona
- [ ] Click para seleccionar funciona
- [ ] Preview de imágenes se muestra
- [ ] Validación de tipo funciona (solo PDF, JPG, PNG)
- [ ] Validación de tamaño funciona (máx. 10MB)
- [ ] Barra de progreso se muestra
- [ ] Formulario se limpia después de subir
- [ ] Mensaje de éxito se muestra

### **Lista**
- [ ] Evidencias se muestran en tarjetas
- [ ] Iconos correctos (📄 PDF, 🖼️ Imagen)
- [ ] Información completa (categoría, descripción, fecha)
- [ ] Botones visibles (👁️ ⬇️ 🗑️)

### **Preview**
- [ ] Modal se abre al hacer clic en 👁️
- [ ] PDF se muestra en iframe
- [ ] Imagen se muestra correctamente
- [ ] Zoom funciona (solo imágenes)
- [ ] Botón descargar funciona
- [ ] ESC cierra el modal
- [ ] Botón cerrar funciona

### **Descarga**
- [ ] Archivo se descarga al hacer clic en ⬇️
- [ ] Nombre de archivo es correcto
- [ ] Archivo descargado es válido

### **Eliminación**
- [ ] Confirmación se muestra
- [ ] Evidencia se elimina de la lista
- [ ] Contador se actualiza
- [ ] Semáforo cambia de color

### **Semáforo**
- [ ] 🔴 con 0 evidencias
- [ ] 🟡 con 1-2 evidencias
- [ ] 🟢 con 3+ evidencias
- [ ] Mensaje correcto en cada estado
- [ ] Actualización automática

### **Integración**
- [ ] Contador en tabla es correcto
- [ ] Cada CFDI tiene su propio contador
- [ ] Cambios se reflejan en tiempo real
- [ ] Drawer se puede cerrar y reabrir

---

## 🐛 TROUBLESHOOTING

### **Error: "No se pudo cargar la vista previa"**
**Solución:** Verificar que el backend esté corriendo y que MinIO esté configurado.

### **Error: "Error al subir archivo"**
**Solución:** 
1. Verificar que MinIO esté corriendo
2. Verificar que el bucket existe
3. Verificar variables de entorno

### **Semáforo no se actualiza**
**Solución:** Refrescar la página o cerrar y reabrir el drawer.

### **Preview no se muestra**
**Solución:** Verificar que el archivo existe en S3/MinIO.

---

## 🎯 CASOS DE PRUEBA ADICIONALES

### **Caso 1: Archivo Muy Grande**
1. Intentar subir un archivo de más de 10MB
2. Verificar que muestra error de validación

### **Caso 2: Tipo de Archivo No Permitido**
1. Intentar subir un archivo .docx o .xlsx
2. Verificar que muestra error de validación

### **Caso 3: Múltiples Evidencias del Mismo Tipo**
1. Subir 2 contratos diferentes
2. Verificar que ambos aparecen en la lista
3. Verificar que se pueden distinguir por descripción

### **Caso 4: Sin Descripción**
1. Subir evidencia sin descripción
2. Verificar que usa el nombre del archivo

### **Caso 5: Cambiar de Empresa**
1. Subir evidencias en Empresa A
2. Cambiar a Empresa B en el selector
3. Verificar que no aparecen las evidencias de Empresa A
4. Volver a Empresa A
5. Verificar que las evidencias siguen ahí

---

## ✨ RESULTADO ESPERADO

Al completar todas las pruebas, deberías tener:

✅ Sistema completamente funcional  
✅ Upload de evidencias con drag & drop  
✅ Preview de PDFs e imágenes  
✅ Descarga de archivos  
✅ Eliminación de evidencias  
✅ Semáforo de materialidad funcionando  
✅ Contador en tiempo real  
✅ Experiencia de usuario fluida  

---

## 🎊 ¡LISTO!

Si todas las pruebas pasan, el **Módulo de Evidencias** está funcionando perfectamente al **100%**.

---

**Tiempo de Prueba:** ~10 minutos  
**Última Actualización:** 2025-12-19 12:00
