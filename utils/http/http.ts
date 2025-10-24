// utils/http/http.ts

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Definimos una interfaz para que tu código sea más seguro y claro
interface HttpRequestParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

// Interfaz para la respuesta simplificada
interface HttpResponse {
  status: number;
  data: any;
}

export async function httpRequest({
  url,
  method = 'GET',
  headers = {},
  body,
}: HttpRequestParams): Promise<HttpResponse> {
  
  const config: AxiosRequestConfig = {
    url,
    method,
    // Timeout más largo para Android 14 y versiones anteriores
    timeout: 30000, // 30 segundos
    headers: {
      // Content-Type por defecto, si no se sobreescribe o si el body es FormData
      'Content-Type': 'application/json',
      ...headers,
    },
    data: body,
    // Configuraciones adicionales para mejor compatibilidad
    validateStatus: (status) => status < 500, // Aceptar códigos 4xx como respuestas válidas
    maxRedirects: 5,
  };

  // Lógica de FormData:
  if (body instanceof FormData) {
    // Axios y el entorno nativo manejan el Content-Type (multipart/form-data)
    // automáticamente. Debemos eliminar el Content-Type explícito para evitar problemas.
    delete config.headers!['Content-Type'];
    config.data = body;
  } else if (body) {
    // Para POST/PUT, el cuerpo se envía como JSON stringify por defecto en tu lógica original
    config.data = JSON.stringify(body);
  }
  
  try {
    const response: AxiosResponse = await axios(config);

    // Axios lanza un error para códigos de estado 4xx/5xx, por lo que este bloque
    // solo se ejecuta si el status es 2xx, 3xx, o si se configuró 'validateStatus'.
    // En este caso, asumimos el comportamiento por defecto de lanzar errores para 4xx/5xx.
    
    // Si el backend devuelve la data como string JSON, la parseamos (aunque Axios
    // suele hacerlo automáticamente).
    let responseData = response.data;
    if (typeof responseData === 'string') {
        try {
            responseData = JSON.parse(responseData);
        } catch (e) {
            // No hacemos nada si falla el parseo, mantenemos el string
        }
    }

    // Si el backend incluye un campo de error dentro de la respuesta 200/201,
    // lo manejas en la capa superior (como en tus funciones originales).

    return {
      status: response.status,
      data: responseData,
    };
    
  } catch (error: any) {
    const axiosError = error as AxiosError;
    
    if (axiosError.code === 'ECONNABORTED') {
        // Error de Timeout
        const message = 'La solicitud excedió el tiempo límite (30 segundos).';
        console.error('Error en httpRequest:', message);
        throw new Error(message);
    } 
    
    if (axiosError.response) {
      // Error de respuesta del servidor (4xx o 5xx)
      const data: any = axiosError.response.data;
      const status = axiosError.response.status;
      
      // Intentamos usar el mensaje de error del backend si existe
      const errorMessage = data?.MensajeError || `Error del servidor: ${status}`;
      
      console.error('Error en httpRequest (HTTP):', errorMessage, status);
      throw new Error(errorMessage);

    } else if (axiosError.request) {
      // Solicitud hecha, pero no hay respuesta (generalmente Network Error / Fallo de Pinning)
      const message = 'Network failure: Fallo de conexión de red nativa.';
      console.error('Error en httpRequest:', message, axiosError.message);
      throw new Error(message);

    } else {
      // Otros errores (configuración de Axios, JS)
      console.error('Error en httpRequest (Axios Config):', axiosError.message);
      throw axiosError;
    }
  }
}