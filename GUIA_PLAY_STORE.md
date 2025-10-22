# 📱 Guía para Publicar BigBrother en Google Play Store

## ✅ Prerequisitos Completados
- ✅ `app.json` configurado con package y permisos
- ✅ `eas.json` creado con perfiles de build
- ✅ Versión 2.1.2 configurada

---

## 🚀 Pasos para Publicar en Play Store

### 1️⃣ Instalar EAS CLI (si no lo tienes)
```powershell
npm install -g eas-cli
```

### 2️⃣ Iniciar Sesión en Expo
```powershell
eas login
```
Ingresa tus credenciales de Expo.

### 3️⃣ Configurar el Proyecto
```powershell
eas build:configure
```
Este comando creará automáticamente un proyecto en Expo si no existe.

### 4️⃣ Crear Keystore (Primera vez)
EAS creará automáticamente un keystore para ti. Cuando hagas el primer build, te preguntará:
```
Would you like to automatically create credentials for Android?
```
Responde: **Yes (Y)**

---

## 🏗️ Builds

### Build de Prueba (APK)
Para probar antes de subir:
```powershell
eas build --platform android --profile preview
```
Esto genera un APK que puedes instalar directamente en tu teléfono.

### Build de Producción (AAB)
Para subir a Play Store:
```powershell
eas build --platform android --profile production
```
Esto genera un `.aab` (Android App Bundle) optimizado para Play Store.

---

## 📦 Crear Cuenta de Google Play Console

### 1. Ve a [Google Play Console](https://play.google.com/console)
   - Crea una cuenta de desarrollador (costo único: $25 USD)
   - Completa la información de tu cuenta

### 2. Crear Nueva Aplicación
   - Click en "Create app"
   - Nombre: **BigBrother**
   - Idioma predeterminado: Español
   - Tipo: App
   - Gratuita/Paga: Gratuita

### 3. Completar Configuración de la App

#### a) Categoría de la App
   - Categoría: **Productividad** o **Herramientas**

