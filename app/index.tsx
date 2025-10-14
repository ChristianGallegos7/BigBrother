import { environment } from "@/components/core/environment";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {

  const [secureTextEntry, setSecureTextEntry] = useState(true);

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
        <TextInput style={styles.input} placeholder="Usuario" />
      </View>
      {/* Input contraseña */}
      <View style={styles.inputContainer}>
        <Feather name="lock" size={24} color="black" />
        <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry={secureTextEntry} />
        <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}><Feather name={secureTextEntry ? "eye-off" : "eye"} size={24} color="black" /></TouchableOpacity>
      </View>
      {/* Imagenes de los paises */}
      <View style={styles.flagsContainer}>
        <TouchableOpacity>
          <Image source={require("../assets/images/peru.png")} style={styles.flag} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={require("../assets/images/ecuador.png")} style={styles.flag} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={require("../assets/images/guatemala.png")} style={styles.flag} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} >
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
    </View>
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
  }
});
