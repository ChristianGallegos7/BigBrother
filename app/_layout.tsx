import { useFonts } from 'expo-font';
import { Slot, useSegments } from 'expo-router';
import { StatusBar, View } from "react-native";
import Toast from 'react-native-toast-message';
import { CustomSplashScreen } from '../components/custom-splash-screen';
import { AuthProvider } from '../context/AuthContext';

const RootLayout = () => {
    const [loaded] = useFonts({
        Popins: require('../assets/fonts/Poppins-Regular.ttf')
    })

    const segments = useSegments();
    const current = segments[segments.length - 1];

    if (!loaded) {
        return <CustomSplashScreen />;
    }

    return (
        <AuthProvider>
            <View style={{ flex: 1 }}>
                <Slot />
                <Toast />
                <StatusBar barStyle="default" />
            </View>
        </AuthProvider>
    )
}

export default RootLayout;
