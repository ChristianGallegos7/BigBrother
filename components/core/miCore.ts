import { Buffer } from 'buffer';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { httpRequest } from '../../utils/http/http';
import { environment } from './environment';

function obtenerUrlApi(): string {
  return environment.urlApi[
    environment.pais as keyof typeof environment.urlApi
  ];
}

async function obtenerTokenAcceso() {
  try {
    const headers = {
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
      User: 'LAHtZlOAiX6gsC+r/fhoYg==',
      Password: 'GkVbAyLkZcagsC+r/fhoYg==',
    };

    // console.log('ANTES DE MANDAR RESPONSE')
    const url = `${environment.apiGateway.url}/Auth/obtenerToken`;

    console.log('URLGateway', url);
    environment.apiGateway.conexion.conectando = true;

    const response = await httpRequest({ url, method: "POST", headers, body: {} });
    console.log("TOKEN:" + response)
    console.log('RESPONSE', response);
    environment.apiGateway.conexion.conectando = false;

    response.data = JSON.parse(response.data || '{}')

    if (response.data.CodigoError || response.data.MensajeError) {
      const errorMessage = 'Error Conexión Gateway: ' + response.data.MensajeError;
      console.log('Error:', errorMessage);
      environment.apiGateway.conexion.conectado = false;
      environment.apiGateway.conexion.errorConexion = true;
      environment.apiGateway.conexion.mensajeError = errorMessage;
      throw { MensajeError: errorMessage, CodigoError: '504' };
    } else {
      console.log('Éxito');
      environment.apiGateway.conexion.conectado = true;
      environment.apiGateway.conexion.errorConexion = false;
      environment.apiGateway.token = response.data.Token;
      await SecureStore.setItem('TokenGateway', environment.apiGateway.token);
      //console.log('response', response.data);
      return response;
    }

  } catch (error: any) {
    console.log('Error:', error.message);
    environment.apiGateway.conexion.conectando = false;
    environment.apiGateway.conexion.conectado = false;
    environment.apiGateway.conexion.errorConexion = true;
    environment.apiGateway.conexion.mensajeError = error.message;
    throw {
      MensajeError:
        'Error de conexión hacia el API Gateway AAAA (' +
        environment.apiGateway.url +
        '/Auth/obtenerToken' +
        ')',
      CodigoError: '504',
    };
  }
}

async function obtenerTokenSinAccesoBigBrother() {
  try {
    const urlApi = obtenerUrlApi();
    const url = `${urlApi}/Auth/obtenerToken`;
    const headers = {
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
      User: 'ADMIN',
      Password: 'Abc.1234',
    };

    const response = await httpRequest({ url, method: "POST", headers, body: {} });

    if (response.data.CodigoError || response.data.MensajeError) {
      const errorMessage = 'Error Conexión Gateway: ' + response.data.MensajeError;
      console.log('Error :', errorMessage);
      throw { MensajeError: errorMessage, CodigoError: '504' };
    } else {
      console.log('Éxito');
      if (response.data.Token) {
        await SecureStore.setItem('Tokenbb', response.data.Token);
      }
      if (response.data.FechaVigencia) {
        await SecureStore.setItem('TokenExpiration', response.data.FechaVigencia);
      }
      console.log('response bb', response.data.Token);
      return response.data.token;
    }

  } catch (error: any) {
    console.log('Error :', error.message);
    if (error.response) {
      console.log('Error Data:', error.response.data);
      console.log('Error Status:', error.response.status);
      console.log('Error Headers:', error.response.headers);
    } else if (error.request) {
      console.log('Error Request:', error.request);
    } else {
      console.log('Error Message:', error.message);
    }
    return null;
  }
}

const generarCodigoDesbloqueo = async (userName: string) => {
  try {
    const urlApi = obtenerUrlApi();
    const url = `${urlApi}/Auth/generarCodigoDesbloqueo/${userName}`;

    const headers = {
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
    };

    console.log(`Enviando solicitud a: ${url} con headers:`, headers);

    const response = await httpRequest({ url, method: 'POST', headers, body: {} });

    console.log('Respuesta de la API:', response.data);

    if (response.data!.CodigoError || response.data!.MensajeError) {
      const errorMessage =
        'Error Generando Código: ' + response.data.MensajeError;
      console.log('Error :', errorMessage);
      throw { MensajeError: errorMessage, CodigoError: '504' };
    } else {
      console.log('Éxito');
      return response.data;
    }
  } catch (error: any) {
    console.log('Error en generarCodigoDesbloqueo:', error.message);
    throw error;
  }
};

const validarCodigoDesbloqueo = async (userName: string, codigo: string) => {
  try {
    const urlApi = obtenerUrlApi();
    const url = `${urlApi}/Auth/validarCodigoDesbloqueo/${userName}/${codigo}`;

    const headers = {
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
    };

    const response = await httpRequest({ url, method: "POST", headers, body: {} });

    if (response.data.CodigoError || response.data.MensajeError) {
      throw new Error(response.data.MensajeError || 'Error desconocido');
    }

    return response.data;
  } catch (error) {
    console.error('Error al validar el código de desbloqueo:', error);
    throw error;
  }
};

