import { environment } from "@/components/core/environment";
import { catalogosList, GrabarCliente } from "@/components/core/miCore";
import { DetalleCatalogo } from "@/models/detalle-catalogo.interface";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { guardarClienteLocalEnSQLite } from "@/utils/database/database";
import { Ionicons } from "@expo/vector-icons";
import * as Network from 'expo-network';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const AgregarClienteScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [tipoIdentificacion, setTipoIdentificacion] = useState('');
    const [identificacion, setIdentificacion] = useState('');
    const [agencia, setAgencia] = useState('');
    const [lineaCredito, setLineaCredito] = useState('');
    const [numeroOperacion, setNumeroOperacion] = useState('');
    const [codigoCedente, setCodigoCedente] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [agenciasArray, setAgenciasArray] = useState<string[]>([]);
    const [lineasCreditoArray, setLineasCreditoArray] = useState<string[]>([]);

    // 🌐 Detectar estado de conexión a Internet
    useEffect(() => {
        obtenerCatalogos();
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

        // Verificar cada 5 segundos
        intervalId = setInterval(checkConnection, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const validarFormulario = (): boolean => {
        if (!nombres.trim()) {
            showErrorToast('Error', 'El nombre es obligatorio');
            return false;
        }
        if (!identificacion.trim()) {
            showErrorToast('Error', 'La identificación es obligatoria');
            return false;
        }

        return true;
    };

    const limpiarFormulario = () => {
        setNombres('');
        setApellidos('');
        setTipoIdentificacion('');
        setIdentificacion('');
        setAgencia('');
        setLineaCredito('');
        setNumeroOperacion('');
        setCodigoCedente('');
    };

    const handleGuardar = async () => {
        if (!validarFormulario()) {
            return;
        }

        const validarIdentificacionPorPais: any = {
            PE: 8,
            EC: 10,
            GT: 13,
        }

        const identificacionValida = identificacion.replace(/\s/g, '').replace(/\D/g, '');
        const numeroOperacionValida = numeroOperacion.replace(/\s/g, '').replace(/\D/g, '');
        const esPaisValido = environment.pais in validarIdentificacionPorPais;
        const esDniValido = identificacionValida.length === validarIdentificacionPorPais[environment.pais];
        const esNumeroOperacionValido = numeroOperacionValida.length >= 6 && numeroOperacionValida.length <= 16;

        if (!esPaisValido) {
            showErrorToast('Error', 'País seleccionado no es válido');
            return;
        }

        if (environment.pais === 'PE' || environment.pais === 'EC') {
            if (!esDniValido) {
                showErrorToast('Error', `La identificación debe tener 8 dígitos para ${environment.pais}`);
                return;
            }
            if (!esNumeroOperacionValido) {
                showErrorToast('Error', `El número de operación debe tener entre 6 y 16 dígitos para ${environment.pais}`);
                return;
            }
        }

        if (environment.pais === 'GT') {
            if (!esDniValido) {
                showErrorToast('Error', `La identificación debe tener 13 dígitos para ${environment.pais}`);
                return;
            }
            if (!agencia) {
                showErrorToast('Error', 'Debe seleccionar una agencia.');
                return;
            }
            if (!lineaCredito) {
                showErrorToast('Error', 'Debe seleccionar una línea de crédito.');
                return;
            }
        }

        //Obtener datos de la sesion
        const dataUser = await SecureStore.getItemAsync('DataUser');
        const datosRecuperados = JSON.parse(dataUser || '{}');

        try {
            setLoading(true);

            // Limpiar identificación y número de operación
            const cleanedDNI = identificacion.replace(/\s/g, '').replace(/\D/g, '');
            const cleanedNumeroOperacion = numeroOperacion.replace(/\s/g, '').replace(/\D/g, '');

            // Armar el objeto con el formato del backend
            const clienteData = {
                Apellidos: apellidos,
                CodigoCedente: codigoCedente || 'MANUAL',
                DatosAdicionales: null,
                FechaCarga: new Date().toISOString(),
                Fuente: 'BIGBROTHER',
                IdClienteCarga: 0,
                IdExterno: null,
                Identificacion: cleanedDNI,
                Nombres: nombres,
                NumeroOperacion: cleanedNumeroOperacion,
                TieneGrabacion: false,
                Agencia: agencia || '',
                LineaCredito: lineaCredito || '',
                TipoIdentificacion: 'CED',
                UsuarioAsignacion: datosRecuperados?.UserName || ''
            };

            console.log('📤 Preparando guardado del cliente...');
            console.log('🌐 Estado de conexión:', isOnline ? 'Online' : 'Offline');

            // Intentar guardar según la conexión
            try {
                if (isOnline) {
                    // 🌐 MODO ONLINE: Guardar en el servidor
                    console.log('📡 Guardando en servidor...');
                    const resultado = await GrabarCliente(clienteData);

                    if (!resultado) {
                        throw new Error('No se pudo guardar el cliente en el servidor');
                    }

                    console.log('✅ Cliente guardado exitosamente en servidor:', resultado);
                    showSuccessToast('Éxito', 'Cliente agregado correctamente');
                    limpiarFormulario();

                    // Navegar al home y pasar los datos del cliente guardado
                    setTimeout(() => {
                        router.push({
                            pathname: '/(stack)/home',
                            params: {
                                clientData: JSON.stringify(resultado || clienteData),
                                fromAddClient: 'true'
                            }
                        });
                    }, 500);
                } else {
                    // 📱 MODO OFFLINE: Sin conexión, intentar guardar localmente
                    throw new Error('Sin conexión a Internet');
                }
            } catch (error: any) {
                console.warn(`⚠️ Error al guardar en servidor (${environment.pais}):`, error.message);

                // Intentar guardar localmente en SQLite
                try {
                    console.log('💾 Guardando localmente en SQLite...');
                    await guardarClienteLocalEnSQLite(clienteData);

                    console.log('✅ Cliente guardado localmente');
                    showSuccessToast(
                        'Guardado Local',
                        'Cliente guardado localmente. Se sincronizará cuando haya conexión.'
                    );
                    limpiarFormulario();

                    // Navegar al home y pasar los datos del cliente guardado localmente
                    setTimeout(() => {
                        router.push({
                            pathname: '/(stack)/home',
                            params: {
                                clientData: JSON.stringify(clienteData),
                                fromAddClient: 'true',
                                savedLocally: 'true'
                            }
                        });
                    }, 500);
                } catch (localError: any) {
                    console.error('❌ Error al guardar localmente:', localError);
                    showErrorToast('Error', 'No se pudo guardar el cliente. Intente nuevamente.');
                }
            }

        } catch (error: any) {
            console.error('❌ Error general al guardar cliente:', error);
            showErrorToast('Error', 'Ocurrió un error inesperado al guardar el cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelar = () => {
        if (nombres || identificacion) {
            Alert.alert(
                'Cancelar',
                '¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados.',
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Sí, cancelar',
                        onPress: () => router.back(),
                        style: 'destructive'
                    }
                ]
            );
        } else {
            router.back();
        }
    };

    const obtenerCatalogos = async () => {
        try {
            console.log("Iniciando obtención de catálogos...");

            let dataGT;
            if (isOnline) {
                dataGT = await catalogosList();
                console.log("Catálogos obtenidos para guatemala:", dataGT);
            } else {
                const local = await SecureStore.getItem('DatosGT');
                if (!local) {
                    console.warn("No hay catálogos guardados localmente.");
                    return;
                }
                dataGT = local;
            }

            if (dataGT) {
                const parsedDataGT = typeof dataGT === 'string' ? JSON.parse(dataGT) : [];
                const agencias = parsedDataGT.find((item: any) => item.NombreCatalogo === 'Agencias')?.DetalleCatalogos.map((detalle: DetalleCatalogo) => detalle.Descripcion) || [];

                const lineasCredito = parsedDataGT.find((item: any) => item.NombreCatalogo === 'LineaCredito')?.DetalleCatalogos.map((detalle: DetalleCatalogo) => detalle.Descripcion) || [];

                setAgenciasArray(agencias);
                setLineasCreditoArray(lineasCredito);

                console.log("Catálogos cargados correctamente.");
            }
        } catch (error) {
            console.error("Error al obtener catálogos:", error);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >

                <View style={styles.header}>
                    <Ionicons name="person-add" size={48} color="#007AFF" />
                    <Text style={styles.headerTitle}>Nuevo Cliente</Text>
                    <Text style={styles.headerSubtitle}>Ingresa los datos del cliente</Text>

                    {/* 🌐 Indicador de conexión */}
                    <View style={[styles.connectionBadge, isOnline ? styles.online : styles.offline]}>
                        <Ionicons
                            name={isOnline ? "wifi" : "wifi-outline"}
                            size={14}
                            color="#fff"
                        />
                        <Text style={styles.connectionText}>
                            {isOnline ? 'Conectado' : 'Sin conexión'}
                        </Text>
                    </View>
                </View>

                <View style={styles.form}>
                    {/* Nombres - Obligatorio */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Nombres <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingrese los nombres"
                            value={nombres}
                            onChangeText={setNombres}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Apellidos */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Apellidos
                            <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingrese los apellidos"
                            value={apellidos}
                            onChangeText={setApellidos}
                            autoCapitalize="words"
                        />
                    </View>

                 
                    {/* Identificación - Obligatorio */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Identificación <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Número de identificación"
                            value={identificacion}
                            onChangeText={setIdentificacion}
                            keyboardType="default"
                        />
                    </View>

                    {/* Agencia - Solo para Guatemala */}
                    {environment.pais === 'GT' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Agencia <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de la agencia"
                                value={agencia}
                                onChangeText={setAgencia}
                            />
                        </View>
                    )}

                    {/* Línea de Crédito - Solo para Guatemala */}
                    {environment.pais === 'GT' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Línea de Crédito <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Línea de crédito"
                                value={lineaCredito}
                                onChangeText={setLineaCredito}
                            />
                        </View>
                    )}

                    {/* Número de Operación */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Número de Operación
                            <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Número de operación"
                            value={numeroOperacion}
                            onChangeText={setNumeroOperacion}
                        />
                    </View>


                </View>

               
            </ScrollView>

            {/* Botones de acción fijos en la parte inferior */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancelar}
                    disabled={loading}
                >
                    <Ionicons name="close-circle-outline" size={20} color="#666" />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleGuardar}
                    disabled={loading}
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                        {loading ? 'Guardando...' : 'Guardar Cliente'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Espacio para los botones fijos
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    connectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    online: {
        backgroundColor: '#34C759',
    },
    offline: {
        backgroundColor: '#FF3B30',
    },
    connectionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#ff3b30',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    footerNote: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
});

export default AgregarClienteScreen;
