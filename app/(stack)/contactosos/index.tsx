import { showErrorToast } from "@/utils/alertas/alertas";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface EmergencyContact {
    id: string;
    name: string;
    number: string;
    icon: keyof typeof MaterialIcons.glyphMap | keyof typeof Ionicons.glyphMap;
    iconLibrary: 'MaterialIcons' | 'Ionicons';
    color: string;
    description: string;
}

const emergencyContacts: EmergencyContact[] = [
    {
        id: '1',
        name: 'Policía Nacional',
        number: '911',
        icon: 'shield',
        iconLibrary: 'Ionicons',
        color: '#1a56db',
        description: 'Emergencias policiales y seguridad'
    },
    {
        id: '2',
        name: 'Bomberos',
        number: '102',
        icon: 'local-fire-department',
        iconLibrary: 'MaterialIcons',
        color: '#ef4444',
        description: 'Incendios y rescates'
    },
    {
        id: '3',
        name: 'Ambulancia - SAMU',
        number: '131',
        icon: 'medical',
        iconLibrary: 'Ionicons',
        color: '#10b981',
        description: 'Emergencias médicas'
    },
    {
        id: '4',
        name: 'Cruz Roja',
        number: '105',
        icon: 'add-circle',
        iconLibrary: 'Ionicons',
        color: '#dc2626',
        description: 'Atención médica de emergencia'
    },
    {
        id: '5',
        name: 'Desastres Naturales',
        number: '119',
        icon: 'warning',
        iconLibrary: 'Ionicons',
        color: '#f59e0b',
        description: 'Emergencias por desastres'
    },
];

interface ContactCardProps {
    contact: EmergencyContact;
}

const ContactCard = ({ contact }: ContactCardProps) => {
    const IconComponent = contact.iconLibrary === 'MaterialIcons' ? MaterialIcons : Ionicons;

    const handleCall = async () => {
        const phoneUrl = `tel:${contact.number}`;
        try {
            const supported = await Linking.canOpenURL(phoneUrl);
            if (supported) {
                await Linking.openURL(phoneUrl);
            } else {
                showErrorToast('Error', 'No se pudo realizar la llamada');
            }
        } catch (error) {
            console.error('Error al intentar llamar:', error);
            showErrorToast('Error', 'No se pudo realizar la llamada');
        }
    };

    return (
        <View style={styles.contactCard}>
            <View style={[styles.iconContainer, { backgroundColor: contact.color + '15' }]}>
                <IconComponent
                    // @ts-ignore
                    name={contact.icon}
                    size={32}
                    color={contact.color}
                />
            </View>
            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactDescription}>{contact.description}</Text>
                <Text style={styles.contactNumber}>{contact.number}</Text>
            </View>
            <Pressable
                style={({ pressed }) => [
                    styles.callButton,
                    { backgroundColor: contact.color },
                    pressed && styles.callButtonPressed
                ]}
                onPress={handleCall}
            >
                <Ionicons name="call" size={24} color="white" />
            </Pressable>
        </View>
    );
};

const ContactoScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIconContainer}>
                        <MaterialIcons name="phone-in-talk" size={40} color="#ef4444" />
                    </View>
                    
                    <Text style={styles.headerSubtitle}>
                        Números de emergencia disponibles las 24 horas
                    </Text>
                </View>

                {/* Info box */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color="#1a56db" />
                    <Text style={styles.infoText}>
                        Toca el botón de llamada para comunicarte directamente con el servicio de emergencia.
                    </Text>
                </View>

                {/* Contactos de emergencia */}
                <View style={styles.contactsContainer}>
                    {emergencyContacts.map((contact) => (
                        <ContactCard key={contact.id} contact={contact} />
                    ))}
                </View>

                {/* Warning box */}
                <View style={styles.warningBox}>
                    <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                    <Text style={styles.warningText}>
                        Usa estos números solo en caso de emergencia real. El mal uso puede ser sancionado.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ContactoScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        alignItems: 'center',
    },
    headerIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#1a56db',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1f2937',
        lineHeight: 20,
    },
    contactsContainer: {
        paddingHorizontal: 20,
        paddingTop: 15,
        gap: 15,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    contactDescription: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 6,
    },
    contactNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a56db',
        letterSpacing: 1,
    },
    callButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    callButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#fef3c7',
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: '#92400e',
        lineHeight: 18,
        fontWeight: '500',
    },
});