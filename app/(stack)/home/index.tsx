import { environment } from "@/components/core/environment";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from 'expo-file-system';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    Directory,
    Paths
} from 'expo-file-system';
import {
    copyAsync,
    getInfoAsync
} from 'expo-file-system/legacy';
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
}

const HomeScreen = () => {
    const router = useRouter();
    const [userName, setUserName] = useState<string>('Usuario');
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSendingAudio, setIsSendingAudio] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | undefined>();
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        loadUserData();
        loadClientData();
        requestMicrophonePermission();
    }, []);

    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const requestMicrophonePermission = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permiso de micrófono denegado');
            }
        } catch (error) {
            console.error('Error al solicitar permisos de audio:', error);
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
            Nombre: 'MONSERRATE ELIZABETH VELEZ CEDEÑO',
            Identificacion: '1313939744',
            CodigoCedente: 'SOLIDARIO',
            NumeroOperacion: '849940'
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

    const handlePlayPause = () => {
        if (!recording) {
            startRecording();
        } else {
            setIsRecording(!isRecording);
        }
    };

    const startRecording = async () => {
        setRecordedUri(null);

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

            setRecording(newRecording);
            setIsRecording(true);
            setRecordingTime(0);

        } catch (error) {
            console.error('Failed to start recording', error);
            setRecording(undefined);
            setIsRecording(false);
        }
    }

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);
        setIsSendingAudio(true);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            setRecordedUri(uri);
            console.log('Recording stopped and stored at', uri);

            if (uri) {
                const savedPath = await saveAudioToStorage(uri);
                if (savedPath) {
                    setRecordedUri(savedPath);
                    showSuccessToast(
                        'Audio Guardado',
                        `Duración: ${formatTime(recordingTime)}\nGuardado en: ${savedPath}`
                    );

                    // Mostrar opciones
                    Alert.alert(
                        'Audio Guardado',
                        `Duración: ${formatTime(recordingTime)}\n\nArchivo guardado en:\n${savedPath}`,
                        [
                            {
                                text: 'OK',
                                style: 'default'
                            },
                            {
                                text: 'Enviar',
                                onPress: () => handleSendAudio(savedPath)
                            }
                        ]
                    );
                }
            }

        } catch (error) {
            console.error('Failed to stop recording', error);
            showErrorToast('Error', 'No se pudo guardar la grabación');
        } finally {
            setRecording(undefined);
            setRecordingTime(0);
            setIsSendingAudio(false);
        }
    }

    const supportsSAF = () => {
        const SAF = (FileSystem as any).StorageAccessFramework;
        return Platform.OS === 'android' && !!SAF?.requestDirectoryPermissionsAsync;
    };
    const getOrRequestAndroidDirUri = async (): Promise<string | null> => {
        try {
            const stored = await SecureStore.getItem('AudioDirUri');
            if (stored) return stored;
            const SAF = (FileSystem as any).StorageAccessFramework;
            if (!SAF?.requestDirectoryPermissionsAsync) return null;
            const perm = await SAF.requestDirectoryPermissionsAsync();
            if (perm?.granted && perm?.directoryUri) {
                await SAF.persistPermissionsAsync(perm.directoryUri);
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
            console.log('Error compartiendo audio:', e?.message || e);
            showErrorToast('Error', 'No se pudo compartir el audio.');
        }
    };

    const handleChangeFolder = async () => {
        try {
            const SAF = (FileSystem as any).StorageAccessFramework;
            if (!SAF?.requestDirectoryPermissionsAsync) {
                showErrorToast('No compatible', 'Esta función requiere Android con SAF.');
                return;
            }
            const perm = await SAF.requestDirectoryPermissionsAsync();
            if (perm?.granted && perm?.directoryUri) {
                await SAF.persistPermissionsAsync(perm.directoryUri);
                await SecureStore.setItem('AudioDirUri', perm.directoryUri);
                showSuccessToast('Carpeta actualizada', 'Usaremos esta carpeta para guardar audios.');
            } else {
                showErrorToast('Acceso cancelado', 'No se seleccionó ninguna carpeta.');
            }
        } catch (e: any) {
            console.log('Error cambiando carpeta:', e?.message || e);
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
                    const SAF = (FileSystem as any).StorageAccessFramework;
                    const destFileUri = await SAF.createFileAsync(dirUri, fileName, 'audio/m4a');
                    const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: (FileSystem as any).EncodingType.Base64 });
                    await FileSystem.writeAsStringAsync(destFileUri, base64Data, { encoding: (FileSystem as any).EncodingType.Base64 });
                    console.log('Audio guardado (SAF):', destFileUri);
                    return destFileUri; // content://...
                }
            }

            // Fallback: sandbox de la app (Documentos de la app) usando la nueva API
            const baseDirectory = Paths.document;
            const appFolder = new Directory(baseDirectory, "BigBrother");
            const audiosDirectory = new Directory(appFolder, "Audios");
            if (!(await getInfoAsync(audiosDirectory.uri)).exists) {
                await audiosDirectory.create({ intermediates: true });
            }
            const newPath = `${audiosDirectory.uri}${fileName}`;
            await copyAsync({ from: uri, to: newPath });
            console.log('Audio guardado (privado app):', newPath);
            return newPath;
        } catch (error) {
            console.error('Error al guardar audio (API híbrida):', error);
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
                        <Ionicons name="wifi" size={28} color="white" style={styles.wifiIcon} />
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
                        <TouchableOpacity style={styles.actionButton}>
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