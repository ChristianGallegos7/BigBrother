// No necesitas importar 'fetch', es una función global en React Native.

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

    const response = await fetch(url, options);

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