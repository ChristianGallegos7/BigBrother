import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

// Configuración personalizada para agrandar los toasts y permitir múltiples líneas
export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#22c55e',
        width: '96%',
        minHeight: 88,
        alignSelf: 'center',
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}
      text2Style={{ fontSize: 15, color: '#111827' }}
      text1NumberOfLines={4}
      text2NumberOfLines={10}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        width: '96%',
        minHeight: 88,
        alignSelf: 'center',
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}
      text2Style={{ fontSize: 15, color: '#111827' }}
      text1NumberOfLines={4}
      text2NumberOfLines={10}
    />
  ),
};

export default toastConfig;
