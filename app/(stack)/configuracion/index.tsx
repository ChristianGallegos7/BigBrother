import { eliminarCuenta } from "@/components/core/miCore";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OptionCardProps {
    icon: keyof typeof Feather.glyphMap | keyof typeof MaterialIcons.glyphMap;
    iconLibrary: 'Feather' | 'MaterialIcons';
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
    danger?: boolean;
}

const OptionCard = ({ icon, iconLibrary, title, description, onPress, color = "#041dfdff", danger = false }: OptionCardProps) => {
    const IconComponent = iconLibrary === 'MaterialIcons' ? MaterialIcons : Feather;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
                danger && styles.optionCardDanger
            ]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
                <IconComponent
                    // @ts-ignore
                    name={icon}
                    size={24}
                    color={danger ? "#ff3b30" : color}
                />
            </View>
            <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, danger && styles.optionTitleDanger]}>
                    {title}
                </Text>
                <Text style={styles.optionDescription}>
                    {description}
                </Text>
            </View>
            <Feather name="chevron-right" size={24} color="#999" />
        </Pressable>
    );
};

const ConfiguracionScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { logout } = useAuth();

    const handleEliminarCuenta = async () => {
        setIsLoading(true);
        try {
            const resultado = await eliminarCuenta();
            if (resultado === 'CUENTA ELIMINADA') {
                showSuccessToast('Cuenta eliminada', 'Tu cuenta ha sido eliminada exitosamente');
                // Cerrar sesión y redirigir al login
                await logout();
                setTimeout(() => {
                    router.replace('/');
                }, 2000);
            } else {
                showErrorToast('Error', resultado || 'No se pudo eliminar la cuenta');
            }
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            showErrorToast('Error al eliminar la cuenta', 'Por favor, inténtalo de nuevo más tarde.');
        } finally {
            setIsLoading(false);
            setModalVisible(false);
        }
    };

    const confirmEliminarCuenta = () => {
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>
                        Administra la seguridad de tu cuenta
                    </Text>
                </View>

                {/* Sección de Seguridad */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Seguridad</Text>
                    
                    <OptionCard
                        icon="key"
                        iconLibrary="Feather"
                        title="Cambiar Contraseña"
                        description="Actualiza tu contraseña de forma segura"
                        onPress={() => {
                            // @ts-ignore - La ruta existe pero TypeScript no la reconoce aún
                            router.push('/(stack)/cambiar-password/');
                        }}
                        color="#041dfdff"
                    />
                </View>

                {/* Sección de Cuenta */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gestión de Cuenta</Text>
                    
                    <OptionCard
                        icon="delete-forever"
                        iconLibrary="MaterialIcons"
                        title="Eliminar Cuenta"
                        description="Elimina tu cuenta de forma permanente"
                        onPress={confirmEliminarCuenta}
                        danger
                    />
                </View>

                {/* Info box */}
                <View style={styles.infoBox}>
                    <Feather name="info" size={20} color="#041dfdff" />
                    <Text style={styles.infoText}>
                        Los cambios en tu cuenta pueden requerir que vuelvas a iniciar sesión.
                    </Text>
                </View>
            </ScrollView>

            {/* Modal de confirmación para eliminar cuenta */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIconContainer}>
                            <MaterialIcons name="warning" size={60} color="#ff3b30" />
                        </View>
                        <Text style={styles.modalTitle}>¿Eliminar cuenta?</Text>
                        <Text style={styles.modalText}>
                            ¿Está seguro de eliminar su cuenta? Sus datos se borrarán permanentemente y no se podrá deshacer esta acción.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setModalVisible(false)}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.acceptButton, isLoading && styles.buttonDisabled]}
                                onPress={handleEliminarCuenta}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.acceptButtonText}>Eliminar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Loading overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#041dfdff" />
                    <Text style={styles.loadingText}>Eliminando cuenta...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: "white",
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: "#666",
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
        marginLeft: 5,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#f0f0f0",
    },
    optionCardPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    optionCardDanger: {
        borderColor: "#ffe5e5",
        backgroundColor: "#fffafa",
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#e3f2fd",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    iconContainerDanger: {
        backgroundColor: "#ffe5e5",
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    optionTitleDanger: {
        color: "#ff3b30",
    },
    optionDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 18,
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#e3f2fd",
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: "#041dfdff",
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxWidth: 400,
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
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#ffe5e5',
        borderRadius: 50,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#666',
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
    cancelButton: {
        flex: 1,
        backgroundColor: '#6c757d',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#ff3b30',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#ff9a95',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
});

export default ConfiguracionScreen;