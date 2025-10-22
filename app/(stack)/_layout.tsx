import BottomNav from "@/components/BottomNav";
import { Feather } from "@expo/vector-icons";
import { router, Stack, useSegments } from "expo-router";
import { TouchableOpacity } from "react-native";

const StackLayout = () => {
    const segments = useSegments();
    const current = segments[segments.length - 1];
    const showNav = ["home", "historial", "perfil"].includes(current as string);
    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'ios_from_right',
                }}
            >

                <Stack.Screen name="home/index"

                />
                <Stack.Screen name="historial/index"

                />
                <Stack.Screen name="perfil/index"

                />

                <Stack.Screen
                    name="listaclientes/index"
                    options={{
                        headerShown: true,
                        title: 'Lista de Clientes',
                        headerRight: () => (
                            <TouchableOpacity onPress={() =>  {router.push('/(stack)/agregarcliente')}} style={{ marginRight: 16 }}>
                                <Feather name="plus" size={24} color="blue" />
                            </TouchableOpacity>
                        ),
                    }}
                />

                <Stack.Screen
                    name="agregarcliente/index"
                    options={{
                        headerShown: true,
                        title: 'Agregar Cliente',
                        presentation: 'card',
                    }}
                />

                <Stack.Screen
                    name="configuracion/index"
                    options={{
                        headerShown: true,
                        title: 'Configuración',
                        presentation: 'card',
                    }}
                />


            </Stack>
            {showNav && <BottomNav />}
        </>
    );
}

export default StackLayout;