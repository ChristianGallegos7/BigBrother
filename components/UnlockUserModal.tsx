import { showErrorToast, showSuccessToast } from '@/utils/alertas/alertas';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { generarCodigoDesbloqueo, validarCodigoDesbloqueo } from './core/miCore';

interface UnlockUserModalProps {
    visible: boolean;
    userName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const UnlockUserModal: React.FC<UnlockUserModalProps> = ({
    visible,
    userName,
    onClose,
    onSuccess,
}) => {
    const [isInitialPopup, setIsInitialPopup] = useState(true);
    const [unlockCode, setUnlockCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [codeGenerationTime, setCodeGenerationTime] = useState<Date | null>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        } else {
            // Resetear estado cuando se cierra
            setIsInitialPopup(true);
            setUnlockCode('');
            setCodeGenerationTime(null);
            fadeAnim.setValue(0);
        }
    }, [visible]);

    const handleSendCode = async () => {
        try {
            setIsSendingCode(true);
            const response = await generarCodigoDesbloqueo(userName);
            if (response) {
                setIsInitialPopup(false);
                setCodeGenerationTime(new Date());
                showSuccessToast('Código enviado', 'El código de desbloqueo ha sido enviado a tu WhatsApp.');
            } else {
                showErrorToast('Error', 'No se pudo enviar el código de desbloqueo.');
            }
        } catch (error) {
            console.error('Error al enviar el código de desbloqueo:', error);
            showErrorToast('Error', 'No se pudo enviar el código de desbloqueo.');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleUnlockUser = async () => {
        if (!unlockCode.trim()) {
            showErrorToast('Error', 'Ingresa tu código de desbloqueo');
            return;
        }
        if (!/^\d+$/.test(unlockCode)) {
            showErrorToast('Error', 'Solo se pueden ingresar números');
            return;
        }
        if (unlockCode.length !== 6) {
            showErrorToast('Error', 'El código de desbloqueo debe tener 6 números');
            return;
        }

        if (codeGenerationTime) {
            const currentTime = new Date();
            const timeDifference = (currentTime.getTime() - codeGenerationTime.getTime()) / 1000 / 60;

            if (timeDifference > 5) {
                showErrorToast('Error', 'El código de desbloqueo ha expirado. Solicita un nuevo código.');
                return;
            }
        }

        try {
            setIsSendingCode(true);
            const response = await validarCodigoDesbloqueo(userName, unlockCode);
            if (response) {
                showSuccessToast('Usuario desbloqueado', 'Tu cuenta ha sido desbloqueada. Intenta iniciar sesión nuevamente.');
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => {
                    onSuccess();
                });
            }
        } catch (error) {
            console.error('Error al desbloquear usuario:', error);
            showErrorToast('Error', 'No se pudo desbloquear el usuario. Verifica el código.');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleCancel = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    return (
        <>
            <Modal visible={visible} transparent={true} animationType="none">
                <Animated.View style={[styles.modalBackground, { opacity: fadeAnim }]}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Usuario bloqueado</Text>
                        
                        {isInitialPopup ? (
                            <>
                                <Text style={styles.modalText}>
                                    Tu usuario <Text style={styles.boldText}>{userName}</Text> se encuentra bloqueado.
                                </Text>
                                <Text style={styles.modalText}>
                                    ¿Deseas que te enviemos un código de desbloqueo a tu WhatsApp?
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalText}>
                                    Introduce el código de 6 dígitos que recibiste por WhatsApp.
                                </Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Código de desbloqueo"
                                    value={unlockCode}
                                    onChangeText={(text) => {
                                        if (/^\d*$/.test(text)) {
                                            setUnlockCode(text);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    maxLength={6}
                                />
                                <Text style={styles.warningText}>
                                    El código expira en 5 minutos.
                                </Text>
                            </>
                        )}

                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            {isInitialPopup ? (
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonAccept]}
                                    onPress={handleSendCode}
                                    disabled={isSendingCode}
                                >
                                    <Text style={styles.modalButtonText}>Sí, enviar</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonAccept]}
                                    onPress={handleUnlockUser}
                                    disabled={isSendingCode}
                                >
                                    <Text style={styles.modalButtonText}>Desbloquear</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </Modal>

            {/* Loading Overlay */}
            {isSendingCode && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#041dfdff" />
                        <Text style={styles.loadingText}>
                            {isInitialPopup ? 'Enviando código...' : 'Validando código...'}
                        </Text>
                    </View>
                </Modal>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        width: '85%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#041dfdff',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    boldText: {
        fontWeight: 'bold',
        color: '#041dfdff',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        marginTop: 15,
        marginBottom: 10,
        fontSize: 16,
        textAlign: 'center',
        letterSpacing: 8,
    },
    warningText: {
        fontSize: 12,
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: 15,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#6c757d',
    },
    modalButtonAccept: {
        backgroundColor: '#041dfdff',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: 'white',
    },
});
