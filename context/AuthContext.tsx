// En: context/AuthContext.tsx

import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<any>(null);

// Este hook puede leer el contexto de autenticación
export const useAuth = () => {
    return useContext(AuthContext);
};

// Hook personalizado para proteger las rutas
function useProtectedRoute(session: string | null) {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // No hagas nada si los segmentos del router aún no están listos.
        if (!Array.isArray(segments)) {
            return;
        }

        // Verifica si la ruta actual está dentro del grupo 'home'.
        const inProtectedRoute = segments[0] === 'home'; // 👈 CAMBIO AQUÍ

        if (!session && inProtectedRoute) {
            // Si el usuario NO tiene sesión e intenta entrar a 'home',
            // lo mandamos al login (la raíz '/').
            router.replace('/(auth)');
        } else if (session && !inProtectedRoute) {
            // Si el usuario SÍ tiene sesión y está en el login,
            // lo mandamos a la pantalla principal dentro de 'home'.
            router.replace('/home'); // 👈 CAMBIO AQUÍ
        }
    }, [session, segments]);
}

export const AuthProvider = ({ children }: any) => {
    const [session, setSession] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null); // Estado para guardar el objeto del usuario
    const [isLoading, setIsLoading] = useState(true);

    useProtectedRoute(session);

    useEffect(() => {
        const loadSession = async () => {
            const token = await SecureStore.getItemAsync('Tokenbb');
            const userString = await SecureStore.getItemAsync('userData'); // Lee el string

            if (token && userString) {
                setSession(token);
                setUser(JSON.parse(userString)); // Parsea el string a objeto
            }
            setIsLoading(false);
        };
        loadSession();
    }, []);

    const login = async (token: string, userData: any) => {
        setSession(token);
        setUser(userData);
    await SecureStore.setItemAsync('Tokenbb', token);
        // ¡Aquí está la corrección! Convertimos el objeto userData a string
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    };

    const logout = async () => {
        setSession(null);
        setUser(null);
    await SecureStore.deleteItemAsync('Tokenbb');
        await SecureStore.deleteItemAsync('userData'); // Borra también los datos del usuario
    };

    // Ahora expones también al usuario en el value
    return (
        <AuthContext.Provider value={{ session, user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};