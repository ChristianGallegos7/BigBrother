// No necesitas importar 'fetch', es una función global en React Native.
import { environment } from '@/components/core/environment';

// Definimos una interfaz para que tu código sea más seguro y claro
interface HttpRequestParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export async function httpRequest({
  url,
  method = 'GET',
  headers = {},
  body,
}: HttpRequestParams) {
  try {
    // Decide si intentamos SSL Pinning (si está habilitado y disponible el módulo)
    const usePinning = (() => {
      try {
        if (!environment.sslPinning?.enabled) return false;
        const isHttps = /^https:/i.test(url);
        if (!isHttps) return false;
        const u = new URL(url);
        return environment.sslPinning.domains?.some(d => d.host === u.hostname);
      } catch {
        return false;
      }
    })();

    const options: RequestInit = {
      method,
      headers: {
        // Añadimos headers comunes por defecto.
        // Si envías FormData, el Content-Type se maneja solo.
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // La lógica de SSL Pinning ya no es necesaria aquí.
    // Expo lo aplica a nivel de la app durante la compilación.

    if (body) {
      if (body instanceof FormData) {
        // Al usar FormData, debemos dejar que el navegador/fetch establezca el Content-Type.
        delete (options.headers as Record<string, string>)['Content-Type'];
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }

    let response: Response;

    if (usePinning) {
      try {
        // Carga perezosa para no romper en Managed si no está instalado
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const RNSSLPinning = require('react-native-ssl-pinning');
        const pinnedFetch: typeof fetch = RNSSLPinning.fetch;

        const u = new URL(url);
        const domainCfg = environment.sslPinning.domains!.find(d => d.host === u.hostname);
        const sslPinning: any = {};
        if (domainCfg?.certs?.length) sslPinning.certs = domainCfg.certs;
        if (domainCfg?.publicKeyHashes?.length) sslPinning.publicKeyHashes = domainCfg.publicKeyHashes;

        // Construir cuerpo/headers para RNSSLPinning
        const pinningOptions: any = {
          method,
          headers: options.headers,
          sslPinning,
          // Tiempo de espera razonable en ms
          timeoutInterval: 30000,
        };
        if (body) {
          if (body instanceof FormData) {
            delete (pinningOptions.headers as Record<string, string>)['Content-Type'];
            pinningOptions.body = body as any;
          } else {
            pinningOptions.body = JSON.stringify(body);
          }
        }

        const res = await pinnedFetch(url, pinningOptions as any);
        // RNSSLPinning.fetch devuelve un objeto con status, headers y body string
        const rawBody: any = (res as any).body;
        const textBody = typeof rawBody === 'string' ? rawBody : String(rawBody ?? '');
        const data = (() => {
          try { return JSON.parse(textBody); } catch { return textBody; }
        })();
        if (res.status < 200 || res.status >= 300) {
          const errorMessage = (data && (data.MensajeError || data.message)) || `Error del servidor: ${res.status}`;
          throw new Error(errorMessage);
        }
        return { status: res.status, data };
      } catch (e) {
        console.warn('SSL pinning no disponible o fallido; usando fetch normal.', e);
        // continúa con fetch estándar abajo
      }
    }

    response = await fetch(url, options);

    // Intentamos parsear la respuesta como JSON.
    const data = await response.json();

    // 'response.ok' es true si el status es 200-299.
    // Si no es ok, lanzamos un error para que el bloque catch lo maneje.
    if (!response.ok) {
      // Usamos el mensaje de error del backend si existe, o uno genérico.
      const errorMessage = data?.MensajeError || `Error del servidor: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Si todo fue bien, devolvemos el status y los datos.
    return {
      status: response.status,
      data: data,
    };
  } catch (error: any) {
    console.error('Error en httpRequest:', error.message || error);
    // Relanzamos el error para que la función que llamó a httpRequest pueda manejarlo.
    throw error;
  }
}