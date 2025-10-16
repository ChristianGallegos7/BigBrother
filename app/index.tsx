import { environment } from "@/components/core/environment";
import { IniciarSesionApp, obtenerTokenAccesoBigBrother } from "@/components/core/miCore";
import CustomLoading from "@/components/CustomLoading";
import { showErrorToast, showSuccessToast } from "@/utils/alertas/alertas";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {

  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [pais, setPais] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePaisSelect = (pais: string) => {
    setPais(pais);
    environment.pais = pais;
    console.log('env.pais', environment.pais);
  }

  const IniciarSesion = async () => {
    if (user.trim() === "" || password.trim() === "" || !pais) {
      showErrorToast("Datos incompletos", "Por favor ingresa usuario, contraseña y selecciona un país.");
      return;
    }
    try {
      setLoading(true);
      const tokenResponse = await obtenerTokenAccesoBigBrother(user, password);
      console.log('Pase la funcion de obtenerTokenAccesoBigBrother');
      if (!tokenResponse.esOk) {
        showErrorToast("Error de Autenticación", tokenResponse.token || "Credenciales incorrectas.");
        setLoading(false);
        return;
      }
      console.log('Antes de entrar a la funcion IniciarSesionApp');
      const resultData = await IniciarSesionApp(user, password);
      console.log('Despues de entrar a la funcion IniciarSesionApp', resultData);
      if (resultData === 'blocked') {
        setLoading(false);
        showErrorToast("Usuario Bloqueado", "Tu usuario ha sido bloqueado. Contacta al administrador.");
      } else if (resultData === 'changePassword') {
        setLoading(false);
        showErrorToast("Cambio de Clave", "Se requiere cambio de clave.");
        // Aquí podrías navegar a una pantalla de cambio de contraseña si la tienes
        // router.push('/change-password');
      } else if (resultData && typeof resultData === 'object') {
        // Login exitoso, resultData contiene los datos del usuario
        setLoading(false);
        showSuccessToast("¡Bienvenido!", `Hola ${resultData.UserName || user}`);
        router.replace('/home');
      } else {
        // resultData es false, hubo un error
        setLoading(false);
        showErrorToast("Error de inicio de sesión", "No se pudo iniciar sesión. Verifica tus credenciales.");
      }

    } catch (error) {
      setLoading(false);
      showErrorToast("Error", "Ocurrió un error al iniciar sesión. Por favor, intenta de nuevo.");
    }
  }

  return (

    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/bigbrother.jpg")}
          style={styles.headerImage}
        />
        <Text style={styles.headerTitle}>Big Brother</Text>
      </View>
      <Text style={styles.secondTitle}>Bienvenido!</Text>
      <Text style={styles.thirdTitle}>Inicia sesión para continuar</Text>
      {/* Input usuario */}
      <View style={styles.inputContainer}>
        <Feather name="user" size={24} color="black" />
        <TextInput style={styles.input} placeholder="Usuario" value={user}
          onChangeText={setUser} />
      </View>
      {/* Input contraseña */}
      <View style={styles.inputContainer}>
        <Feather name="lock" size={24} color="black" />
        <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry={secureTextEntry} value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}><Feather name={secureTextEntry ? "eye-off" : "eye"} size={24} color="black" /></TouchableOpacity>
      </View>
      {/* Imagenes de los paises */}
      <View style={styles.flagsContainer}>
        <TouchableOpacity onPress={() => handlePaisSelect("PE")} >
          <View style={[styles.flagWrapper, pais === 'PE' && styles.selectedFlag]} >
            <Image source={require("../assets/images/peru.png")} style={styles.flag} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePaisSelect("EC")}>
          <View style={[styles.flagWrapper, pais === 'EC' && styles.selectedFlag]} >
            <Image source={require("../assets/images/ecuador.png")} style={styles.flag} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePaisSelect("GT")}>
          <View style={[styles.flagWrapper, pais === 'GT' && styles.selectedFlag]} >
            <Image source={require("../assets/images/guatemala.png")} style={styles.flag} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => {
        IniciarSesion();
      }} >
        <Text style={styles.buttonText} >
          Iniciar Sesión
        </Text>
      </TouchableOpacity>
      <Text style={styles.forgotPasswordText}>
        ¿Te olvidaste tu contraseña?
      </Text>
      <TouchableOpacity style={[styles.button, styles.recoverButton]}>
        <Text style={styles.buttonText}>
          Recuperar contraseña
        </Text>
      </TouchableOpacity>
      <Text style={{ marginTop: 20, color: "gray" }}>
        Versión {environment.version}
      </Text>
      <CustomLoading visible={loading} />
    </View>
    // <Redirect href={"/(stack)/home"} />
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    backgroundColor: "#041dfdff",
    width: "100%",
    display: "flex",
    flexDirection: "row",
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
  },
  secondTitle: {
    fontWeight: "bold",
    fontSize: 24,
    color: "black",
    marginTop: 20,
  },
  thirdTitle: {
    fontSize: 16,
    color: "gray",
    marginTop: 10,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 10,
  },
  input: {
    flex: 1,
  },
  flagsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
    marginTop: 20,
    marginBottom: 30,
  },
  flag: {
    width: 60,
    height: 60,
    borderRadius: 25
  },
  button: {
    backgroundColor: "#041dfdff",
    width: "85%",
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotPasswordText: {
    marginTop: 20,
    marginBottom: 10,
    color: "gray",
    fontWeight: "bold"
  },
  recoverButton: {
    backgroundColor: "gray",
  },

  selectedFlag: {
    borderColor: '#041dfdff', // Color del borde cuando está seleccionado
  },
  countryName: {
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '500',
  },
  flagWrapper: {
    padding: 5,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
  },
});