#### b) Política de Privacidad
   Necesitas crear una URL con tu política de privacidad. Puedes usar:
   - GitHub Pages (gratis)
   - Tu sitio web
   - Generadores online como [PrivacyPolicies.com](https://www.privacypolicies.com/blog/privacy-policy-template/)

#### c) Contenido de la App
   - Completa el cuestionario sobre el contenido
   - Para BigBrother:
     - ✅ Contiene anuncios: No
     - ✅ Solicita permisos sensibles: Sí (Micrófono, Ubicación)
     - ✅ Dirigida a público: Adultos (mayores de 18)

#### d) Clasificación de Contenido
   - Completa el cuestionario IARC
   - BigBrother es una app de productividad sin contenido sensible

---

## 📸 Recursos Gráficos Necesarios

### Icono de la App
- ✅ **512x512 px** PNG (ya lo tienes en `assets/images/icon.png`)
- Debe ser cuadrado y sin transparencias

### Feature Graphic (Banner)
- 📐 **1024x500 px** PNG o JPG
- Se muestra en la parte superior de tu listing
- Crea uno con el logo de BigBrother y un texto descriptivo

### Capturas de Pantalla
Necesitas mínimo **2 capturas**, máximo **8**:
- 📱 **Tamaño**: 1080x1920 px o 1440x2560 px
- Toma screenshots de:
  1. Pantalla de login
  2. Pantalla de grabación (home)
  3. Historial de grabaciones
  4. Perfil de usuario

**Tip**: Usa un emulador o tu teléfono para tomar las capturas.

---

## 📝 Descripción de la App

### Título Corto (30 caracteres)
```
BigBrother - Grabación Pro
```

### Descripción Corta (80 caracteres)
```
Sistema de grabación inteligente para cumplimiento de protocolos en cobranzas
```

### Descripción Completa (4000 caracteres máx)
```
🎙️ BigBrother - Sistema de Grabación Inteligente

BigBrother es la aplicación profesional diseñada específicamente para el sector de cobranzas, que graba y asesora en tiempo real, asegurando el cumplimiento de protocolos y normativas.

✨ CARACTERÍSTICAS PRINCIPALES

📱 Grabación en Tiempo Real
• Captura automática de conversaciones
• Calidad de audio optimizada
• Gestión inteligente de almacenamiento

☁️ Sincronización Automática
• Respaldo automático en la nube
• Acceso desde cualquier dispositivo
• Historial completo de grabaciones

📊 Cumplimiento y Reportes
• Verificación de protocolos
• Reportes detallados
• Trazabilidad completa

🔒 Seguridad y Privacidad
• Encriptación de datos
• Autenticación segura
• Cumplimiento de normativas

🌍 Multi-país
• Soporte para Perú, Ecuador y Guatemala
• Adaptado a normativas locales

💼 IDEAL PARA

• Empresas de cobranza
• Centros de atención telefónica
• Gestores de cartera
• Supervisores de cobranza

🎯 BENEFICIOS

✓ Mejora el cumplimiento normativo
✓ Protege a tu empresa
✓ Optimiza procesos de cobranza
✓ Facilita la supervisión

Desarrollado por InventarTech
```

---

## 🚀 Subir el Build a Play Store

### Opción 1: Upload Manual

1. **Descargar el AAB**
   - Después del build, EAS te dará un link para descargar el `.aab`
   - Descárgalo a tu computadora

2. **Subir a Play Console**
   - Ve a Play Console → Tu App → Release → Production
   - Click en "Create new release"
   - Upload el archivo `.aab`
   - Completa las notas de la versión
   - Click en "Review release" y luego "Start rollout to Production"

### Opción 2: Automatic Submit (Recomendado)

1. **Crear Service Account en Google Cloud**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un Service Account
   - Descarga el JSON key como `google-play-service-account.json`
   - Colócalo en la raíz del proyecto

2. **Dar Permisos en Play Console**
   - Ve a Play Console → Setup → API access
   - Link el Service Account
   - Dale permisos de "Release Manager"

3. **Submit Automático**
   ```powershell
   eas submit --platform android --profile production
   ```

---

## 📋 Checklist Final

Antes de publicar, verifica:

- [ ] Icono 512x512 subido
- [ ] Feature graphic 1024x500 subido
- [ ] Mínimo 2 capturas de pantalla
- [ ] Descripción completa
- [ ] Política de privacidad configurada
- [ ] Categoría seleccionada
- [ ] Clasificación de contenido completada
- [ ] Datos de contacto actualizados
- [ ] AAB subido correctamente
- [ ] Notas de la versión escritas

---

## 🔄 Actualizaciones Futuras

Para publicar una nueva versión:

1. **Actualizar versión en `app.json`**:
   ```json
   "version": "1.0.1",
   "android": {
     "versionCode": 2
   }
   ```

2. **Hacer nuevo build**:
   ```powershell
   eas build --platform android --profile production
   ```

3. **Subir a Play Store** (igual que antes)

---

## 🆘 Solución de Problemas

### Error: "Package name already exists"
- Cambia el package en `app.json`: `"package": "com.inventartech.bigbrother2"`

### Error: "Keystore not found"
- Ejecuta: `eas credentials` y selecciona "Set up new Android Keystore"

### Build falla
- Verifica que todas las dependencias estén instaladas
- Ejecuta: `npm install` antes de hacer build

### App rechazada por Google
- Revisa los comentarios de Google en Play Console
- Ajusta lo necesario y vuelve a enviar

---

## 📞 Soporte

Si tienes dudas:
- [Expo Docs](https://docs.expo.dev/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

---

## 🎉 ¡Listo!

Una vez que Google apruebe tu app (puede tardar de 1 a 7 días), estará disponible en Play Store para que todos la descarguen.

**¡Buena suerte con BigBrother! 🚀**
