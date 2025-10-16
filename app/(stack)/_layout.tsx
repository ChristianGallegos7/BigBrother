import BottomNav from "@/components/BottomNav";
import { Stack, useSegments } from "expo-router";

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

            </Stack>
            {showNav && <BottomNav />}
        </>
    );
}

export default StackLayout;