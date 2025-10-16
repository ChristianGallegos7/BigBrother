import { FlatList, StyleSheet, Text, View } from "react-native";

const clientesEjemplo = [
    {
        id: '1',
        nombre: 'Juan Pérez',
        correo: 'juan.perez@email.com',
        telefono: '+51 999 888 777',
    },
    // Puedes agregar más clientes aquí
];

const ListaClientesScreen = () => {
    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.correo}>{item.correo}</Text>
            <Text style={styles.telefono}>{item.telefono}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={clientesEjemplo}
                keyExtractor={item => item.id}
                renderItem={renderItem}
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
    titulo: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    itemContainer: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    nombre: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    correo: {
        fontSize: 16,
        color: 'gray',
    },
    telefono: {
        fontSize: 16,
        color: 'gray',
    },
});

export default ListaClientesScreen;