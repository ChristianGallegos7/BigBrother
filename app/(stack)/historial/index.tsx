import { environment } from "@/components/core/environment";
import { ConsultarGrabacionesUsuarioHoy, RegistroGrabacion, RegistroGrabacionGT } from "@/components/core/miCore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Grabacion } from "@/models/grabacion.interface";
import { showSuccessToast } from "@/utils/alertas/alertas";
import { getDBConnection } from "@/utils/database/database";
import { Ionicons } from "@expo/vector-icons";
import { getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Sin fecha';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const formatDateWithSeconds = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Sin fecha';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const formatDuration = (durationInSeconds: number) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${formattedSeconds}`;
};

const AudioItem = ({ item, onPress }: { item: Grabacion; onPress: () => void }) => {
    const isPending = item.EsLocal === true;

    return (
        <Pressable onPress={onPress} style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons
                    name={isPending ? "alert-circle" : "checkmark-circle"}
                    size={24}
                    color={isPending ? "#ef4444" : "#22c55e"}
                    style={styles.iconStatus}
                />
                <Text style={styles.cardFileName} numberOfLines={1}>
                    {item.NombreArchivo}
                </Text>
            </View>

            <View style={styles.detailsAndActions}>
                <View style={styles.detailsColumn}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Cliente:</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                            {item.ClienteNombreCompleto || 'Sin nombre'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Duración:</Text>
                        <Text style={styles.detailValue}>{formatDuration(item.Duracion)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Grabado:</Text>
                        <Text style={styles.detailValue}>
                            {formatDate(item.FechaFinGrabacion)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Estado:</Text>
                        <Text style={[styles.detailValue, isPending ? styles.statusPending : styles.statusSent]}>
                            {isPending ? "PENDIENTE" : "ENVIADO"}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <Ionicons name="chevron-forward" size={24} color="#6b7280" />
                </View>
            </View>
        </Pressable>
    );
};

const HistorialScreen = () => {
    const { isOnline } = useNetworkStatus();
    const [lista, setLista] = useState<Grabacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [numGrabacion, setNumGrabacion] = useState(0);
    const [mostrarActivityIndicator, setMostrarActivityIndicator] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [grabacionSeleccionada, setGrabacionSeleccionada] = useState<Grabacion | null>(null);

    useEffect(() => {
        cargarDatos();
    }, [isOnline]);

    const cargarDatos = async () => {
        setLoading(true);
        await obtenerDatosAsync();
        await actualizarNumGrabaciones();
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await obtenerDatosAsync();
        await actualizarNumGrabaciones();
        setRefreshing(false);
    };

    const obtenerDatosAsync = async () => {
        try {
            if (!isOnline) {
                console.log('📴 Sin conexión');
                // Mostrar audios enviados desde SecureStore si existen
                const audiosEnviados = await SecureStore.getItem('AudiosEnviados');
                if (audiosEnviados) {
                    try {
                        const lista: Grabacion[] = JSON.parse(audiosEnviados);
                        setLista(Array.isArray(lista) ? lista : []);
                        return;
                    } catch {}
                }
                // Si no hay en SecureStore, intentar cargar de SQLite
                try {
                    const db = await getDBConnection();
                    const locales: Grabacion[] = await db.getAllAsync('SELECT * FROM grabaciones_pendientes WHERE sincronizado = 1 AND EsLocal = 1');
                    setLista(Array.isArray(locales) ? locales : []);
                } catch {
                    setLista([]);
                }
                return;
            }

            console.log('⏱️ Iniciando consulta al servidor...');
            const startTime = Date.now();

            // Timeout de 10 segundos para la petición
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: La consulta tardó demasiado')), 10000)
            );

            const datos: Grabacion[] = await Promise.race([
                ConsultarGrabacionesUsuarioHoy(),
                timeoutPromise
            ]);

            const serverTime = Date.now() - startTime;
            console.log(`📥 Grabaciones recibidas: ${datos.length} (${serverTime}ms)`);

            const datosSinError = datos.filter((item: any) => !item.EsError);

            // Consulta SQLite con reintentos y manejo robusto de errores
            let locales: { NumeroOperacion: string; Identificacion: string }[] = [];
            const maxReintentos = 3;
            let intentoActual = 0;
            
            while (intentoActual < maxReintentos) {
                try {
                    const dbStartTime = Date.now();
                    const db = await getDBConnection();
                    
                    // Timeout para la consulta SQLite (2 segundos)
                    const sqliteTimeoutPromise = new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error('SQLite Timeout')), 2000)
                    );

                    locales = await Promise.race([
                        db.getAllAsync<{ NumeroOperacion: string; Identificacion: string }>(
                            `SELECT NumeroOperacion, Identificacion FROM grabaciones_pendientes WHERE sincronizado = 1 AND EsLocal = 1`
                        ),
                        sqliteTimeoutPromise
                    ]);

                    const dbTime = Date.now() - dbStartTime;
                    console.log(`💾 Consulta SQLite completada: ${locales.length} registros (${dbTime}ms)`);
                    break; // Salir del bucle si la consulta fue exitosa
                    
                } catch (dbError: any) {
                    intentoActual++;
                    console.warn(`⚠️ Error en SQLite (intento ${intentoActual}/${maxReintentos}):`, dbError?.message);
                    
                    if (intentoActual >= maxReintentos) {
                        console.error('❌ SQLite falló después de múltiples intentos. Continuando sin datos locales.');
                        locales = []; // Continuar sin datos locales
                        break;
                    }
                    
                    // Esperar antes de reintentar (100ms, 200ms, 300ms)
                    await new Promise(resolve => setTimeout(resolve, intentoActual * 100));
                }
            }

            const listaMarcada = datosSinError.map(item => {
                const esLocal = locales.some(
                    (loc: any) => loc.NumeroOperacion === item.NumeroOperacion && loc.Identificacion === item.Identificacion
                );
                return { ...item, EsLocal: esLocal };
            });

            setLista(listaMarcada);
            console.log(`✅ Historial cargado en ${Date.now() - startTime}ms`);
        } catch (error: any) {
            console.error('❌ Error en obtenerDatosAsync:', error?.message || error);
            // Si falla la consulta al servidor, mostrar audios enviados de SecureStore
            try {
                const audiosEnviados = await SecureStore.getItem('AudiosEnviados');
                if (audiosEnviados) {
                    const lista: Grabacion[] = JSON.parse(audiosEnviados);
                    setLista(Array.isArray(lista) ? lista : []);
                    return;
                }
            } catch {}
            // Si no hay en SecureStore, intentar cargar de SQLite
            try {
                const db = await getDBConnection();
                const locales: Grabacion[] = await db.getAllAsync('SELECT * FROM grabaciones_pendientes WHERE sincronizado = 1 AND EsLocal = 1');
                setLista(Array.isArray(locales) ? locales : []);
            } catch {
                setLista([]);
            }
        }
    };

    const actualizarNumGrabaciones = async () => {
        const maxReintentos = 3;
        let intentoActual = 0;
        
        while (intentoActual < maxReintentos) {
            try {
                const db = await getDBConnection();
                
                // Timeout para la consulta SQLite (2 segundos)
                const timeoutPromise = new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('SQLite Timeout')), 2000)
                );

                const result = await Promise.race([
                    db.getFirstAsync<{ total: number }>(
                        'SELECT COUNT(*) as total FROM grabaciones_pendientes WHERE sincronizado = 0'
                    ),
                    timeoutPromise
                ]);
                
                setNumGrabacion(result?.total || 0);
                return; // Salir si fue exitoso
                
            } catch (error: any) {
                intentoActual++;
                console.warn(`⚠️ Error actualizando contador (intento ${intentoActual}/${maxReintentos}):`, error?.message);
                
                if (intentoActual >= maxReintentos) {
                    console.error('❌ No se pudo actualizar el contador de grabaciones');
                    setNumGrabacion(0); // Establecer en 0 por seguridad
                    return;
                }
                
                // Esperar antes de reintentar
                await new Promise(resolve => setTimeout(resolve, intentoActual * 100));
            }
        }
    };

    const enviarGrabacionesPendientes = async () => {
        if (!isOnline) {
            Alert.alert('Sin conexión', 'Necesitas Internet para enviar audios.');
            return;
        }

        setMostrarActivityIndicator(true);

        try {
            // Eliminar todos los registros pendientes antes de continuar
            try {
                const dbClean = await getDBConnection();
                await dbClean.runAsync('DELETE FROM grabaciones_pendientes WHERE sincronizado = 0');
                await actualizarNumGrabaciones();
                console.log('🧹 Registros pendientes eliminados.');
            } catch (cleanErr) {
                console.warn('No se pudo limpiar pendientes:', cleanErr);
            }

            const db = await getDBConnection();
            const grabacionesArray = await db.getAllAsync<any>(
                'SELECT * FROM grabaciones_pendientes WHERE sincronizado = 0'
            );

            if (grabacionesArray.length === 0) {
                setMostrarActivityIndicator(false);
                Alert.alert('Info', 'No hay audios pendientes.');
                return;
            }

            let grabacionesEnviadas = 0;

            for (const grabacion of grabacionesArray) {
                try {
                    const { id, user, audioPath, FechaInicio, FechaFin, Latitud, Longitud, Agencia, Identificacion } = grabacion;

                    const fileInfo = await getInfoAsync(audioPath);
                    if (!fileInfo.exists) {
                        console.warn(`⚠️ Archivo no existe: ${audioPath}. Eliminando registro de la base de datos.`);
                        await db.runAsync('DELETE FROM grabaciones_pendientes WHERE id = ?', [id]);
                        // Actualizar contador inmediatamente tras eliminar
                        await actualizarNumGrabaciones();
                        continue;
                    }

                    const clienteRows = await db.getAllAsync<any>(
                        `SELECT IdClienteCarga, NumeroOperacion, LineaCredito FROM clientes_locales WHERE Identificacion = ? AND sincronizado = 1`,
                        [Identificacion]
                    );

                    if (clienteRows.length === 0) continue;

                    const { IdClienteCarga, NumeroOperacion, LineaCredito } = clienteRows[0];
                    if (!IdClienteCarga) continue;

                    const audioBase64 = await readAsStringAsync(audioPath, {
                        encoding: 'base64'
                    });

                    let result;
                    if (environment.pais === 'GT') {
                        result = await RegistroGrabacionGT(
                            user, audioBase64, IdClienteCarga, Identificacion, FechaInicio, FechaFin,
                            Latitud, Longitud, Agencia, LineaCredito ?? '', NumeroOperacion ?? ''
                        );
                    } else {
                        result = await RegistroGrabacion(
                            user, audioBase64, IdClienteCarga, Identificacion, FechaInicio, FechaFin,
                            Latitud, Longitud, Agencia, LineaCredito ?? '', NumeroOperacion ?? ''
                        );
                    }

                    if (result && (result === true || result?.UrlGrabacion || result?.FechaFinGrabacion)) {
                        await db.runAsync('UPDATE grabaciones_pendientes SET sincronizado = 1 WHERE id = ?', [id]);
                        grabacionesEnviadas++;
                        console.log(`📤 Grabación ID ${id} enviada.`);
                    }
                } catch (err) {
                    console.warn('❌ Error:', err);
                }
            }

            await obtenerDatosAsync();
            await actualizarNumGrabaciones();
            setMostrarActivityIndicator(false);

            if (grabacionesEnviadas > 0) {
                showSuccessToast('Éxito', `${grabacionesEnviadas} audio(s) enviados.`);
            } else {
                Alert.alert('Info', 'No se pudo enviar ninguna grabación.');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setMostrarActivityIndicator(false);
            Alert.alert('Error', 'Problema al enviar grabaciones.');
        }
    };

    const abrirModal = (grabacion: Grabacion) => {
        setGrabacionSeleccionada(grabacion);
        setModalVisible(true);
    };

    return (
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
                <View style={styles.header}>
                    <Text style={styles.h2}>Historial de Grabaciones</Text>
                    <Pressable
                        onPress={enviarGrabacionesPendientes}
                        style={[styles.button, (!isOnline || numGrabacion === 0) && styles.buttonDisabled]}
                        disabled={!isOnline || numGrabacion === 0}
                    >
                        <Text style={styles.buttonText}>Enviar Audios</Text>
                        {numGrabacion > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{numGrabacion}</Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                <View style={[styles.connectionBanner, isOnline ? styles.online : styles.offline]}>
                    <Ionicons name={isOnline ? "wifi" : "wifi-outline"} size={18} color="white" />
                    <Text style={styles.connectionText}>{isOnline ? 'Conectado' : 'Sin conexión'}</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1a56db" />
                        <Text style={styles.loadingText}>Consultando grabaciones del servidor...</Text>
                        <Text style={styles.loadingSubtext}>Esto puede tardar unos segundos</Text>
                    </View>
                ) : (
                    <>
                        {!isOnline ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cloud-offline" size={80} color="#9ca3af" />
                                <Text style={styles.emptyText}>Debe tener conexión a Internet para ver el historial</Text>
                                <Text style={styles.noteText}>Nota: Revise si tiene grabaciones por enviar.</Text>
                            </View>
                        ) : lista.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="musical-notes-outline" size={80} color="#9ca3af" />
                                <Text style={styles.emptyText}>Aún no se registran audios</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={lista.slice().reverse()}
                                keyExtractor={(item) => item.IdGrabacion}
                                renderItem={({ item }) => <AudioItem item={item} onPress={() => abrirModal(item)} />}
                                contentContainerStyle={styles.listContent}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        colors={['#1a56db']}
                                        tintColor="#1a56db"
                                    />
                                }
                                ListFooterComponent={<View style={{ height: 60 }} />}
                            />
                        )}
                    </>
                )}

                {mostrarActivityIndicator && (
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#1a56db" />
                        <Text style={styles.overlayText}>Enviando audios...</Text>
                    </View>
                )}
            </SafeAreaView>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Detalles de Grabación</Text>
                        {grabacionSeleccionada && (
                            <ScrollView style={{ maxHeight: 400 }}>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>👤 Cliente:</Text>
                                    <Text style={styles.modalValue}>{grabacionSeleccionada.ClienteNombreCompleto || 'Sin nombre'}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>🆔 Identificación:</Text>
                                    <Text style={styles.modalValue}>{grabacionSeleccionada.Identificacion}</Text>
                                </View>
                                {environment.pais === 'GT' && (
                                    <>
                                        <View style={styles.modalRow}>
                                            <Text style={styles.modalLabel}>🏢 Agencia:</Text>
                                            <Text style={styles.modalValue}>{grabacionSeleccionada.Agencia || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.modalRow}>
                                            <Text style={styles.modalLabel}>💳 Línea Crédito:</Text>
                                            <Text style={styles.modalValue}>{grabacionSeleccionada.LineaCredito || 'N/A'}</Text>
                                        </View>
                                    </>
                                )}
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>🔢 Nº Operación:</Text>
                                    <Text style={styles.modalValue}>{grabacionSeleccionada.NumeroOperacion || 'N/A'}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>📅 Fecha:</Text>
                                    <Text style={styles.modalValue}>{formatDateWithSeconds(grabacionSeleccionada.FechaFinGrabacion)}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>⏱ Duración:</Text>
                                    <Text style={styles.modalValue}>{formatDuration(grabacionSeleccionada.Duracion)}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>📍 Estado:</Text>
                                    <Text style={[styles.modalValue, grabacionSeleccionada.EsLocal ? styles.statusPending : styles.statusSent]}>
                                        {grabacionSeleccionada.EsLocal ? 'PENDIENTE' : 'ENVIADO'}
                                    </Text>
                                </View>
                            </ScrollView>
                        )}
                        <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalButtonText}>Cerrar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default HistorialScreen;

const styles = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    h2: { fontSize: 14, fontWeight: "bold", color: "#1f2937" },
    button: { backgroundColor: "#1a56db", height: 38, borderRadius: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 15, elevation: 3 },
    buttonDisabled: { backgroundColor: '#9ca3af', elevation: 0 },
    buttonText: { color: "white", fontSize: 14, fontWeight: "600", marginRight: 5 },
    badge: { backgroundColor: "#ef4444", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, marginLeft: 3 },
    badgeText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
    connectionBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
    online: { backgroundColor: '#22c55e' },
    offline: { backgroundColor: '#ef4444' },
    connectionText: { color: 'white', fontSize: 14, fontWeight: '600' },
    listContent: { padding: 15, gap: 12 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 15, flexDirection: 'column', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    iconStatus: { marginRight: 8 },
    cardFileName: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', flexShrink: 1 },
    detailsAndActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    detailsColumn: { flex: 1, paddingLeft: 32 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    detailLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500', width: 75 },
    detailValue: { fontSize: 13, fontWeight: '600', color: '#1f2937', flex: 1, textAlign: 'left' },
    statusPending: { color: '#ef4444', fontWeight: 'bold' },
    statusSent: { color: '#22c55e', fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#1f2937', fontWeight: '600' },
    loadingSubtext: { marginTop: 5, fontSize: 14, color: '#6b7280' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#6b7280' },
    noteText: { textAlign: 'center', marginTop: 40, fontSize: 14, color: '#9ca3af', paddingHorizontal: 20 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    overlayText: { color: 'white', marginTop: 15, fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 10, padding: 20, elevation: 5 },
    modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 15, color: '#1f2937' },
    modalRow: { marginBottom: 12 },
    modalLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
    modalValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
    modalButton: { marginTop: 20, backgroundColor: '#1a56db', padding: 12, borderRadius: 6, alignItems: 'center' },
    modalButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
