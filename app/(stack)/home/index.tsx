import { environment } from "@/components/core/environment";
import { DetenerGrabacion, IniciarGrabacion, RegistroGrabacion, RegistroGrabacionGT } from "@/components/core/miCore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { getDBConnection, guardarClienteLocalEnSQLite, guardarGrabacionOfflineEnSQLite, tryFlushSQLiteBacklog } from "@/utils/database/database";
import { nowLocalISO } from "@/utils/date";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import * as FileSystem from 'expo-file-system';
import { copyAsync, getInfoAsync, makeDirectoryAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
// Compat helpers for expo-file-system variants
const SAF = (FileSystem as any).StorageAccessFramework as
    | undefined
    | {
        requestDirectoryPermissionsAsync?: () => Promise<{ granted: boolean; directoryUri?: string }>;
        createFileAsync?: (dirUri: string, fileName: string, mimeType: string) => Promise<string>;
    };


import { SafeAreaView } from "react-native-safe-area-context";

interface UserData {
    UserName?: string;
    IdUsuario?: number;
}

interface ClientData {
    Nombre?: string;
    Identificacion?: string;
    CodigoCedente?: string;
    NumeroOperacion?: string;
    IdClienteCarga?: number;
    Nombres?: string;
    Apellidos?: string;
    Agencia?: string;
    LineaCredito?: string;
}

const HomeScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const hasLoadedParams = useRef(false);
    const { isOnline } = useNetworkStatus(); // 🌐 Hook para verificar conexión
    const [userName, setUserName] = useState<string>('Usuario');
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSendingAudio, setIsSendingAudio] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | undefined>();
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [audioFilePath, setAudioFilePath] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number>(0);
    const [longitude, setLongitude] = useState<number>(0);
    const [idGrabacionReal, setIdGrabacionReal] = useState<number | null>(null);
    const [startDateTime, setStartDateTime] = useState<string>('');

    // Reset de todos los estados de grabación

    useEffect(() => {
        loadUserData();
        loadClientData();
        requestMicrophonePermission();
        if (!params.clientData) {
            hasLoadedParams.current = false;
        }
    }, []);

    useEffect(() => {
        if (hasLoadedParams.current) return;
        if (params.clientData && params.fromAddClient === 'true') {
            hasLoadedParams.current = true;
            try {
                const newClientData = JSON.parse(params.clientData as string);
                console.log('📥 Cliente recibido desde AgregarCliente:', newClientData);
                setClientData({
                    Nombre: `${newClientData.Nombres || ''} ${newClientData.Apellidos || ''}`.trim(),
                    Identificacion: newClientData.Identificacion || '',
                    CodigoCedente: newClientData.CodigoCedente || 'MANUAL',
                    NumeroOperacion: newClientData.NumeroOperacion || '',
                    IdClienteCarga: newClientData.IdClienteCarga,
                    Nombres: newClientData.Nombres || '',
                    Apellidos: newClientData.Apellidos || '',
                    Agencia: newClientData.Agencia || '',
                    LineaCredito: newClientData.LineaCredito || ''
                });

                setTimeout(() => {
                    if (params.savedLocally === 'true') {
                        showSuccessToast(
                            'Cliente Cargado',
                            'Mostrando cliente guardado localmente'
                        );
                    } else {
                        showSuccessToast(
                            'Cliente Cargado',
                            'Cliente guardado en servidor y listo para grabar'
                        );
                    }
                }, 300);
            } catch (error) {
                console.error('Error al parsear clientData:', error);
                hasLoadedParams.current = false;
            }
            return;
        }

        if (params.clientData && params.fromClientList === 'true') {
            hasLoadedParams.current = true;
            try {
                const selectedClient = JSON.parse(params.clientData as string);
                console.log('📥 Cliente seleccionado desde ListaClientes:', selectedClient);

                // Formatear los datos para mostrar - ✅ Guardar TODOS los campos
                setClientData({
                    Nombre: `${selectedClient.Nombres || ''} ${selectedClient.Apellidos || ''}`.trim(),
                    Identificacion: selectedClient.Identificacion || '',
                    CodigoCedente: selectedClient.CodigoCedente || 'MANUAL',
                    NumeroOperacion: selectedClient.NumeroOperacion || '',
                    IdClienteCarga: selectedClient.IdClienteCarga, // ✅ Crítico para modo online
                    Nombres: selectedClient.Nombres || '',
                    Apellidos: selectedClient.Apellidos || '',
                    Agencia: selectedClient.Agencia || '',
                    LineaCredito: selectedClient.LineaCredito || ''
                });

                setTimeout(() => {
                    showSuccessToast(
                        'Cliente Seleccionado',
                        'Listo para iniciar grabación'
                    );
                }, 300);
            } catch (error) {
                console.error('Error al parsear clientData desde lista:', error);
                hasLoadedParams.current = false;
            }
        }
    }, [params.clientData, params.fromAddClient, params.fromClientList, params.savedLocally]);

    // Cuando vuelve la conexión, intentar volcar backups a SQLite
    useEffect(() => {
        const flush = async () => {
            try {
                if (isOnline) {
                    const res = await tryFlushSQLiteBacklog();
                    if (res) {
                        console.log('🗂️ Backlog volcado a SQLite:', res);
                    }
                }
            } catch (e) {
                console.log('No se pudo volcar backlog ahora:', e);
            }
        };
        flush();
    }, [isOnline]);

    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);



    const requestMicrophonePermission = async (): Promise<boolean> => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permiso de micrófono denegado');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error al solicitar permisos de audio:', error);
            return false;
        }
    };

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

    const loadClientData = async () => {
        setClientData({
            Nombre: '',
            Identificacion: '',
            CodigoCedente: '',
            NumeroOperacion: ''
        });
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getCountryFlag = () => {
        const flags: { [key: string]: any } = {
            'PE': require('../../../assets/images/peru.png'),
            'EC': require('../../../assets/images/ecuador.png'),
            'GT': require('../../../assets/images/guatemala.png'),
        };
        return flags[environment.pais] || flags['EC'];
    };

    // Generar nombre único para archivo de audio
    const generateUniqueFileName = (prefix: string = 'audio'): string => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${prefix}_${timestamp}_${random}.m4a`;
    };

    const generateAudioPath = async (): Promise<string> => {
        // Solo utilidad opcional: no se usa para grabar (expo-av maneja la ruta temporal internamente)
        const baseDirectory = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) as string | undefined;
        if (!baseDirectory) {
            // En caso extremo, devolvemos un nombre simple; se usará como etiqueta, no para escribir.
            return generateUniqueFileName('audio');
        }
        const appFolder = `${baseDirectory}BigBrother/`;
        const audiosDirectory = `${appFolder}Audios/`;
        try {
            const dirInfo = await getInfoAsync(audiosDirectory);
            if (!dirInfo.exists) {
                await makeDirectoryAsync(audiosDirectory, { intermediates: true });
            }
            const fileName = generateUniqueFileName('audio');
            return `${audiosDirectory}${fileName}`;
        } catch {
            // Si no se puede crear, devolvemos un path en la base directamente
            const fileName = generateUniqueFileName('audio');
            return `${baseDirectory}${fileName}`;
        }
    };

    const handlePlayPause = () => {
        if (!recording) {
            startRecording();
        } else {
            setIsRecording(!isRecording);
        }
    };

    const getCurrentPosition = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Permiso de ubicación denegado');
            return null;
        }

        const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return position;
    };

    const startRecording = async () => {
        setRecordedUri(null);

        try {
            // 1. ✅ Verificar permisos de micrófono
            const hayPermisos = await requestMicrophonePermission();
            if (!hayPermisos) {
                console.log('🔐 Los permisos de micrófono no se concedieron.');
                Alert.alert('Permisos requeridos', 'Necesitas conceder permisos de micrófono para grabar.');
                return;
            }

            // 2. ✅ Validar que hay cliente seleccionado (ANTES de grabar)
            if (!clientData || !clientData.Identificacion) {
                console.warn('⚠️ Cliente no seleccionado o sin Identificación.');
                Alert.alert('Error', 'Debes seleccionar un cliente antes de grabar.');
                return;
            }

            // 3. ✅ No forzamos creación de carpetas antes de grabar; expo-av crea un archivo temporal válido
            setAudioFilePath(null);

            // 4. ✅ Verificar que el archivo se pueda crear
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(newRecording);
            setIsRecording(true);
            setRecordingTime(0);

            console.log('✅ Grabación iniciada');

            // 5. ✅ Obtener geolocalización con manejo de errores
            let latitude = 0;
            let longitude = 0;

            try {
                const position = await getCurrentPosition();
                if (position) {
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                    setLatitude(latitude);
                    setLongitude(longitude);
                    console.log('📍 Ubicación obtenida:', { latitude, longitude });
                }
            } catch (geoError) {
                console.warn('⚠️ No se pudo obtener la ubicación:', geoError);
                Alert.alert('Advertencia', 'No fue posible obtener la ubicación. Se continuará sin ubicación.');
            }

            // 6. ✅ Obtener datos de usuario
            const sesionUsuario = await SecureStore.getItem('SesionUsuario');
            const datosUsuario = sesionUsuario ? JSON.parse(sesionUsuario) : null;
            // Usar hora local sin zona (evita ver -05:00 al persistir)
            const FechaInicioGrabacion = nowLocalISO();
            setStartDateTime(FechaInicioGrabacion);

            const Identificacion = clientData.Identificacion;
            const IdCliente = clientData.IdClienteCarga;

            console.log('🔍 Estado de conexión:', isOnline);
            console.log('🔍 IdCliente:', IdCliente);

            // 7. 🔌 Determinar modo OFFLINE o cliente local
            if (!isOnline || !IdCliente) {
                console.log(`🌐 Modo offline detectado (${environment.pais}). isOnline: ${isOnline}, IdCliente: ${IdCliente}`);

                try {
                    const db = await getDBConnection();
                    const result = await db.getFirstAsync<{ Identificacion: string }>(
                        'SELECT Identificacion FROM clientes_locales WHERE Identificacion = ? AND sincronizado = 0',
                        [Identificacion]
                    );

                    if (!result) {
                        // Cliente no existe localmente, guardarlo
                        const clienteOffline = {
                            ...clientData,
                            localId: `LOCAL_${Date.now()}`,
                            UsuarioAsignacion: datosUsuario?.UserName ?? '',
                            FechaCarga: new Date().toISOString(),
                            TieneGrabacion: true,
                            CodigoCedente: clientData.CodigoCedente || 'MANUAL',
                            Fuente: 'BIGBROTHER',
                            pais: environment.pais,
                        };

                        await guardarClienteLocalEnSQLite(clienteOffline);
                        console.log(`📌 Cliente guardado localmente [${environment.pais}]:`, Identificacion);
                    } else {
                        console.log(`✅ Cliente ya estaba guardado localmente [${environment.pais}]:`, Identificacion);
                    }

                    showSuccessToast('Modo Offline', 'Grabación iniciada. Se enviará cuando haya conexión.');
                } catch (dbError) {
                    console.error('❌ Error al guardar cliente local:', dbError);
                    Alert.alert('Error', 'No se pudo guardar el cliente localmente.');
                }

                console.log(`🌐 Modo offline (${environment.pais}): no se intenta iniciar grabación en backend.`);
                return;
            }

            // 8. 🌐 Modo ONLINE - Iniciar grabación en backend
            try {
                console.log('🌐 Iniciando grabación en backend...');
                const grabacionResult = await IniciarGrabacion(
                    IdCliente ?? 0,
                    latitude,
                    longitude,
                    FechaInicioGrabacion
                );

                if (grabacionResult?.IdGrabacion) {
                    await SecureStore.setItem('IdGrabacion', grabacionResult.IdGrabacion.toString());
                    setIdGrabacionReal(grabacionResult.IdGrabacion);
                    console.log('✅ ID Grabación registrada en backend:', grabacionResult.IdGrabacion);
                    showSuccessToast('Grabación Online', 'Grabación iniciada correctamente en el servidor.');
                } else {
                    console.log('📴 Sin IdGrabacion (respuesta vacía del backend).');
                    showSuccessToast('Grabación Iniciada', 'Grabación local iniciada.');
                }
            } catch (serverErr: any) {
                console.warn('🌐 No se pudo contactar al backend:', String(serverErr));
                console.log('🌐 Grabación continuará en modo local.');
                Alert.alert(
                    'Modo Local',
                    'No se pudo conectar al servidor. La grabación se guardará localmente y se sincronizará más tarde.'
                );
            }

        } catch (error: any) {
            console.error('❌ Error general en startRecording:', String(error));
            Alert.alert('Error', `No se pudo iniciar la grabación: ${String(error) || 'Error desconocido'}`);
            setRecording(undefined);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        setIsSendingAudio(true);

        try {
            // 1. ✅ Detener la grabación
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            if (!uri) {
                throw new Error('No se obtuvo URI de grabación');
            }

            // 2. ✅ Calcular duración y fechas
            const duracionEnSegundos = recordingTime;
            const FechaFinGrabacion = nowLocalISO();
            const FechaInicioGrabacion = startDateTime || nowLocalISO();

            console.log('🕒 Tiempo grabado:', formatTime(recordingTime));
            console.log('📅 Inicio:', FechaInicioGrabacion);
            console.log('📅 Fin:', FechaFinGrabacion);

            // 3. ✅ Guardar archivo en almacenamiento
            const savedPath = await saveAudioToStorage(uri);
            if (!savedPath) {
                throw new Error('No se pudo guardar el archivo');
            }

            setRecordedUri(savedPath);
            console.log('💾 Audio guardado en:', savedPath);

            // 4. ✅ Obtener datos de usuario
            const sesionUsuario = await SecureStore.getItem('SesionUsuario');
            const datosUsuario = sesionUsuario ? JSON.parse(sesionUsuario) : null;
            const user = datosUsuario?.UserName;

            if (!user) {
                showErrorToast('Error', 'No se encontró usuario en sesión');
                resetRecordingState();
                return;
            }

            // 5. ✅ Validar cliente
            console.log('clientData en stopRecording:', clientData);
            if (!clientData || !clientData.Identificacion) {
                showErrorToast('Error', 'Debes seleccionar un cliente antes de grabar o detener la grabación.');
                resetRecordingState();
                return;
            }

            const esClienteLocal = !clientData.IdClienteCarga || clientData.IdClienteCarga === 0;
            const Identificacion = clientData.Identificacion;
            const IdCliente = clientData.IdClienteCarga;
            const Latitud = latitude.toString();
            const Longitud = longitude.toString();
            const Agencia = clientData.Agencia || '';
            const LineaCredito = clientData.LineaCredito || '';
            const NumeroOperacion = clientData.NumeroOperacion || Math.random().toString(36).substring(2, 10);

            // 6. 🔌 MODO OFFLINE o Cliente Local
            if (esClienteLocal || !isOnline) {
                console.log(`🌐 Guardando grabación offline (${environment.pais})`);

                const grabacionPendiente = {
                    identificacion: Identificacion,
                    user,
                    audioPath: savedPath,
                    FechaInicio: FechaInicioGrabacion,
                    FechaFin: FechaFinGrabacion, // <-- Fecha de fin real
                    Latitud,
                    Longitud,
                    Agencia,
                    LineaCredito,
                    NumeroOperacion,
                    Duracion: duracionEnSegundos,
                    TiempoDuracion: formatTime(recordingTime),
                };

                // Guardar también la fecha de fin como 'FechaCreacion' si tu modelo lo requiere
                await guardarGrabacionOfflineEnSQLite({ ...grabacionPendiente, FechaCreacion: FechaFinGrabacion });
                console.log(`🎙️ Grabación guardada localmente [${environment.pais}]:`, Identificacion, 'FechaCreacion:', FechaFinGrabacion);

                showSuccessToast(
                    'Grabación Guardada',
                    `Duración: ${formatTime(recordingTime)}\nSe enviará cuando haya conexión.`
                );

                resetRecordingState();
                return;
            }

            // 7. 🌐 MODO ONLINE - Intentar enviar al servidor
            try {
                console.log('🌐 Enviando grabación al servidor...');

                // Leer archivo como base64 usando la API legacy
                const audioBase64 = await readAsStringAsync(savedPath, {
                    encoding: 'base64'
                });

                let resultadoRegistro;
                let validacion = false;

                // Siempre intentar DetenerGrabacion primero
                if (idGrabacionReal) {
                    console.log('🔄 Intentando DetenerGrabacion...');
                    try {
                        resultadoRegistro = await DetenerGrabacion(
                            savedPath,
                            FechaFinGrabacion,
                            Latitud,
                            Longitud
                        );
                        validacion = resultadoRegistro?.FechaFinGrabacion || resultadoRegistro?.UrlGrabacion;
                    } catch (detenerError) {
                        console.error('❌ Error en DetenerGrabacion:', String(detenerError));
                        validacion = false;
                    }
                }

                // Fallback: RegistroGrabacion/RegistroGrabacionGT si DetenerGrabacion falla
                if (!validacion) {
                    console.log(`🔁 Fallback → RegistroGrabacion${environment.pais}`);
                    const idClienteStr = IdCliente !== undefined && IdCliente !== null ? String(IdCliente) : '';
                    if (environment.pais === 'GT') {
                        resultadoRegistro = await RegistroGrabacionGT(
                            user,
                            audioBase64,
                            idClienteStr,
                            Identificacion,
                            FechaInicioGrabacion,
                            FechaFinGrabacion,
                            Latitud,
                            Longitud,
                            Agencia,
                            LineaCredito,
                            NumeroOperacion
                        );
                    } else {
                        resultadoRegistro = await RegistroGrabacion(
                            user,
                            audioBase64,
                            idClienteStr,
                            Identificacion,
                            FechaInicioGrabacion,
                            FechaFinGrabacion,
                            Latitud,
                            Longitud,
                            Agencia,
                            LineaCredito,
                            NumeroOperacion
                        );
                    }
                    validacion = resultadoRegistro?.UrlGrabacion || resultadoRegistro?.FechaFinGrabacion;
                }

                if (validacion) {
                    console.log('✅ Grabación enviada correctamente al backend');
                    showSuccessToast(
                        'Éxito',
                        `Grabación enviada correctamente.\nDuración: ${formatTime(recordingTime)}`
                    );
                    resetRecordingState();
                    loadClientData();
                    return;

                } else {
                    throw new Error('No se pudo enviar la grabación al backend');
                }
            } catch (onlineError) {
                console.error('❌ Error durante envío ONLINE:', String(onlineError));

                // Guardar localmente como pendiente
                Alert.alert(
                    'Sin conexión',
                    'No se pudo enviar el audio al servidor. ¿Deseas guardarlo localmente para enviarlo después?',
                    [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPress: () => {
                                resetRecordingState();
                                showErrorToast('Cancelado', 'Grabación descartada');
                            }
                        },
                        {
                            text: 'Guardar Localmente',
                            onPress: async () => {
                                const grabacionPendiente = {
                                    identificacion: Identificacion,
                                    user,
                                    audioPath: savedPath,
                                    FechaInicio: FechaInicioGrabacion,
                                    FechaFin: FechaFinGrabacion,
                                    Latitud,
                                    Longitud,
                                    Agencia,
                                    LineaCredito,
                                    NumeroOperacion,
                                    Duracion: duracionEnSegundos,
                                    TiempoDuracion: formatTime(recordingTime),
                                };

                                await guardarGrabacionOfflineEnSQLite({ ...grabacionPendiente, FechaCreacion: FechaFinGrabacion });
                                console.log(`🎙️ Grabación guardada como pendiente [${environment.pais}]`);

                                showSuccessToast(
                                    'Guardado Localmente',
                                    'El audio se enviará cuando haya conexión.'
                                );
                                resetRecordingState();
                            }
                        }
                    ]
                );
            }

        } catch (error) {
            console.error('❌ Error general en stopRecording:', String(error));
            showErrorToast('Error', `No se pudo procesar la grabación: ${String(error) || 'Error desconocido'}`);
            resetRecordingState();
        } finally {
            setIsSendingAudio(false);
        }
    };

    const resetRecordingState = () => {
        setRecording(undefined);
        setRecordingTime(0);
        setRecordedUri(null);
        setAudioFilePath(null);
        setIdGrabacionReal(null);
        setStartDateTime('');
        setLatitude(0);
        setLongitude(0);
    };

    const supportsSAF = () => {
        return Platform.OS === 'android' && !!SAF?.requestDirectoryPermissionsAsync;
    };
    const getOrRequestAndroidDirUri = async (): Promise<string | null> => {
        try {
            const stored = await SecureStore.getItem('AudioDirUri');
            if (stored) return stored;
            if (!SAF?.requestDirectoryPermissionsAsync) return null;
            const perm = await SAF.requestDirectoryPermissionsAsync();
            if (perm?.granted && perm?.directoryUri) {
                await SecureStore.setItem('AudioDirUri', perm.directoryUri);
                return perm.directoryUri;
            }
            return null;
        } catch (e) {
            console.log('SAF error/indisponible:', e);
            return null;
        }
    };

    const handleShareAudio = async () => {
        try {
            if (!recordedUri) return;
            const available = await Sharing.isAvailableAsync();
            if (!available) {
                showErrorToast('Compartir no disponible', 'Instala una app de Archivos o usa una compilación del sistema.');
                return;
            }
            await Sharing.shareAsync(recordedUri, {
                mimeType: 'audio/m4a',
                UTI: 'com.apple.m4a-audio',
            });
        } catch (e: any) {
            console.log('Error compartiendo audio:', String(e));
            showErrorToast('Error', 'No se pudo compartir el audio.');
        }
    };

    const handleChangeFolder = async () => {
        try {
            if (!SAF?.requestDirectoryPermissionsAsync) {
                showErrorToast('No compatible', 'Esta función requiere Android con SAF.');
                return;
            }
            const perm = await SAF.requestDirectoryPermissionsAsync();
            if (perm?.granted && perm?.directoryUri) {
                await SecureStore.setItem('AudioDirUri', perm.directoryUri);
                showSuccessToast('Carpeta actualizada', 'Usaremos esta carpeta para guardar audios.');
            } else {
                showErrorToast('Acceso cancelado', 'No se seleccionó ninguna carpeta.');
            }
        } catch (e: any) {
            console.log('Error cambiando carpeta:', String(e));
            showErrorToast('Error', 'No se pudo actualizar la carpeta.');
        }
    };

    const saveAudioToStorage = async (uri: string): Promise<string | null> => {
        try {
            const timestamp = new Date().getTime();
            const fileName = `BigBrother_Audio_${timestamp}.m4a`;

            if (Platform.OS === 'android') {
                const dirUri = await getOrRequestAndroidDirUri();
                if (dirUri) {
                    try {
                        const destFileUri = await SAF!.createFileAsync!(dirUri, fileName, 'audio/m4a');
                        const base64Data = await readAsStringAsync(uri, { encoding: 'base64' });
                        await writeAsStringAsync(destFileUri, base64Data, { encoding: 'base64' });
                        console.log('Audio guardado (SAF):', destFileUri);
                        return destFileUri;
                    } catch (safError) {
                        console.warn('SAF no disponible, usando fallback:', safError);
                    }
                }
            }

            // Fallback: sandbox de la app (Documentos/Caché de la app)
            const baseDirectory = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) as string | undefined;
            if (!baseDirectory) {
                console.warn('No hay baseDirectory disponible; usando URI original');
                return uri; // Último recurso: dejar el archivo donde está
            }
            try {
                const appFolder = `${baseDirectory}BigBrother/`;
                const audiosDirectory = `${appFolder}Audios/`;
                const dirInfo = await getInfoAsync(audiosDirectory);
                if (!dirInfo.exists) {
                    await makeDirectoryAsync(audiosDirectory, { intermediates: true });
                }
                const newPath = `${audiosDirectory}${fileName}`;
                await copyAsync({ from: uri, to: newPath });
                console.log('Audio guardado (privado app):', newPath);
                return newPath;
            } catch (dirErr) {
                console.warn("No se pudo crear/copiar a BigBrother/Audios. Intentando raíz de baseDirectory:", dirErr);
                const newPath = `${baseDirectory}${fileName}`;
                try {
                    await copyAsync({ from: uri, to: newPath });
                    console.log('Audio guardado (baseDirectory):', newPath);
                    return newPath;
                } catch (copyErr) {
                    console.warn('No se pudo copiar a baseDirectory. Usando URI original:', copyErr);
                    return uri;
                }
            }
        } catch (error) {
            console.error('Error al guardar audio (API estable):', error);
            showErrorToast('Error', 'No se pudo guardar el archivo en el almacenamiento');
            return null;
        }
    }

    const handleSendAudio = async (audioPath: string) => {
        setIsSendingAudio(true);
        try {
            console.log('Enviando audio desde:', audioPath);

            // Aquí implementarías el envío a tu servidor
            // ...

            // Simulación de envío
            await new Promise(resolve => setTimeout(resolve, 2000));

            showSuccessToast('Enviado', 'Audio enviado correctamente al servidor');
        } catch (error) {
            console.error('Error al enviar audio:', error);
            showErrorToast('Error', 'No se pudo enviar el audio');
        } finally {
            setIsSendingAudio(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.welcomeText}>Bienvenido a BigBrother</Text>
                        <Text style={styles.userNameText}>{userName}</Text>
                    </View>

                    <View style={styles.headerIcons}>
                        <Image source={getCountryFlag()} style={styles.countryFlag} />
                        <Ionicons
                            name={isOnline ? "wifi" : "wifi-outline"}
                            size={28}
                            color={isOnline ? "#22c55e" : "#ef4444"}
                            style={styles.wifiIcon}
                        />
                    </View>
                </View>



                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {clientData && (
                        <View style={styles.clientCard}>
                            <View style={styles.clientInfoRow}>
                                <Text style={styles.clientLabel}>Nombre: </Text>
                                <Text style={styles.clientValue}>{clientData.Nombre}</Text>
                            </View>
                            <View style={styles.clientInfoRow}>
                                <Text style={styles.clientLabel}>Identificación: </Text>
                                <Text style={styles.clientValue}>{clientData.Identificacion}</Text>
                            </View>
                            <View style={styles.clientInfoRow}>
                                <Text style={styles.clientLabel}>Codigo Cedente: </Text>
                                <Text style={styles.clientValue}>{clientData.CodigoCedente}</Text>
                            </View>
                            <View style={styles.clientInfoRow}>
                                <Text style={styles.clientLabel}>Número de Operación: </Text>
                                <Text style={styles.clientValue}>{clientData.NumeroOperacion}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionButton}
                            onPress={() => router.push('/listaclientes')}
                        >
                            <Ionicons name="list" size={25} color="#1a56db" />
                            <Text style={styles.actionButtonText}>Lista</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}
                            onPress={() => router.navigate('/agregarcliente')}
                        >
                            <Ionicons name="person-add" size={25} color="#1a56db" />
                            <Text style={styles.actionButtonText}>Añadir</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.audioSection}>
                        <Text style={styles.audioStatusText}>
                            {isSendingAudio
                                ? 'Enviando audio...'
                                : isRecording
                                    ? 'Grabando...'
                                    : recordedUri
                                        ? 'Grabación lista'
                                        : 'Listo para grabar'}
                        </Text>

                        <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>

                        <View style={styles.audioControls}>

                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={handlePlayPause}
                                disabled={isSendingAudio}
                            >
                                <Ionicons
                                    name={isRecording ? "pause" : "mic"}
                                    size={60}
                                    color="white"
                                />
                            </TouchableOpacity>

                            {recording && (
                                <TouchableOpacity
                                    style={styles.stopButton}
                                    onPress={stopRecording}
                                    disabled={isSendingAudio}
                                >
                                    <MaterialIcons
                                        name="stop"
                                        size={40}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            )}

                        </View>

                        {recordedUri && (
                            <>
                                <Text style={styles.recordedText}>Audio Guardado: {recordedUri.substring(0, 40)}...</Text>
                                <TouchableOpacity onPress={handleShareAudio} style={{ marginTop: 12 }}>
                                    <Text style={{ color: '#10b981', fontWeight: '600' }}>Compartir / Exportar audio</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {supportsSAF() && (
                            <TouchableOpacity onPress={handleChangeFolder} style={{ marginTop: 16 }}>
                                <Text style={{ color: '#1a56db', fontWeight: '600' }}>Cambiar carpeta de guardado</Text>
                            </TouchableOpacity>
                        )}

                    </View>

                    <Text style={styles.versionText}>Version: {environment.version}</Text>
                </ScrollView>


            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#1a56db',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flex: 1,
    },
    welcomeText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userNameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 5,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    countryFlag: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    wifiIcon: {
        marginLeft: 5,
    },
    connectionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    onlineBanner: {
        backgroundColor: '#22c55e',
    },
    offlineBanner: {
        backgroundColor: '#ef4444',
    },
    connectionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    clientCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    clientInfoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    clientLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    clientValue: {
        fontSize: 16,
        color: '#1f2937',
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    actionButton: {
        alignItems: 'center',
        padding: 15,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#1a56db',
        marginTop: 8,
        fontWeight: '600',
    },
    divider: {
        height: 2,
        backgroundColor: '#e5e7eb',
        marginVertical: 20,
    },
    audioSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    audioStatusText: {
        fontSize: 18,
        color: '#6b7280',
        marginBottom: 30,
    },
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 40,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a56db', // Azul
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    versionText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 16,
        marginTop: 40,
        marginBottom: 20,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: 20,
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
    },
    navText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    navTextActive: {
        color: '#1a56db',
        fontWeight: '600',
    },
    audioControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30, // Espacio entre botones
    },
    stopButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#dc3545', // Rojo para Stop
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    recordedText: {
        marginTop: 20,
        fontSize: 14,
        color: '#38bdf8',
        textAlign: 'center',
    },
});

export default HomeScreen;