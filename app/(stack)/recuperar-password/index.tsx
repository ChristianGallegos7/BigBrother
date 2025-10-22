import { environment } from "@/components/core/environment";
import { regenerarClavePorOlvido } from "@/components/core/miCore";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function RecuperarPasswordScreen() {
    const [userName, setUserName] = useState("");
    const [identificacion, setIdentificacion] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRecuperarPassword = async () => {
        if (!userName.trim()) {
            showErrorToast("Campo requerido", "Por favor ingresa tu nombre de usuario.");
            return;
        }
        if (!identificacion.trim()) {
            showErrorToast("Campo requerido", "Por favor ingresa tu número de identificación.");
            return;
        }

        try {
            setLoading(true);
            const response = await regenerarClavePorOlvido(userName, identificacion);
            
            if (response && !response.CodigoError) {
                showSuccessToast(
                    "Contraseña enviada",
                    "Se ha enviado una nueva contraseña temporal a tu WhatsApp. Por favor, inicia sesión con ella y cámbiala inmediatamente."
                );
                // Esperar 2 segundos antes de volver al login
                setTimeout(() => {
                    router.replace('/');
                }, 2000);
            } else {
                showErrorToast(
                    "Error",
                    response?.MensajeError || "No se pudo recuperar la contraseña. Verifica tus datos."
                );
            }
        } catch (error: any) {
            console.error("Error al recuperar contraseña:", error);
            showErrorToast(
                "Error",
                error?.MensajeError || "No se pudo recuperar la contraseña. Verifica tus datos e intenta nuevamente."
            );
        } finally {
            setLoading(false);
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
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <Image
                            source={require("../../../assets/images/bigbrother.jpg")}
                            style={styles.headerImage}
                        />
                        <Text style={styles.headerTitle}>Recuperar Contraseña</Text>
                    </View>

                    {/* Contenido */}
                    <View style={styles.content}>
                        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                        <Text style={styles.subtitle}>
                            Ingresa tu nombre de usuario y número de identificación para recibir una nueva contraseña temporal.
                        </Text>

                        {/* Info box */}
                        <View style={styles.infoBox}>
                            <Feather name="info" size={20} color="#041dfdff" />
                            <Text style={styles.infoText}>
                                Recibirás una contraseña temporal en tu correo electronico registrado. Deberás cambiarla al iniciar sesión.
                            </Text>
                        </View>

                        {/* Input usuario */}
                        <View style={styles.inputContainer}>
                            <Feather name="user" size={24} color="#041dfdff" />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de usuario"
                                value={userName}
                                onChangeText={setUserName}
                                autoCapitalize="none"
                                editable={!loading}
                            />
                        </View>

                        {/* Input identificación */}
                        <View style={styles.inputContainer}>
                            <Feather name="credit-card" size={24} color="#041dfdff" />
                            <TextInput
                                style={styles.input}
                                placeholder="Número de identificación"
                                value={identificacion}
                                onChangeText={setIdentificacion}
                                keyboardType="numeric"
                                editable={!loading}
                            />
                        </View>

                        {/* Botón recuperar */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRecuperarPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Recuperar Contraseña</Text>
                            )}
                        </TouchableOpacity>

                        {/* Botón volver */}
                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <Text style={styles.linkText}>Volver al inicio de sesión</Text>
                        </TouchableOpacity>
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
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
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
