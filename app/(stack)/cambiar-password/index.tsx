import { environment } from "@/components/core/environment";
import { cambiarClave } from "@/components/core/miCore";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CambiarPasswordScreen() {
    const params = useLocalSearchParams();
    const [userName, setUserName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRequired, setIsRequired] = useState(false); // Si viene del login por cambio requerido
    const router = useRouter();
    const { logout } = useAuth();

    useEffect(() => {
        // Si viene con parámetros del login, es un cambio requerido
        if (params.userName) {
            setUserName(params.userName as string);
            setIsRequired(true);
        }
    }, [params]);

    const validatePassword = (password: string): boolean => {
        if (password.length < 6) {
            showErrorToast("Contraseña débil", "La contraseña debe tener al menos 6 caracteres.");
            return false;
        }
        // Puedes agregar más validaciones aquí (mayúsculas, números, etc.)
        return true;
    };

    const handleCambiarPassword = async () => {
        if (!userName.trim()) {
            showErrorToast("Campo requerido", "Por favor ingresa tu nombre de usuario.");
            return;
        }
        if (!currentPassword.trim()) {
            showErrorToast("Campo requerido", "Por favor ingresa tu contraseña actual.");
            return;
        }
        if (!newPassword.trim()) {
            showErrorToast("Campo requerido", "Por favor ingresa tu nueva contraseña.");
            return;
        }
        if (!confirmPassword.trim()) {
            showErrorToast("Campo requerido", "Por favor confirma tu nueva contraseña.");
            return;
        }
        if (newPassword !== confirmPassword) {
            showErrorToast("Contraseñas no coinciden", "La nueva contraseña y la confirmación deben ser iguales.");
            return;
        }
        if (currentPassword === newPassword) {
            showErrorToast("Contraseña inválida", "La nueva contraseña debe ser diferente a la actual.");
            return;
        }
        if (!validatePassword(newPassword)) {
            return;
        }

        try {
            setLoading(true);
            const resultado = await cambiarClave(userName, currentPassword, newPassword);
            
            if (resultado) {
                showSuccessToast(
                    "Contraseña actualizada",
                    "Tu contraseña ha sido cambiada exitosamente. Por favor, inicia sesión con tu nueva contraseña."
                );
                
                // Cerrar sesión y redirigir al login
                await logout();
                
                setTimeout(() => {
                    router.replace('/');
                }, 2000);
            } else {
                showErrorToast(
                    "Error",
                    "No se pudo cambiar la contraseña. Verifica que tu contraseña actual sea correcta."
                );
            }
        } catch (error: any) {
            console.error("Error al cambiar contraseña:", error);
            showErrorToast(
                "Error",
                error?.message || "No se pudo cambiar la contraseña. Intenta nuevamente."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (isRequired) {
            // Si es cambio requerido, debe cerrar sesión
            showErrorToast(
                "Cambio requerido",
                "Debes cambiar tu contraseña para continuar. Serás redirigido al login."
            );
            logout();
            router.replace('/');
        } else {
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        {!isRequired && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleCancel}
                            >
                                <Feather name="arrow-left" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                        <Image
                            source={require("../../../assets/images/bigbrother.jpg")}
                            style={styles.headerImage}
                        />
                        <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
                    </View>

                    {/* Contenido */}
                    <View style={styles.content}>
                        {isRequired && (
                            <View style={styles.warningBox}>
                                <Feather name="alert-triangle" size={20} color="#ff6b6b" />
                                <Text style={styles.warningText}>
                                    Es necesario que cambies tu contraseña para continuar usando la aplicación.
                                </Text>
                            </View>
                        )}

                        <Text style={styles.title}>Actualiza tu contraseña</Text>
                        <Text style={styles.subtitle}>
                            Ingresa tu contraseña actual y elige una nueva contraseña segura.
                        </Text>

                        {/* Input usuario */}
                        <View style={styles.inputContainer}>
                            <Feather name="user" size={24} color="#041dfdff" />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de usuario"
                                value={userName}
                                onChangeText={setUserName}
                                autoCapitalize="none"
                                editable={!loading && !isRequired}
                            />
                        </View>

                        {/* Input contraseña actual */}
                        <View style={styles.inputContainer}>
                            <Feather name="lock" size={24} color="#041dfdff" />
                            <TextInput
                                style={styles.input}
                                placeholder="Contraseña actual"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrentPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                <Feather
                                    name={showCurrentPassword ? "eye" : "eye-off"}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Input nueva contraseña */}
                        <View style={styles.inputContainer}>
                            <Feather name="key" size={24} color="#041dfdff" />
                            <TextInput
                                style={styles.input}
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Feather
                                    name={showNewPassword ? "eye" : "eye-off"}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Input confirmar contraseña */}
                        <View style={styles.inputContainer}>
                            <Feather name="check-circle" size={24} color="#041dfdff" />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar nueva contraseña"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Feather
                                    name={showConfirmPassword ? "eye" : "eye-off"}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Info box */}
                        <View style={styles.infoBox}>
                            <Feather name="info" size={18} color="#041dfdff" />
                            <Text style={styles.infoText}>
                                La contraseña debe tener al menos 6 caracteres. Se recomienda usar una combinación de letras, números y símbolos.
                            </Text>
                        </View>

                        {/* Botón cambiar */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleCambiarPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Cambiar Contraseña</Text>
                            )}
                        </TouchableOpacity>

                        {/* Botón cancelar */}
                        {!isRequired && (
                            <TouchableOpacity
                                style={styles.linkButton}
                                onPress={handleCancel}
                                disabled={loading}
                            >
                                <Text style={styles.linkText}>Cancelar</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.version}>
                        Versión {environment.version}
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        backgroundColor: "#041dfdff",
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: "relative",
    },
    backButton: {
        position: "absolute",
        left: 20,
        top: 30,
        padding: 10,
    },
    headerImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    content: {
        flex: 1,
        padding: 25,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 25,
        lineHeight: 22,
    },
    warningBox: {
        flexDirection: "row",
        backgroundColor: "#ffe5e5",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: "#ff6b6b",
    },
    warningText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: "#d32f2f",
        lineHeight: 20,
        fontWeight: "600",
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#e3f2fd",
        padding: 15,
        borderRadius: 10,
        marginBottom: 25,
        borderLeftWidth: 4,
        borderLeftColor: "#041dfdff",
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: "#333",
        lineHeight: 18,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ddd",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: "#333",
    },
    button: {
        backgroundColor: "#041dfdff",
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: "#7a9cff",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    linkButton: {
        marginTop: 20,
        alignItems: "center",
    },
    linkText: {
        color: "#041dfdff",
        fontSize: 16,
        fontWeight: "600",
    },
    version: {
        textAlign: "center",
        color: "#999",
        fontSize: 14,
        marginTop: 20,
        marginBottom: 20,
    },
});
