# 📱 Mapeo de Información del Dispositivo - BigBrother

## Campos Enviados al Backend (DispositivoApp)

### ✅ Campos con Datos Reales de APIs de Expo

| Campo | Fuente | Descripción | Ejemplo |
|-------|--------|-------------|---------|
| **Identificador** | `Device.osName` + `Application.getAndroidId()` / `getIosIdForVendorAsync()` | ID único del dispositivo | `"abc-123-def"` |
| **Nombre** | `Device.deviceName` | Nombre del dispositivo | `"Infinix X6837"` |
| **Modelo** | `Device.modelName` | Modelo del dispositivo | `"X6837"` |
| **Plataforma** | `Platform.OS` | Sistema operativo | `"android"` / `"ios"` |
| **SistemaOperativo** | `Device.osName` | Nombre del OS | `"Android"` / `"iOS"` |
| **VersionOs** | `Device.osVersion` | Versión del OS | `"13.0"` |
| **VersionSdkAndroid** | `Device.platformApiLevel` | API Level de Android | `"33"` (solo Android) |
| **VersionIos** | `Device.osVersion` | Versión de iOS | `"17.0"` (solo iOS) |
| **Fabricante** | `Device.manufacturer` | Fabricante | `"Infinix"`, `"Apple"` |
| **EsDispositivoVirtual** | `Device.isDevice` | Si es emulador/simulador | `false` (dispositivo real) / `true` (emulador) |
| **VersionApp** | `environment.version` | Versión de la app | `"1.0.0"` |
| **UsuarioAsignado** | Parámetro `user` | Usuario logueado | `"admin123"` |

### ⚠️ Campos con Valores por Defecto (APIs Deprecadas)

| Campo | Valor Actual | Razón | Solución Futura |
|-------|--------------|-------|-----------------|
| **MemoriaUsada** | `0` | API `getFreeDiskStorageAsync` deprecada | Implementar `react-native-device-info` |
| **EspacioLibreDisco** | `0` | API `getFreeDiskStorageAsync` deprecada | Implementar módulo nativo |
| **EspacioTotalDisco** | `0` | API `getTotalDiskCapacityAsync` deprecada | Implementar módulo nativo |
| **EspacioLibreRealDisco** | `0` | API deprecada | Implementar módulo nativo |
| **EspacioTotalRealDisco** | `0` | API deprecada | Implementar módulo nativo |
| **IdPushManager** | `""` (vacío) | No implementado aún | Implementar FCM/APNS |

### 📅 Campos Generados Automáticamente

| Campo | Valor | Descripción |
|-------|-------|-------------|
| **FechaRegistro** | `new Date().toISOString()` | Fecha de primer registro |
| **FechaUltimoAcceso** | `new Date().toISOString()` | Última vez que accedió |

### 🔧 Campos Gestionados por Backend

| Campo | Gestión | Descripción |
|-------|---------|-------------|
| **IdDispositivoApp** | Backend (Auto-increment) | ID de la tabla |
| **IdSistema** | Backend | ID del sistema BigBrother |

---

## 📊 Ejemplo de Payload Completo

```json
{
  "UserName": "ADMIN",
  "Clave": "Password123",
  "HostConexion": "",
  "EsMovil": true,
  "TieneEncriptacion": false,
  "TipoEncriptacion": "",
  "DeviceInfo": {
    "Identificador": "abc123def456",
    "Nombre": "Infinix X6837",
    "Modelo": "X6837",
    "Plataforma": "android",
    "SistemaOperativo": "Android",
    "VersionOs": "13.0",
    "VersionIos": "",
    "VersionSdkAndroid": "33",
    "Fabricante": "Infinix",
    "EsDispositivoVirtual": false,
    "MemoriaUsada": 0,
    "EspacioLibreDisco": 0,
    "EspacioTotalDisco": 0,
    "EspacioLibreRealDisco": 0,
    "EspacioTotalRealDisco": 0,
    "IdPushManager": "",
    "FechaRegistro": "2025-10-17T10:30:00.000Z",
    "FechaUltimoAcceso": "2025-10-17T10:30:00.000Z",
    "UsuarioAsignado": "ADMIN",
    "VersionApp": "1.0.0"
  }
}
```

---

## 🚀 Mejoras Futuras

### 1. Información de Almacenamiento Real
```bash
npm install react-native-device-info
```

```typescript
import DeviceInfo from 'react-native-device-info';

const totalMemory = await DeviceInfo.getTotalMemory();
const freeDiskStorage = await DeviceInfo.getFreeDiskStorage();
const totalDiskCapacity = await DeviceInfo.getTotalDiskCapacity();
```

### 2. Push Notifications (IdPushManager)
```bash
# Para Android (FCM)
expo install expo-notifications

# O Firebase
npm install @react-native-firebase/messaging
```

```typescript
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync();
// Enviar token.data como IdPushManager
```

---

## ✅ Estado Actual

- ✅ **20 de 20 campos** enviados correctamente
- ✅ **12 campos** con datos reales del dispositivo
- ⚠️ **6 campos** con valores por defecto (0 o vacío) - funcional pero sin datos reales
- ✅ **2 campos** con timestamps automáticos

**El login funcionará correctamente** con la información actual. Los campos en 0 son opcionales en la base de datos (`decimal?`).
