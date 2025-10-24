// En: context/AuthContext.tsx

import { createClientesTable, createGrabacionesTable, createListaClientesTable, getDBConnection } from '@/utils/database/database';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<any>(null);

// Este hook puede leer el contexto de autenticación
export const useAuth = () => {
    return useContext(AuthContext);
};

// Hook personalizado para proteger las rutas
function useProtectedRoute(session: string | null, isLoading: boolean) {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // 👇 No hacer nada mientras está cargando
        if (isLoading) {
            return;
        }

        // No hagas nada si los segmentos del router aún no están listos.
        if (!Array.isArray(segments)) {
            return;
        }

        // Verifica si la ruta actual está dentro del grupo '(stack)' (rutas protegidas)
        const inProtectedRoute = segments[0] === '(stack)';

        // Permitir acceso sin sesión a las pantallas de recuperación y cambio de contraseña
        const isPasswordRecovery = segments[1] === 'recuperar-password';
        const isPasswordChange = segments[1] === 'cambiar-password';

        if (!session && inProtectedRoute && !isPasswordRecovery && !isPasswordChange) {
            // Si el usuario NO tiene sesión e intenta entrar a rutas protegidas (excepto recuperar-password y cambiar-password),
            // lo mandamos al login (la raíz '/').
            console.log('🔒 Sin sesión, redirigiendo al login');
            router.replace('/');
        } else if (session && !inProtectedRoute) {
            // Si el usuario SÍ tiene sesión y está en el login,
            // lo mandamos a la pantalla principal dentro de '(stack)/home'.
            console.log('✅ Con sesión, redirigiendo a home');
            router.replace('/(stack)/home');
        }
    }, [session, segments, isLoading]);
}

export const AuthProvider = ({ children }: any) => {
    const [session, setSession] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null); // Estado para guardar el objeto del usuario
    const [isLoading, setIsLoading] = useState(true);

    useProtectedRoute(session, isLoading); // 👈 Pasar isLoading

    useEffect(() => {
        const loadSession = async () => {
            try {
                // 🗄️ Inicializar base de datos
                console.log('🗄️ Inicializando base de datos...');
                const db = await getDBConnection();
                await createClientesTable(db);
                await createGrabacionesTable(db);
                await createListaClientesTable(db);
                console.log('✅ Tablas de base de datos inicializadas');

                const token = await SecureStore.getItemAsync('Tokenbb');
                const userString = await SecureStore.getItemAsync('userData'); // Lee el string

                if (token && userString) {
                    console.log('✅ Sesión recuperada desde SecureStore');
                    setSession(token);
                    setUser(JSON.parse(userString)); // Parsea el string a objeto
                } else {
                    console.log('⚠️ No se encontró sesión guardada');
                }
            } catch (error) {
                console.error('❌ Error al cargar la sesión:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    const login = async (token: string, userData: any) => {
        try {
            setSession(token);
            setUser(userData);
            await SecureStore.setItemAsync('Tokenbb', token);
            // ¡Aquí está la corrección! Convertimos el objeto userData a string
            await SecureStore.setItemAsync('userData', JSON.stringify(userData));
            console.log('✅ Sesión guardada correctamente');
        } catch (error) {
            console.error('❌ Error al guardar la sesión:', error);
        }
    };

    const logout = async () => {
        try {
            setSession(null);
            setUser(null);
            await SecureStore.deleteItemAsync('Tokenbb');
            await SecureStore.deleteItemAsync('userData'); // Borra también los datos del usuario
            console.log('✅ Sesión cerrada correctamente');
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
        }
    };

    // Ahora expones también al usuario en el value
    return (
        <AuthContext.Provider value={{ session, user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};