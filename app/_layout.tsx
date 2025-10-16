import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar, View } from "react-native";
import Toast from 'react-native-toast-message';
import { CustomSplashScreen } from '../components/custom-splash-screen';

const RootLayout = () => {

    const [loaded] = useFonts({
        Popins: require('../assets/fonts/Poppins-Regular.ttf')
    })

    if (!loaded) {
        return <CustomSplashScreen />;
    }

    return (
        <View style={{ flex: 1 }}>
            <Slot />
            <Toast />
            <StatusBar barStyle="default" />
        </View>

    )
}


export default RootLayout;
