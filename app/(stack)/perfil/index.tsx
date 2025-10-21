import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Importamos los íconos de la librería que usa la app original
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";

// --- Subcomponente para cada opción de menú (Tarjeta) ---
interface ProfileOptionProps {
    iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
    iconLibrary: 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons';
    title: string;
    description: string;
    onPress: () => void;
}

interface UserData {
    UserName?: string;
    IdUsuario?: number;
}

const ProfileOption = ({ iconName, iconLibrary, title, description, onPress }: ProfileOptionProps) => {
    const IconComponent = iconLibrary === 'MaterialIcons' ? MaterialIcons :
        iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

    return (
        <Pressable style={styles.optionCard} onPress={onPress}>
            <IconComponent
                // @ts-ignore - TypeScript puede quejarse de la unión de tipos de íconos, pero es seguro.
                name={iconName}
                size={24}
                color="#1a56db" // Azul para los íconos de opción
                style={styles.optionIcon}
            />
            <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{title}</Text>
                <Text style={styles.optionDescription}>{description}</Text>
            </View>
        </Pressable>
    );
}



const PerfilScreen = () => {
    // Datos de ejemplo para el estado del dispositivo
    const batteryLevel = "77.00%";
    const storageFree = "402.72 GB";
    const cacheSize = "12.69 KB / 0.01 MB";
    const [userName, setUserName] = useState<string>('Usuario');

    const handleLogout = () => {
        console.log("Cerrar Sesión Presionado");
        // Lógica de cerrar sesión aquí
    };

    useEffect(() => {
        loadUserData();
    }, []);


    const loadUserData = async () => {
        try {
            const userData = await SecureStore.getItem('DataUser');
            if (userData) {
                const parsed: UserData = JSON.parse(userData);
                setUserName(parsed.UserName || 'Usuario');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={styles.title}>Tu Perfil</Text>

                <View style={styles.contentArea}>

                    {/* Tarjeta Azul de Usuario (Header) */}
                    <View style={styles.userInfoCard}>
                        <Image source={require("../../../assets/images/Logos/logo.png")} style={styles.logo} />
                        <View style={{ justifyContent: "center" }}>
                            <Text style={styles.nombre}> {userName} </Text>
                            <Text style={styles.rol}>Administrador General de SiCobra</Text>
                        </View>
                    </View>

                    {/* Opciones de Menú */}
                    <ProfileOption
                        iconName="cog"
                        iconLibrary="MaterialCommunityIcons"
                        title="Configuracion"
                        description="Cambiar la configuración de la cuenta."
                        onPress={() => console.log('Ir a Configuración')}
                    />

                    <ProfileOption
                        iconName="cached"
                        iconLibrary="MaterialIcons"
                        title="Eliminar Caché"
                        description="Eliminar Grabaciones Antiguas."
                        onPress={() => console.log('Eliminar Caché')}
                    />

                    <ProfileOption
                        iconName="bell"
                        iconLibrary="MaterialCommunityIcons"
                        title="Contacto SOS"
                        description="Contactos de Emergencia."
                        onPress={() => console.log('Ir a Contacto SOS')}
                    />

                    <ProfileOption
                        iconName="information-circle-outline"
                        iconLibrary="Ionicons"
                        title="Acerca de"
                        description="Aquí puedes ver datos de la App."
                        onPress={() => console.log('Ir a Acerca de')}
                    />

                    {/* Información del Sistema
                    <View style={styles.systemInfoContainer}>
                        <Text style={styles.systemInfoText}>Nivel de batería: {batteryLevel}</Text>
                        <Text style={styles.systemInfoText}>Almacenamiento libre: {storageFree}</Text>
                        <Text style={styles.systemInfoText}>Tamaño del caché: {cacheSize}</Text>
                    </View> */}

                    {/* Botón de Cerrar Sesión */}
                    <Pressable style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                    </Pressable>

                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default PerfilScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f3f4f6', // Fondo gris claro de la App
    },
    scrollContent: {
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        paddingHorizontal: 20,
        paddingVertical: 15,
        color: '#1f2937',
    },
    contentArea: {
        paddingHorizontal: 20,
        gap: 15, // Espacio entre las tarjetas y secciones
    },

    // --- Tarjeta de Usuario (Header Azul) ---
    userInfoCard: {
        backgroundColor: "#1a56db", // Azul
        borderRadius: 10,
        flexDirection: "row",
        padding: 15,
        marginBottom: 5,
        alignItems: 'center',
    },
    logo: {
        width: 60, // Ajustado para ser más proporcional
        height: 60,
        borderRadius: 30, // Si es un logo circular, si no, déjalo sin borderRadius
        marginRight: 15,
    },
    nombre: {
        color: "white",
        fontSize: 18, // Ligeramente más pequeño
        fontWeight: "bold",
    },
    rol: {
        color: "#d1d5db", // Gris claro para el rol
        fontSize: 14,
        marginTop: 2,
    },

    // --- Estilo de Opciones de Menú (ProfileOption) ---
    optionCard: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    optionIcon: {
        marginRight: 15,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    optionDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },

    // --- Información del Sistema ---
    systemInfoContainer: {
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    systemInfoText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 4,
    },

    // --- Botón de Cerrar Sesión ---
    logoutButton: {
        backgroundColor: '#ef4444', // Rojo
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    }
});