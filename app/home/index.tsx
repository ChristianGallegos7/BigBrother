import { environment } from "@/components/core/environment";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UserData {
  UserName?: string;
  IdUsuario?: number;
  // Agrega más campos según tu API
}

interface ClientData {
  Nombre?: string;
  Identificacion?: string;
  CodigoCedente?: string;
  NumeroOperacion?: string;
}

const HomeScreen = () => {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('Usuario');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  useEffect(() => {
    loadUserData();
    loadClientData();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const loadUserData = async () => {
    try {
      const userData = await SecureStore.getItem('DataUser');
      if (userData) {
        const parsed: UserData = JSON.parse(userData);
        setUserName(parsed.UserName || 'Usuario');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadClientData = async () => {
    // Aquí cargarías los datos del cliente actual
    // Por ahora usamos datos de ejemplo
    setClientData({
      Nombre: 'MONSERRATE ELIZABETH VELEZ CEDEÑO',
      Identificacion: '1313939744',
      CodigoCedente: 'SOLIDARIO',
      NumeroOperacion: '849940'
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCountryFlag = () => {
    const flags: { [key: string]: any } = {
      'PE': require('../../assets/images/peru.png'),
      'EC': require('../../assets/images/ecuador.png'),
      'GT': require('../../assets/images/guatemala.png'),
    };
    return flags[environment.pais] || flags['EC'];
  };

  const handlePlayPause = () => {
    setIsRecording(!isRecording);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Bienvenido a BigBrother</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
        <View style={styles.headerIcons}>
          <Image source={getCountryFlag()} style={styles.countryFlag} />
          <Ionicons name="wifi" size={28} color="white" style={styles.wifiIcon} />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Client Info Card */}
        {clientData && (
          <View style={styles.clientCard}>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Nombre: </Text>
              <Text style={styles.clientValue}>{clientData.Nombre}</Text>
            </View>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Identificación: </Text>
              <Text style={styles.clientValue}>{clientData.Identificacion}</Text>
            </View>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Codigo Cedente: </Text>
              <Text style={styles.clientValue}>{clientData.CodigoCedente}</Text>
            </View>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Número de Operación: </Text>
              <Text style={styles.clientValue}>{clientData.NumeroOperacion}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="list" size={40} color="#1a56db" />
            <Text style={styles.actionButtonText}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="person-add" size={40} color="#1a56db" />
            <Text style={styles.actionButtonText}>Añadir</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Audio Recording Section */}
        <View style={styles.audioSection}>
          <Text style={styles.audioStatusText}>
            {isSendingAudio ? 'Enviando audio ...' : isRecording ? 'Grabando ...' : 'Listo para grabar'}
          </Text>
          
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={isRecording ? "pause" : "play"} 
              size={60} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>Version: {environment.version}</Text>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <Ionicons name="home" size={28} color="#1a56db" />
          <Text style={[styles.navText, styles.navTextActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {/* Navigate to Historial */}}>
          <MaterialIcons name="history" size={28} color="#6b7280" />
          <Text style={styles.navText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {/* Navigate to Perfil */}}>
          <Ionicons name="person" size={28} color="#6b7280" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1a56db',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userNameText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryFlag: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  wifiIcon: {
    marginLeft: 5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  clientCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  clientInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  clientLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clientValue: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1a56db',
    marginTop: 8,
    fontWeight: '600',
  },
  divider: {
    height: 2,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  audioSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  audioStatusText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 40,
  },
  playButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a56db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
    marginBottom: 20,
  },
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

export default HomeScreen;