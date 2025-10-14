import { fetch } from 'react-native-ssl-pinning';
import { environment } from '../../components/core/environment';

const isProduction = environment.ambiente === 'PROD';
const isQA = environment.ambiente === 'QA';
export async function httpRequest({
  url,
  method = 'GET',
  headers = {},
  body,
}: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  try {
    const opts: any = {
      method,
      headers,
      timeoutInterval: 120000,
    };

    if (isProduction) {
      opts.sslPinning = {certs: ['apibg']};
    } else {
      opts.disableAllSecurity = true;
    }
    if (body) {
      if (body instanceof FormData) {
        opts.body = body;
      } else if (body) {
        opts.body = JSON.stringify(body);
      }
    }

    const res = await fetch(url, opts);
    const parsed = JSON.parse(res.bodyString || '{}');
    return {
      status: res.status,
      data: parsed,
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    console.log('Error en httpRequest:', error.message || error);
    throw error;
  }
}
