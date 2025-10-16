import Toast, { ToastPosition } from 'react-native-toast-message';


export const showSuccessToast = (
    title: string = '¡Éxito!',
    message: string = 'La operación se realizó con éxito.',
    visibilityTime: number = 3000,
    position: ToastPosition = 'top'
) => {
    Toast.show({
        type: 'success',
        text1: title,
        text2: message,
        visibilityTime: visibilityTime,
        position: position
    });
}

export const showErrorToast = (
    title: string = '¡Oops! Ocurrió un error',
    message: string = 'Por favor, intenta de nuevo más tarde.',
    position: ToastPosition = 'top',
    visibilityTime: number = 4000
) => {
    Toast.show({
        type: 'error',
        text1: title,
        text2: message,
        position: position,
        visibilityTime: visibilityTime,
    });
};