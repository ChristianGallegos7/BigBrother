// hooks/useNetworkStatus.ts
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

/**
 * Hook personalizado para monitorear el estado de conexión a Internet
 * @param checkIntervalMs - Intervalo de verificación en milisegundos (default: 5000ms)
 * @returns isOnline - Estado de conexión (true = conectado, false = sin conexión)
 */
export const useNetworkStatus = (checkIntervalMs: number = 5000) => {
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const checkConnection = async () => {
            try {
                const networkState = await Network.getNetworkStateAsync();
                setIsOnline(networkState.isConnected ?? false);
            } catch (error) {
                console.error('Error al verificar conexión:', error);
                setIsOnline(false);
            }
        };

        // Verificar conexión al montar el componente
        checkConnection();

        // Verificar periódicamente
        intervalId = setInterval(checkConnection, checkIntervalMs);

        return () => {
            clearInterval(intervalId);
        };
    }, [checkIntervalMs]);

    return { isOnline };
};
