import { ArchivarCliente, ConsultarListaCliente } from "@/components/core/miCore";
import { Cliente } from "@/models/clinte.interface";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const ListaClientesScreen = () => {
    const router = useRouter();
    const [lista, setLista] = useState<Cliente[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAddClientButton, setShowAddClientButton] = useState(true);

    useEffect(() => {
        obtenerListaClientes();
    }, []);

    const obtenerListaClientes = async () => {
        try {
            setLoading(true);
            const datos = await ConsultarListaCliente();

            const datosOrdenados = datos.sort((a: any, b: any) => {
                const fechaA = new Date(a.FechaCarga);
                const fechaB = new Date(b.FechaCarga);
                return fechaB.getTime() - fechaA.getTime();
            });

            setLista(datosOrdenados);
            setShowAddClientButton(datosOrdenados.length === 0);
        } catch (error) {
            showErrorToast("Error", "No se pudo obtener la lista de clientes.");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = lista.filter(item =>
        (item && item.Nombres && item.Nombres.toLowerCase().includes(query.toLowerCase())) ||
        (item && item.Identificacion && item.Identificacion.toLowerCase().includes(query.toLowerCase())) ||
        (item && item.NumeroOperacion && item.NumeroOperacion.toLowerCase().includes(query.toLowerCase()))
    );

    const agregarClienteManualmente = () => {
        router.push('/(stack)/agregarcliente');
    };

    async function archivarCliente(item: Cliente) {
        try {
            Alert.alert(
                'Confirmar',
                `¿Deseas archivar al cliente ${item.Nombres}?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                    {
                        text: 'Sí, archivar',
                        onPress: async () => {
                            try {
                                const resultado = await ArchivarCliente(item);

                                if (resultado) {
                                    await obtenerListaClientes();
                                    showSuccessToast('Éxito', 'Cliente archivado correctamente.');
                                }
                            } catch (error) {
                                console.error('Error al archivar:', error);
                                showErrorToast('Error', 'No se pudo archivar el cliente.');
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error general:', error);
            showErrorToast('Error inesperado', 'Ocurrió un problema. Intenta más tarde.');
        }
    }

    const renderItem = ({ item }: { item: Cliente }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
                <Text style={styles.nombre}>{item.Nombres}</Text>
                <Text style={styles.identificacion}>ID: {item.Identificacion}</Text>
                {item.NumeroOperacion && (
                    <Text style={styles.operacion}>Op: {item.NumeroOperacion}</Text>
                )}
            </View>
            <TouchableOpacity
                style={styles.archivarButton}
                onPress={() => archivarCliente(item)}
            >
                <Ionicons name="archive-outline" size={24} color="#ff6b6b" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Campo de búsqueda */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre o identificación..."
                    value={query}
                    onChangeText={setQuery}
                    placeholderTextColor="#999"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Contador de resultados */}
            {query.length > 0 && (
                <Text style={styles.resultsCount}>
                    {filteredData.length} {filteredData.length === 1 ? 'resultado' : 'resultados'}
                </Text>
            )}

            {/* Lista de clientes */}
            <FlatList
                data={filteredData}
                keyExtractor={(item, index) => item.Id?.toString() || index.toString()}
                renderItem={renderItem}
                refreshing={loading}
                onRefresh={obtenerListaClientes}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>
                            {query.length > 0 ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
                        </Text>
                        {query.length === 0 && lista.length === 0 && (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={agregarClienteManualmente}
                            >
                                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                                <Text style={styles.addButtonText}>Agregar Cliente Manualmente</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    itemContent: {
        flex: 1,
    },
    nombre: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    identificacion: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    operacion: {
        fontSize: 14,
        color: '#999',
    },
    archivarButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ListaClientesScreen;