async function obtenerTokenAccesoBigBrother(user: any, pass: any) {
  try {
    const urlApi = obtenerUrlApi();
    const url = `${urlApi}/Auth/obtenerToken`;
    console.log('URL -> ', url);
    //environment.apiGateway.conexion.conectando = true;
    //(url)
    const headers = {
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
      User: encodeURIComponent(user),
      Password: encodeURIComponent(pass),
    };

    const response = await httpRequest({ url, method: "POST", headers, body: {} });

    console.log(response)
    if (response.data.CodigoError || response.data.MensajeError) {
      const errorMessage = 'Error Conexión: ' + response.data.MensajeError;
      console.log('Error :', errorMessage);
      throw { MensajeError: errorMessage, CodigoError: '504' };
    } else {
      console.log('Éxito');
      if (response.data.Token) {
        await SecureStore.setItem('Tokenbb', response.data.Token);
      }
      //await SecureStore.setItem('Tokenbb', response.data);
      console.log('response bb', response.data.Token);
      return {
        esOk: true,
        token: response.data.Token,
      };
    }
  } catch (error: any) {
    console.error('Error al iniciar sesión:', error);
    const mensajeError = error?.MensajeError || error?.message || 'Error de conexión con el servidor';
    return {
      esOk: false,
      token: mensajeError,
    };
  }
}

