import { Ionicons, MaterialIcons } from "@expo/vector-icons"; // Importamos MaterialIcons para el icono de stop/delete
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- DATOS DE EJEMPLO ---
const audios = [
    { id: '1', fileName: "BigBrother_20250915_1020.m4a", duration: "00:03:15", date: "15/09/2025", uploaded: false },
    { id: '2', fileName: "BigBrother_20250916_1450.m4a", duration: "00:01:45", date: "16/09/2025", uploaded: false },
    { id: '3', fileName: "BigBrother_20250916_1600.m4a", duration: "00:02:05", date: "16/09/2025", uploaded: true },
    { id: '4', fileName: "BigBrother_20250917_0930.m4a", duration: "00:00:58", date: "17/09/2025", uploaded: true },
];

const audiosPendientes = audios.filter(a => !a.uploaded).length;

const AudioItem = ({ item }: { item: typeof audios[0] }) => {
    const isPending = !item.uploaded;

    const handlePlay = () => {
        console.log(`Reproduciendo: ${item.fileName}`);
    }

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons
                    name={isPending ? "alert-circle" : "checkmark-circle"}
                    size={24}
                    color={isPending ? "#ef4444" : "#22c55e"}
                    style={styles.iconStatus}
                />
                <Text style={styles.cardFileName} numberOfLines={1}>
                    {item.fileName}
                </Text>
            </View>

            <View style={styles.detailsAndActions}>
                <View style={styles.detailsColumn}>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Duración:</Text>
                        <Text style={styles.detailValue}>{item.duration}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Grabado:</Text>
                        <Text style={styles.detailValue}>{item.date}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Estado:</Text>
                        <Text style={[styles.detailValue, isPending ? styles.statusPending : styles.statusSent]}>
                            {isPending ? "PENDIENTE" : "ENVIADO"}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <Pressable onPress={handlePlay} style={styles.playButtonSmall}>
                        <Ionicons name="play" size={20} color="white" />
                    </Pressable>
                    {isPending && (
                        <Pressable onPress={() => console.log('Eliminar', item.id)} style={styles.deleteButtonSmall}>
                            <MaterialIcons name="delete" size={20} color="#fff" />
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
};

const HistorialScreen = () => {
    const EnviarAudios = () => {
        console.log("Enviar Audios pendientes");
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
            {/* CABECERA FIJA */}
            <View style={styles.header}>
                <Text style={styles.h2}>Historial de Grabaciones</Text>

                <Pressable
                    onPress={EnviarAudios}
                    style={[styles.button, audiosPendientes === 0 && styles.buttonDisabled]}
                    disabled={audiosPendientes === 0}
                >
                    <Text style={styles.buttonText}>Enviar Audios</Text>

                    {audiosPendientes > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{audiosPendientes}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* LISTA DE AUDIOS */}
            <FlatList
                data={audios}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <AudioItem item={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay grabaciones guardadas.</Text>
                }
            />
        </SafeAreaView>
    )
}

export default HistorialScreen;

// --- ESTILOS MEJORADOS ---
const styles = StyleSheet.create({
    // --- Cabecera ---
    header: {
        paddingHorizontal: 20, // Ya tienes 20px de relleno en los bordes
        paddingTop: 10,
        paddingBottom: 15,
        flexDirection: "row",
        justifyContent: "space-between", // Mantiene el espacio máximo entre el título y el botón
        alignItems: "center",
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    h2: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1f2937",
    },
    button: {
        backgroundColor: "#1a56db",
        height: 38,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        paddingHorizontal: 15,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
        elevation: 0,
    },
    buttonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
        marginRight: 5,
    },
    badge: {
        backgroundColor: "#ef4444",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 5,
        marginLeft: 3,
    },
    badgeText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 12,
    },

    // --- Lista y Tarjetas ---
    listContent: {
        padding: 15,
        gap: 12,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    iconStatus: {
        marginRight: 8,
    },
    cardFileName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1f2937',
        flexShrink: 1,
    },

    // --- Contenedores de Layout (Para evitar desbordamiento) ---
    detailsAndActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Alinea la columna de detalles y los botones arriba
    },
    detailsColumn: {
        flex: 1, // Ocupa todo el espacio a la izquierda de los botones
        paddingLeft: 32, // Alinea los detalles debajo del icono de estado
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 5,
    },

    // --- Detalles de Fila ---
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    detailLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        width: 75, // Ancho fijo para etiquetas (Duración, Grabado, Estado)
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1, // Ocupa el espacio restante
        textAlign: 'left',
    },

    // --- Estilos de Estado ---
    statusPending: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    statusSent: {
        color: '#22c55e',
        fontWeight: 'bold',
    },

    // --- Estilos de Botones de Tarjeta ---
    playButtonSmall: {
        backgroundColor: '#1a56db',
        width: 35,
        height: 35,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonSmall: {
        backgroundColor: '#ef4444', // Rojo para eliminar
        width: 35,
        height: 35,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#9ca3af',
    }
});