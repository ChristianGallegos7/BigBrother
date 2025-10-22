import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Importamos los íconos de la librería que usa la app original
import { desconectarUsuario } from "@/components/core/miCore";
import { useAuth } from '@/context/AuthContext';
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { eliminarGrabacionesSincronizadas } from "@/utils/database/database";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from "react";

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
    const [modalVisible, setModalVisible] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { logout } = useAuth();

    const showModal = () => {
        setModalVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const hideModal = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setModalVisible(false);
        });
    };

    const clearCache = async () => {
        setIsClearing(true);
        try {
            const deletedCount = await eliminarGrabacionesSincronizadas();
            hideModal();
            if (deletedCount > 0) {
                showSuccessToast(
                    'Caché eliminado',
                    `Se eliminaron ${deletedCount} grabaciones sincronizadas`
                );
            } else {
                showSuccessToast(
                    'Sin grabaciones',
                    'No hay grabaciones sincronizadas para eliminar'
                );
            }
        } catch (error) {
            console.error('Error al eliminar caché:', error);
            hideModal();
            showErrorToast(
                'Error',
                'No se pudo eliminar el caché. Intenta nuevamente.'
            );
        } finally {
            setIsClearing(false);
        }
    };

    const handleLogout = async () => {
        console.log("Cerrar Sesión Presionado");
        try {
            const resultadoDesconexion = await desconectarUsuario();
            if (resultadoDesconexion === true) {
                await logout();
                console.log('✅ Sesión cerrada correctamente');
            }
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
        }
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
                            <Text style={styles.rol}>SiCobra</Text>
                        </View>
                    </View>

                    {/* Opciones de Menú */}
                    <ProfileOption
                        iconName="cog"
                        iconLibrary="MaterialCommunityIcons"
                        title="Configuracion"
                        description="Cambiar la configuración de la cuenta."
                        onPress={() => {
                            // @ts-ignore
                            router.push('/(stack)/configuracion/')
                        }}
                    />

                    <ProfileOption
                        iconName="cached"
                        iconLibrary="MaterialIcons"
                        title="Eliminar Caché"
                        description="Eliminar Grabaciones Antiguas."
                        onPress={showModal}
                    />

                    <ProfileOption
                        iconName="bell"
                        iconLibrary="MaterialCommunityIcons"
                        title="Contacto SOS"
                        description="Contactos de Emergencia."
                        onPress={() => router.push('/contactosos/')}
                    />

                    <ProfileOption
                        iconName="information-circle-outline"
                        iconLibrary="Ionicons"
                        title="Acerca de"
                        description="Aquí puedes ver datos de la App."
                        onPress={() => router.push('/acercade/')}
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

            {/* Modal de confirmación para eliminar caché */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="none"
                onRequestClose={hideModal}
            >
                <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <MaterialIcons name="delete-sweep" size={50} color="#1a56db" />
                        </View>
                        <Text style={styles.modalTitle}>Confirmación</Text>
                        <Text style={styles.modalMessage}>
                            ¿Estás seguro de eliminar las grabaciones sincronizadas? Esta acción no se puede deshacer.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={hideModal}
                                disabled={isClearing}
                            >
                                <Text style={styles.modalButtonText}>No, Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton, isClearing && styles.buttonDisabled]}
                                onPress={clearCache}
                                disabled={isClearing}
                            >
                                {isClearing ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.modalButtonText}>Sí, Eliminar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Modal>
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
    },

    // --- Estilos del Modal ---
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    modalIconContainer: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#e3f2fd',
        borderRadius: 50,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#4b5563',
        marginBottom: 25,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6b7280',
    },
    confirmButton: {
        backgroundColor: '#1a56db',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
});