async function IniciarSesionApp(user: string, pass: string, navigation: any) {
  // ----------------------------------------------------------------------
  // COMIENZO DE ADAPTACIÓN: Uso de expo-device, expo-application y expo-file-system
  // ----------------------------------------------------------------------

  console.log('--- 🚀 Iniciando recopilación de información del dispositivo...');

  // 1. IDENTIFICADOR (ID único por proveedor/app, similar a getDeviceId)
  const identificador = Device.osName === 'iOS'
    ? await Application.getIosIdForVendorAsync()
    : await Application.getAndroidId();
  console.log('✅ Identificador (IDFV/Android ID):', identificador);

  // 2. NOMBRE, MODELO, FABRICANTE
  const nombre = Device.deviceName; // Usamos deviceName para el nombre 'amigable'
  const modelo = Device.modelName;
  const fabricante = Device.manufacturer;
  console.log('✅ Nombre/Modelo/Fabricante:', `${nombre}/${modelo}/${fabricante}`);

  // 3. PLATAFORMA y SISTEMA OPERATIVO
  const plataforma = Device.osName;
  const sistemaOperativo = Device.osName;
  const versionOs = Device.osVersion;
  console.log('✅ SO/Versión:', `${sistemaOperativo} ${versionOs}`);

  // 4. VERSIÓN SDK ANDROID (platformApiLevel es para Android)
  let apiLevel = '';
  if (Device.osName === 'Android') {
    apiLevel = Device.platformApiLevel?.toString() || 'N/A';
    console.log('✅ API Level (Android):', apiLevel);
  } else {
    apiLevel = 'N/A_iOS_o_Otro';
    console.log('ℹ️ API Level (No Android):', apiLevel);
  }
  const versionSdkAndroid = apiLevel;

  // 5. DISPOSITIVO VIRTUAL (Invertimos isDevice)
  const esDispositivoVirtual = !Device.isDevice;
  console.log('✅ Es Dispositivo Virtual:', esDispositivoVirtual);

  // 6. ESPACIO EN DISCO (Usando expo-file-system)
  const espacioLibreDisco = await FileSystem.getFreeDiskStorageAsync();
  const espacioTotalDisco = await FileSystem.getTotalDiskCapacityAsync();
  
  // 7. MEMORIA USADA
  const memoriaUsada = espacioTotalDisco - espacioLibreDisco;
  console.log(`✅ Disco: Libre ${espacioLibreDisco} / Total ${espacioTotalDisco} (Bytes)`);
  console.log('✅ Memoria Usada:', memoriaUsada, '(Bytes)');
  
  // 8. REDUNDANCIA (Se mantiene la asignación original con los nuevos valores)
  const espacioLibreRealDisco = espacioLibreDisco;
  const espacioTotalRealDisco = espacioTotalDisco;
  
  // 9. VERSIÓN DE LA APP
  const VersionApp = environment.version || '0.0.0';
  console.log('✅ Versión App:', VersionApp);

  console.log('--- ✅ Información del dispositivo recopilada.');
  // ----------------------------------------------------------------------
  // FIN DE ADAPTACIÓN
  // ----------------------------------------------------------------------

  try {
    if (!user) {
      console.log('❌ Error: Nombre de usuario es nulo.');
      return false;
    }
    if (!pass) {
      console.log('❌ Error: Contraseña es nula.');
      return false;
    }

    const headers = {
      // Authorization: `Bearer ${token}`,
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
    };
    console.log('--- 🛠️ Headers (Sesion) preparados:', headers.Sesion);

    const deviceInfo = {
      Identificador: identificador,
      Nombre: nombre,
      Modelo: modelo,
      Plataforma: Platform.OS,
      SistemaOperativo: sistemaOperativo,
      VersionOs: versionOs,
      Fabricante: fabricante,
      EsDispositivoVirtual: esDispositivoVirtual,
      VersionApp: VersionApp,
    };
    
    console.log('--- ℹ️ DeviceInfo final a enviar:', JSON.stringify(deviceInfo, null, 2));
    
    const body = {
      UserName: user,
      Clave: pass,
      DeviceInfo: deviceInfo,
    };

    const urlApi = obtenerUrlApi();
    console.log('--- 📤 URL de API:', `${urlApi}/Auth/iniciarSesion`);
    console.log('--- 📤 Body de la solicitud:', body);
    
    const response = await httpRequest({ url: `${urlApi}/Auth/iniciarSesion`, method: "POST", headers, body: body });

    console.log('URL', `${urlApi}/Auth/iniciarSesion`);

    if (response.status === 200) {
      console.log('--- ✅ Respuesta recibida: Status 200 OK');
      const datos = response.data;
      environment.datosSesion = datos;

      console.log('response Data', JSON.stringify(datos));

      if (datos.CodigoError === '03') {
        console.log('--- ⚠️ Código de Error 03: Usuario bloqueado.');
        return 'blocked';
      }

      if (datos && datos.CodigoError && datos.MensajeError) {
        if (datos.CodigoError === '07' || datos.CodigoError === '08') {
          console.log(`--- ⚠️ Código de Error ${datos.CodigoError}: Se requiere cambio de contraseña.`);
          return 'changePassword';
        } else {
          console.log(`--- ❌ Error de negocio: ${datos.CodigoError} - ${datos.MensajeError}`);
          return false;
        }
      }

      await SecureStore.setItem('DataUser', JSON.stringify(datos));
      console.log('--- ✅ Datos del usuario guardados en SecureStore (DataUser).');

      if (datos.IdUsuario > 0) {
        try {
          const sesionCompleta = {
            ...datos,
            Sistema: "BigBrother",
            Ambiente: environment.ambiente,
            Token: await SecureStore.getItem('Tokenbb'),
            Pais: environment.pais,
          };

          await SecureStore.setItem('SesionUsuario', JSON.stringify(sesionCompleta));
          await SecureStore.setItem('UserName', datos.UserName);
          console.log('--- ✅ Sesión completa guardada en SecureStore (SesionUsuario).');
          console.log('SesionUsuario guardado:', sesionCompleta);
          
          return datos; // Retorna los datos para indicar éxito y proveer la información.

        } catch (err: any) {
          console.error('--- ❌ Error al guardar en SecureStore (final):', err.message);
          return false;
        }
      }
    } else {
      console.log(`--- ❌ Fallo en la solicitud: Status ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error('--- 🚨 Error general al iniciar sesión en la aplicación:', error.message);
    const mensajeError = error?.message || 'Error de conexión con el servidor';
    return false;
  }
}

async function desconectarUsuario() {
  try {
    const userName = await SecureStore.getItem('UserName');
    const token = await SecureStore.getItem('Tokenbb');

    const pais = environment.pais;
    const sistema = environment.sistema;
    const ambiente = environment.ambiente;

    console.log(userName);
    console.log(token);
    console.log(pais);
    console.log(sistema);

    if (!token) {
      throw new Error('No se encontró un token de acceso.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: JSON.stringify({
        Pais: pais, // Usar las variables directamente, ya que ya las has declarado.
        Sistema: sistema,
        Ambiente: ambiente,
      }),
      'Content-Type': 'application/json',
    };

    // Verificación de tipo para indicar que environment.pais se puede usar como clave
    const urlApi = obtenerUrlApi();
    const response = await httpRequest({ url: `${urlApi}/Auth/desconectarUsuario/${userName}`, method: "POST", headers, body: {} });

    //console.log(response);

    if (response.status === 200) {
      //console.log(response.data);
      console.log('Usuario desconectado exitosamente');
      await SecureStore.isAvailableAsync();
      return true;
    } else {
      console.log('Status:', response.status);
      throw new Error('Error al desconectar el usuario');
    }
  } catch (error: any) {
    if (error.response) {
      console.error('Response error:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function cambiarClave(
  user: string,
  antiguaPass: string,
  nuevaPass: string,
) {
  if (!antiguaPass) {
    throw new Error('Contraseña antigua requerida');
  }

  if (!nuevaPass) {
    throw new Error('Contraseña nueva requerida');
  }

  try {
    const token = await SecureStore.getItem('Tokenbb');
    await SecureStore.setItem('UserName', user);

    if (!token) {
      throw new Error('No se encontró un token de acceso.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
    };

    const data = {
      UserName: user,
      ClaveActual: antiguaPass,
      NuevaClave: nuevaPass,
    };

    console.log('Data:', data);
    console.log('Headers:', headers);

    const urlApi = obtenerUrlApi();
    const response = await httpRequest({ url: `${urlApi}/Auth/cambiarClave`, method: "POST", headers, body: data });

    if (response.status === 200) {
      const datos = response.data;
      console.log('2', datos);
      if (datos && datos.CodigoError && datos.MensajeError) {
        // Analizar el JSON en datos.MensajeError
        const mensajeErrorObjeto = JSON.parse(datos.MensajeError);

        // Obtener el mensaje de error deseado
        const mensajeError = mensajeErrorObjeto.MensajeError;
        return false;
      }
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    return false;
  }
}

async function regenerarClavePorOlvido(
  userName: string,
  identificacion: string,
): Promise<any> {
  try {
    const apiUrl = obtenerUrlApi();

    const headers = {
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
      'Content-Type': 'application/json',
    };

    const response = await httpRequest({ url: `${apiUrl}/Auth/regenerarClavePorOlvido/${userName}/${identificacion}`, method: "POST", headers, body: {} });

    return response.data;
  } catch (error) {
    console.error('Error al regenerar la clave por olvido:', error);
    throw error;
  }
}


const CATALOGOS_CACHE_KEY: any = {
  GT: 'DatosGT',
  EC: 'DatosEC',
  PE: 'DatosPE',
};

async function catalogosList() {
  const token = await SecureStore.getItem('Tokenbb');
  const pais = environment.pais;
  const cacheKey = CATALOGOS_CACHE_KEY[pais];

  if (!token) {
    console.warn('⚠️ No se encontró token');
    return false;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Sesion: JSON.stringify({
      Pais: pais,
      Sistema: environment.sistema,
      Ambiente: environment.ambiente,
    }),
  };

  const data = ['Agencias', 'LineaCredito'];
  const urlApi = obtenerUrlApi();

  try {
    const response = await httpRequest({ url: `${urlApi}/api/Catalogo/obtenerListaCatalogo`, method: "POST", headers, body: data });


    const datos = response.data;
    await SecureStore.setItem(cacheKey, JSON.stringify(datos));

    if (datos?.CodigoError && datos?.MensajeError) {
      const mensajeError = JSON.parse(datos.MensajeError)?.MensajeError;
      console.warn(`⚠️ Error: ${mensajeError}`);
      return false;
    }

    return JSON.stringify(datos);
  } catch (error: any) {

    if (error.message === 'Network Error') {


      const local = await SecureStore.getItem(cacheKey);
      return local ? local : false;
    }

    if (error.response?.data?.MensajeError) {
      const msg = error.response.data.MensajeError;
    } else {
    }

    return false;
  }
}


async function IniciarGrabacion(
  ID: any,
  Latitud: any,
  Longitud: any,
  FechaInicioGrabacion?: any,
) {
  const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
  const datosRecuperados = JSON.parse(sesionUsuario);

  try {
    const token = await SecureStore.getItem('Tokenbb');
    console.log(token);

    if (!token) {
      throw new Error('No se encontró un token de acceso.');
    }

    const sesionPayload = JSON.stringify({
      Pais: environment.pais,
      Sistema: environment.sistema,
      Ambiente: environment.ambiente,
      UserName: datosRecuperados.UserName,
    });

    const sesionEncoded = Buffer.from(sesionPayload).toString('base64');


    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: sesionEncoded,
      'Content-Type': 'application/json',
    };

    console.log("Headers", headers);

    const data = {
      IdCliente: ID,
      UsuarioCreacion: datosRecuperados.UserName,
      Latitud: Latitud.toString(),
      Longitud: Longitud.toString(),
      FechaInicioGrabacion: FechaInicioGrabacion,
    };
    //console.log('INICIAR SESION', data)

    const urlApi = obtenerUrlApi();

    const response = await httpRequest({ url: `${urlApi}/Grabacion/iniciarGrabacion`, method: "POST", headers, body: data });


    if (response.status === 200) {
      const datos = response.data;

      if (datos?.IdGrabacion) {
        await SecureStore.setItem('IdGrabacion', JSON.stringify(datos.IdGrabacion));
        console.log('ID GRABACION:', JSON.stringify(datos.IdGrabacion));
      }

      return datos; // ✅ DEVUELVE EL OBJETO COMPLETO
    }
    else {
      console.log('Status:', response.status);
      return false;
    }
  } catch (error: any) {
    console.error('Error al iniciar grabación:', error);
    return false;
  }
}



async function eliminarCuenta(): Promise<string> {
  try {
    // Obtener sesión y token
    const sesionUsuarioRaw = await SecureStore.getItem('SesionUsuario');
    const token = await SecureStore.getItem('Tokenbb');

    if (!token) throw new Error('No se encontró un token de acceso.');

    if (!sesionUsuarioRaw) throw new Error('No se encontró información de sesión.');

    const datosRecuperados = JSON.parse(sesionUsuarioRaw);
    const { UserName } = datosRecuperados || {};

    if (!UserName) throw new Error('No se encontró el nombre de usuario en la sesión.');

    // Construir headers
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
        UserName,
      }),
    };

    const urlApi = obtenerUrlApi();
    const endpoint = `${urlApi}/Auth/eliminarCuenta`;

    // Logs útiles para depurar
    console.log('⛓️ Enviando solicitud para eliminar cuenta');
    console.log('🔑 Token:', token);
    console.log('👤 Usuario:', UserName);
    console.log('🌐 URL:', endpoint);
    console.log('📨 Headers:', headers);

    // Hacer la solicitud
    const response = await httpRequest({ url: endpoint, method: "POST", headers, body: {} });

    // Verificar respuesta
    if (response.status === 200) {
      console.log('✅ Cuenta eliminada correctamente');
      return response.data;
    } else {
      console.warn('⚠️ Respuesta inesperada al eliminar cuenta:', response.status, response.data);
      throw new Error('Error al eliminar la cuenta');
    }
  } catch (error: any) {
    let mensaje = 'Error desconocido';

    if (error?.response?.data?.message) {
      mensaje = typeof error.response.data.message === 'string'
        ? error.response.data.message
        : JSON.stringify(error.response.data.message);
      console.error('🌐 Error completo:', JSON.stringify(error?.response?.data, null, 2));
    } else if (error.message) {
      mensaje = error.message;
    }

    console.error('❌ Error al eliminar la cuenta:', mensaje);
    throw new Error(mensaje);
  }
}

async function subirAudioNube(audioFilePath: string, pais: string, folder = 'audios') {
  const fileName = `audio_${Date.now()}.mp3`;
  const fsPath = audioFilePath.replace('file://', '');
  const uri = Platform.OS === 'android' ? 'file://' + fsPath : fsPath;

  const formData = new FormData();
  formData.append('archivo', {
    uri,
    name: fileName,
    type: 'audio/mpeg', // o 'audio/mp3'
  } as any);
  formData.append('folder', folder);
  formData.append('pais', pais);

  const token = await SecureStore.getItem('Tokenbb');
  const urlApi = obtenerUrlApi();

  const response = await fetch(`${urlApi}/Files/subirArchivoNube`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // ¡NO pongas Content-Type aquí!
    },
    body: formData,
  });

  const json = await response.json();
  // tu servidor devuelve { nombreArchivo, url } en camelCase si usas IActionResult;
  // si sigues con Json.NET por defecto, será { NombreArchivo, Url }:
  return json.Url ?? json.url;
}



async function DetenerGrabacion(
  audioFilePath: string,
  FechaFinGrabacion: string,
  Latitud?: string,
  Longitud?: string
) {
  try {
    const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
    const datosRecuperados = JSON.parse(sesionUsuario);
    const IDString: any = await SecureStore.getItem('IdGrabacion');
    const ID = parseInt(IDString, 10);
    console.log('ID Grabacion:', ID);

    const token = await SecureStore.getItem('Tokenbb');
    if (!token) throw new Error('No se encontró un token de acceso.');

    // 🆕 Subir el archivo a la nube primero
    const urlArchivo = await subirAudioNube(audioFilePath, environment.pais);

    console.log('URL del audio subida a la nube:', urlArchivo);

    const sesionPayload = JSON.stringify({
      Pais: environment.pais,
      Sistema: environment.sistema,
      Ambiente: environment.ambiente,
      UserName: datosRecuperados.UserName,
    });

    const sesionEncoded = Buffer.from(sesionPayload).toString('base64');


    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: sesionEncoded,
      'Content-Type': 'application/json',
    };

    if (!Latitud) {
      Latitud = '0'
    };

    if (!Longitud) {
      Longitud = '0'
    };

    const data = {
      IdGrabacion: ID,
      UrlGrabacion: urlArchivo,
      AudioGrabadoNube: true,
      Latitud: Latitud,
      Longitud: Longitud,
      FechaFinGrabacion: FechaFinGrabacion,
    };

    console.log('Data enviada a detenerGrabacion:', data);

    const urlApi = obtenerUrlApi();
    const response = await httpRequest({ url: `${urlApi}/Grabacion/detenerGrabacion`, method: "POST", headers, body: data });


    if (response.status === 200) {
      await SecureStore.deleteItemAsync('IdGrabacion');
      await SecureStore.deleteItemAsync('UES');
      return response.data;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('Error al detener grabación:', error);
    return null;
  }
}


//Colocar aqui los campos de DNI y NumeroOperacion

async function RegistroGrabacion(
  user: string,
  audioBase64: string,
  IDCliente: string,
  Identificacion: string,
  FechaInicioGrabacion: string,
  FechaFinGrabacion: string,
  Latitud: string,
  Longitud: string,
  Agencia?: string,
  LineaCredito?: string,
  NumeroOperacion: string = '',
  esLocal: boolean = true
) {
  // ⚠ Validación inicial robusta
  if (!audioBase64 || IDCliente === undefined || IDCliente === null) {
    console.warn('⚠️ Grabación no enviada: falta audioBase64 o IDCliente.', {
      audioBase64,
      IDCliente
    });
    throw new Error('AudioBase64 o IDCliente requeridos');
  }

  let datosRecuperados: any = {};

  try {
    const sesionUsuario = await SecureStore.getItem('SesionUsuario');
    const datosRecuperados = sesionUsuario ? JSON.parse(sesionUsuario) : {};
    const token = await SecureStore.getItem('Tokenbb');

    if (!token) throw new Error('No se encontró un token de acceso.');

    const sesionPayload = JSON.stringify({
      Pais: environment.pais,
      Sistema: environment.sistema,
      Ambiente: environment.ambiente,
      UserName: datosRecuperados?.UserName || user || 'ADMIN',
    });

    const sesionEncoded = Buffer.from(sesionPayload, 'utf8').toString('base64');

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: sesionEncoded,
      'Content-Type': 'application/json',
    };

    const data = {
      AudioBase64: audioBase64,
      UsuarioCreacion: datosRecuperados?.UserName || user || 'ADMIN',
      Identificacion,
      NumeroOperacion,
      FechaInicioGrabacion,
      FechaFinGrabacion,
      Latitud,
      Longitud,
      Agencia: Agencia || 'SICOBRA-MATRIZ',
      LineaCredito,
      IdCliente: IDCliente,
      EsGrabacionLocal: esLocal
    };

    const urlApi = obtenerUrlApi();
    const response = await httpRequest({
      url: `${urlApi}/Grabacion/registrarGrabacion`,
      method: "POST",
      headers,
      body: data
    });

    if (response?.data?.UrlGrabacion || response?.data?.FechaFinGrabacion) {
      console.log('✅ Audio enviado correctamente:', response.data.UrlGrabacion);
      return response.data;
    } else {
      // Alert.alert('Error de envío', 'No se pudo enviar el audio. Se guardó para enviar más tarde.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al enviar grabación:', error);
    // Alert.alert('Sin conexión', 'No se pudo enviar el audio. Se guardó para enviar cuando tengas conexión.');
    // Guardamos en grabacionesPendientes para subir más tarde
    const grabacionPendiente = {
      audioBase64,
      IDCliente,
      Identificacion,
      FechaInicioGrabacion,
      FechaFinGrabacion,
      Latitud,
      Longitud,
      Agencia,
      LineaCredito,
      NumeroOperacion,
      EsGrabacionLocal: esLocal
    };

    const existentes = await SecureStore.getItem('grabacionesPendientes');
    const array = existentes ? JSON.parse(existentes) : [];
    array.push(grabacionPendiente);
    await SecureStore.setItem('grabacionesPendientes', JSON.stringify(array));

    // Además: guardamos en lastFailedAudio y selectedItem para reintento manual
    await SecureStore.setItem('lastFailedAudio', JSON.stringify({
      audioFileData: audioBase64,
      metadata: {
        user: datosRecuperados?.UserName || user || 'ADMIN',
        IDCliente,
        DNI: Identificacion,
        FechaInicioGrabacion,
        FechaFinGrabacion,
        Latitud,
        Longitud,
        Agencia,
        LineaCredito,
        NumeroOperacion
      }
    }));

    await SecureStore.setItem('selectedItem', JSON.stringify({
      Identificacion,
      IdClienteCarga: IDCliente,
      Agencia,
      LineaCredito,
      NumeroOperacion
    }));
    return false;
  }
}




//Colocar aqui los campos de DNI y NumeroOperacion

async function RegistroGrabacionGT(
  user: string,
  audioBase64: string,
  IDCliente: string,
  Identificacion: string,
  FechaInicioGrabacion: string,
  FechaFinGrabacion: string,
  Latitud: string,
  Longitud: string,
  Agencia?: string,
  LineaCredito?: string,
  NumeroOperacion: string = '',
  esLocal: boolean = true
) {
  if (!audioBase64 || !IDCliente) {
    console.warn('⚠️ Grabación no enviada: falta audioBase64 o IDCliente.');
    throw new Error('AudioBase64 o IDCliente requeridos');
  }
  let datosRecuperados: any = {};

  try {
    const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
    const datosRecuperados = JSON.parse(sesionUsuario);
    const token = await SecureStore.getItem('Tokenbb');

    if (!token) throw new Error('No se encontró un token de acceso.');

    const sesionPayload = JSON.stringify({
      Pais: environment.pais,
      Sistema: environment.sistema,
      Ambiente: environment.ambiente,
      UserName: datosRecuperados?.UserName || user || 'ADMIN',
    });

    const sesionEncoded = Buffer.from(sesionPayload, 'utf8').toString('base64');

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: sesionEncoded,
      'Content-Type': 'application/json',
    };

    const data = {
      AudioBase64: audioBase64,
      UsuarioCreacion: datosRecuperados?.UserName || user || 'ADMIN',
      Identificacion,
      NumeroOperacion,
      FechaInicioGrabacion,
      FechaFinGrabacion,
      Latitud,
      Longitud,
      Agencia,
      LineaCredito,
      IdCliente: IDCliente, // 🔥 Campo correcto
      EsGrabacionLocal: esLocal
    };

    const urlApi = obtenerUrlApi();
    const response = await httpRequest({ url: `${urlApi}/Grabacion/registrarGrabacion`, method: "POST", headers, body: data });

    if (response?.data?.UrlGrabacion) {
      console.log('✅ Audio enviado correctamente:', response.data.UrlGrabacion);
      return response.data; // ⬅️ Devuelve el objeto completo si lo necesitas
    } else {
      // Alert.alert('Error de envío', 'No se pudo enviar el audio. Se guardó para enviar más tarde.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al enviar grabación:', error);
    // Alert.alert('Sin conexión', 'No se pudo enviar el audio. Se guardó para enviar cuando tengas conexión.');

    const grabacionPendiente = {
      audioBase64,
      IDCliente,
      Identificacion,
      FechaInicioGrabacion,
      FechaFinGrabacion,
      Latitud,
      Longitud,
      Agencia,
      LineaCredito,
      NumeroOperacion,
      EsGrabacionLocal: esLocal
    };

    const existentes = await SecureStore.getItem('grabacionesPendientes');
    const array = existentes ? JSON.parse(existentes) : [];

    array.push(grabacionPendiente);
    await SecureStore.setItem('grabacionesPendientes', JSON.stringify(array));

    await SecureStore.setItem('lastFailedAudio', JSON.stringify({
      audioFileData: audioBase64,
      metadata: {
        user: datosRecuperados?.UserName || user || 'ADMIN',
        IDCliente,
        DNI: Identificacion,
        FechaInicioGrabacion,
        FechaFinGrabacion,
        Latitud,
        Longitud,
        Agencia,
        LineaCredito,
        NumeroOperacion
      }
    }));

    await SecureStore.setItem('selectedItem', JSON.stringify({
      Identificacion,
      IdClienteCarga: IDCliente,
      Agencia,
      LineaCredito,
      NumeroOperacion
    }));

    return false;
  }
}



async function ConsultarGrabacionesUsuarioHoy() {
  const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
  const datosRecuperados = JSON.parse(sesionUsuario);

  const userName = datosRecuperados.UserName;

  if (!userName) {
    throw new Error('Nombre de usuario requerido');
  }

  try {
    const token = await SecureStore.getItem('Tokenbb');
    console.log(token);

    if (!token) {
      throw new Error('No se encontró un token de acceso.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
      'Content-Type': 'application/json',
    };

    const urlApi = obtenerUrlApi();

    const response = await httpRequest({ url: `${urlApi}/Grabacion/obtenerGrabacionesUsuarioHoy/${userName}`, method: "GET", headers });


    if (response.status === 200) {
      const datos = response.data;
      //console.log('Audios Hoy', datos);
      await SecureStore.setItem('DatosLista', JSON.stringify(datos));

      return datos;
    } else {
      console.log('Status:', response.status);
      return [];
    }
  } catch (error: any) {
    console.error('Error al consultar lista clientes:', error);

    if (error.message === 'Network Error') {

    } else if (error.response) {
      const mensaje = error.response.data?.MensajeError || 'Error del servidor.';
    } else {
    }

    return [];
  }
}

// #region CONSULTAR LISTA DE CLIENTES
async function ConsultarListaCliente() {
  const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
  const datosRecuperados = JSON.parse(sesionUsuario);

  const userName = datosRecuperados.UserName;

  if (!userName) {
    throw new Error('Nombre de usuario requerido');
  }

  try {
    const token = await SecureStore.getItem('Tokenbb');
    console.log(token);

    if (!token) {
      throw new Error('No se encontró un token de acceso.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: JSON.stringify({
        Pais: environment.pais,
      }),
      'Content-Type': 'application/json',
    };

    const urlApi = obtenerUrlApi();

    const response = await httpRequest({ url: `${urlApi}/Cliente/obtenerClientesUsuarioHoy/${encodeURIComponent(userName)}`, method: "GET", headers });

    if (response.status === 200) {
      const datos = response.data;
      console.log('Audios Hoy', datos);
      await SecureStore.setItem('DatosListaCliente', JSON.stringify(datos));

      return datos;
    } else {
      console.log('Status:', response.status);
      return [];
    }
  } catch (error: any) {
    console.error('Error al consultar lista clientes:', error);

    if (error.message === 'Network Error') {

    } else if (error.response) {
      const mensaje = error.response.data?.MensajeError || 'Error del servidor.';
    } else {
    }

    return [];
  }

}

export async function ArchivarCliente(cliente: any) {
  try {
    const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
    const token = await SecureStore.getItem('Tokenbb');

    if (!token || !sesionUsuario) {
      throw new Error('Faltan datos de sesión');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
      'Content-Type': 'application/json',
    };

    const urlApi = obtenerUrlApi();

    const response = await httpRequest({ url: `${urlApi}/Cliente/archivarClienteCarga`, method: "POST", headers, body: cliente });

    if (response.status === 200) {
      return response.data;
    }
  } catch (error: any) {
    if (error.message === 'Network Error') {
    } else if (error.response) {
    } else {
    }

    throw error;
  }
}

async function GrabarCliente(cliente: any) {
  const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
  const datosRecuperados = JSON.parse(sesionUsuario);
  const userName = datosRecuperados?.UserName;

  if (!userName) {
    throw new Error('Nombre de usuario requerido');
  }

  try {
    const token = await SecureStore.getItem('Tokenbb');
    if (!token) throw new Error('No se encontró un token de acceso.');

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
      }),
      'Content-Type': 'application/json',
    };

    const urlApi = obtenerUrlApi();
    console.log('🌐 URL destino:', `${urlApi}/Cliente/grabarCliente`);
    console.log('🔐 Token recuperado:', token);
    console.log('👤 Usuario recuperado:', userName);

    // Construir body correctamente
    const body = {
      cliente: {
        ...cliente,
        TieneGrabacion: Boolean(cliente.TieneGrabacion),
      },
    };

    console.log('📨 Enviando datos del cliente al servidor...', JSON.stringify(body, null, 2));

    const response = await httpRequest({
      url: `${urlApi}/Cliente/grabarCliente`, method: "POST", headers, body: {
        ...cliente,
        TieneGrabacion: Boolean(cliente.TieneGrabacion), // 👈 fuerza booleano
        GrabacionIniciada: Boolean(cliente.GrabacionIniciada),
        GrabacionFinalizada: Boolean(cliente.GrabacionFinalizada),
      }
    });


    if (response.status === 200) {
      const datos = response.data;
      console.log('✅ Cliente grabado en backend:', datos);
      return datos;
    } else {
      console.log('❌ Status no 200:', response.status);
      return null;
    }

  } catch (error: any) {
    console.error('❌ Error en la solicitud de grabación:', error);

    if (error?.response?.data) {
      console.warn('⚠️ Error de respuesta del servidor:', error.response.data);
    }
    return null;
  }
}



async function crearDispositivo(
  usuario: string,
  idDispositivoApp: string,
  idSistema: string,
  identificador: string,
  nombre: string,
  modelo: string,
  plataforma: string,
  sistemaOperativo: string,
  versionOs: string,
  versionIos: string,
  versionSdkAndroid: string,
  fabricante: string,
  esDispositivoVirtual: boolean,
  memoriaUsada: number,
  espacioLibreDisco: number,
  espacioTotalDisco: number,
  espacioLibreRealDisco: number,
  espacioTotalRealDisco: number,
  idPushManager: string,
  fechaRegistro: Date,
  fechaUltimoAcceso: Date,
  usuarioAsignado?: string,
) {
  const sesionUsuario: any = await SecureStore.getItem('SesionUsuario');
  const datosRecuperados = JSON.parse(sesionUsuario);

  if (!usuario) {
    throw new Error('Nombre de usuario requerido');
  }

  try {
    const token = await SecureStore.getItem('Tokenbb');
    console.log(token);

    if (!token) {
      throw new Error('No se encontró un token de acceso.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Sesion: JSON.stringify({
        Pais: environment.pais,
        Sistema: environment.sistema,
        Ambiente: environment.ambiente,
        UserName: datosRecuperados.UserName,
      }),
      'Content-Type': 'application/json',
    };

    const data = {
      IdDispositivoApp: idDispositivoApp,
      IdSistema: idSistema,
      Identificador: identificador,
      Nombre: nombre,
      Modelo: modelo,
      Plataforma: plataforma,
      SistemaOperativo: sistemaOperativo,
      VersionOs: versionOs,
      VersionIos: versionIos,
      VersionSdkAndroid: versionSdkAndroid,
      Fabricante: fabricante,
      EsDispositivoVirtual: esDispositivoVirtual,
      MemoriaUsada: memoriaUsada,
      EspacioLibreDisco: espacioLibreDisco,
      EspacioTotalDisco: espacioTotalDisco,
      EspacioLibreRealDisco: espacioLibreRealDisco,
      EspacioTotalRealDisco: espacioTotalRealDisco,
      IdPushManager: idPushManager,
      FechaRegistro: fechaRegistro,
      FechaUltimoAcceso: fechaUltimoAcceso,
      UsuarioAsignado: usuarioAsignado,
    };

    const urlApi = obtenerUrlApi();
    const response = await httpRequest({ url: `${urlApi}/Dispositivo/crearDispositivo`, method: "POST", headers, body: data });


    if (response?.data.IdDispositivoApp) {
      const datos = response.data;
      console.log(environment.pais);

      return true;
    } else {
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Ocurrió un error al intentar crear el dispositivo.');
  }
}

export {
  cambiarClave, catalogosList,
  ConsultarGrabacionesUsuarioHoy,
  ConsultarListaCliente, crearDispositivo, desconectarUsuario, DetenerGrabacion, eliminarCuenta, generarCodigoDesbloqueo, GrabarCliente, IniciarGrabacion, IniciarSesionApp, obtenerTokenAcceso, obtenerTokenAccesoBigBrother,
  obtenerTokenSinAccesoBigBrother, regenerarClavePorOlvido, RegistroGrabacion, RegistroGrabacionGT, validarCodigoDesbloqueo
};

