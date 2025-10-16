import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HistorialScreen = () => {

    const EnviarAudios = () => {
        console.log("Enviar Audios");
    }

    return (
        <SafeAreaView>
            <View style={styles.container} >
                <Text style={styles.h2}>Historial de Grabaciones</Text>
                <Pressable onPress={() => EnviarAudios()} style={styles.button} >
                    <Text style={styles.buttonText}>Enviar audios</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

export default HistorialScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 15,
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
    },
    h2: {
        fontSize: 18,
        fontWeight: "bold",
        color: "black",
    },
    button: {
        backgroundColor: "#041dfdff",
        height: 50,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
        paddingHorizontal: 10,
    }
})