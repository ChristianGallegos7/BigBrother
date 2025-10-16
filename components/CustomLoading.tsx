// En: components/CustomLoading.tsx

import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
}

const CustomLoading = ({ visible }: Props) => {
  return (
    <Modal
      transparent={true} // El fondo del modal es transparente
      animationType="fade" // Animación suave
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.text}>Cargando...</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fondo semitransparente
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#041dfdff', // El color azul de tu app
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CustomLoading;