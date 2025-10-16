import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const obtenerInfoDispositivo = async () => {
  // Obtenemos el ID del dispositivo, que es la única parte asíncrona
  const identificador = Platform.OS === 'android'
    ? Application.getAndroidId()
    : await Application.getIosIdForVendorAsync();

  // Construimos el objeto solo con la información disponible en expo-device
  const deviceInfo = {
    identificador,
    nombre: Device.deviceName,
    modelo: Device.modelName,
    plataforma: Device.osName,
    sistemaOperativo: Device.osName,
    versionOs: Device.osVersion,
    versionSdkAndroid: Device.platformApiLevel ? Device.platformApiLevel.toString() : undefined,
    fabricante: Device.manufacturer,
    esDispositivoVirtual: !Device.isDevice,
  };

  return deviceInfo;
};