import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BottomNavProps {
}

const BottomNav = ({ }: BottomNavProps) => {
    const router = useRouter();
    const segments = useSegments();
    const current = segments[segments.length - 1];

    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
                <Ionicons name="home" size={28} color={current === 'home' ? '#1a56db' : '#6b7280'} />
                <Text style={[styles.navText, current === 'home' && styles.navTextActive]}>Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/historial')}>
                <MaterialIcons name="history" size={28} color={current === 'historial' ? '#1a56db' : '#6b7280'} />
                <Text style={[styles.navText, current === 'historial' && styles.navTextActive]}>Historial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/perfil')}>
                <Ionicons name="person" size={28} color={current === 'perfil' ? '#1a56db' : '#6b7280'} />
                <Text style={[styles.navText, current === 'perfil' && styles.navTextActive]}>Perfil</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: 20,
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
    },
    navText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    navTextActive: {
        color: '#1a56db',
        fontWeight: '600',
    },
});

export default BottomNav;
