import { Image, StyleSheet, View } from 'react-native';

export function CustomSplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Logos/logo.png')}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // Puedes cambiar el color de fondo
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    resizeMode: 'contain',
  },
});
