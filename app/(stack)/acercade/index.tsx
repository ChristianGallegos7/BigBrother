import { environment } from "@/components/core/environment";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface InfoItemProps {
    label: string;
    value: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

const InfoItem = ({ label, value, icon }: InfoItemProps) => (
    <View style={styles.infoItem}>
        {icon && (
            <View style={styles.infoIconContainer}>
                <Ionicons name={icon} size={20} color="#1a56db" />
            </View>
        )}
        <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

const AcercaDeScreen = () => {
    const handleSupportContact = () => {
        const email = "fbasantes@sicobra.com";
        Linking.openURL(`mailto:${email}`);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header con logo */}
                <View style={styles.header}>
                    <Image
                        source={require('../../../assets/images/bigbrother.jpg')}
                        style={styles.appLogo}
                    />
                    <Text style={styles.appName}>BigBrother</Text>
                    <Text style={styles.appTagline}>Sistema de Grabación Inteligente</Text>
                </View>

                {/* Sección: Acerca de BigBrother */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="information-outline" size={24} color="#1a56db" />
                        <Text style={styles.sectionTitle}>Acerca de</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.descriptionContainer}>
                        <Image
                            source={require('../../../assets/images/Logos/invt.jpg')}
                            style={styles.companyLogo}
                        />
                        <Text style={styles.description}>
                            BigBrother graba y asesora en tiempo real, asegurando el cumplimiento de protocolos y normativas en cobranzas.
                        </Text>
                    </View>
                </View>

                {/* Sección: Información de la Aplicación */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="cellphone" size={24} color="#1a56db" />
                        <Text style={styles.sectionTitle}>Información de la App</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoContainer}>
                        <InfoItem
                            label="Versión de la App"
                            value={`v${environment.version}`}
                            icon="code-slash"
                        />
                        <InfoItem
                            label="Desarrollado por"
                            value="InventarTech"
                            icon="business"
                        />
                        <InfoItem
                            label="Ambiente"
                            value={environment.ambiente === 'PROD' ? 'Producción' : 'Desarrollo'}
                            icon="server"
                        />
                        <InfoItem
                            label="Sistema"
                            value={environment.sistema}
                            icon="phone-portrait"
                        />
                    </View>
                </View>

                {/* Sección: Características */}
                {/* <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                        <Text style={styles.sectionTitle}>Características</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <Ionicons name="mic" size={20} color="#1a56db" />
                            <Text style={styles.featureText}>Grabación de audio en tiempo real</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="cloud-upload" size={20} color="#1a56db" />
                            <Text style={styles.featureText}>Sincronización automática con la nube</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="shield-checkmark" size={20} color="#1a56db" />
                            <Text style={styles.featureText}>Cumplimiento de protocolos</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="analytics" size={20} color="#1a56db" />
                            <Text style={styles.featureText}>Reportes y análisis detallados</Text>
                        </View>
                    </View>
                </View> */}

                {/* Soporte */}
                <View style={styles.supportSection}>
                    <Ionicons name="help-circle" size={40} color="#1a56db" />
                    <Text style={styles.supportTitle}>¿Necesitas ayuda?</Text>
                    <Text style={styles.supportText}>
                        Contacta al equipo de soporte para resolver tus dudas
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.supportButton,
                            pressed && styles.supportButtonPressed
                        ]}
                        onPress={handleSupportContact}
                    >
                        <Ionicons name="mail" size={20} color="white" />
                        <Text style={styles.supportButtonText}>Contactar Soporte</Text>
                    </Pressable>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © 2025 InventarTech. Todos los derechos reservados.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AcercaDeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        backgroundColor: 'white',
        paddingVertical: 40,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    appLogo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#1a56db',
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a56db',
        marginBottom: 8,
    },
    appTagline: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'white',
        marginTop: 15,
        marginHorizontal: 15,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginBottom: 15,
    },
    descriptionContainer: {
        alignItems: 'center',
    },
    companyLogo: {
        width: 200,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 15,
    },
    description: {
        fontSize: 15,
        color: '#4b5563',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    infoContainer: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#1a56db',
    },
    infoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    featuresContainer: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    featureText: {
        fontSize: 15,
        color: '#4b5563',
        marginLeft: 12,
        flex: 1,
    },
    supportSection: {
        backgroundColor: 'white',
        marginTop: 15,
        marginHorizontal: 15,
        borderRadius: 12,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    supportTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 12,
        marginBottom: 8,
    },
    supportText: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    supportButton: {
        flexDirection: 'row',
        backgroundColor: '#1a56db',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    supportButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    supportButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        color: '#9ca3af',
        textAlign: 'center',
    },
});