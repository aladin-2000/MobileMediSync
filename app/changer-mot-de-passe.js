// app/changer-mot-de-passe.js
import {                useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import * as authService from "../services/authService";
import useConfirmModal from "../hooks/useConfirmModal";

export default function ChangerMotDePasseScreen() {
  const { user, markPasswordChanged } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { confirm, notify, modal } = useConfirmModal();

  const handleSubmit = async () => {
    const ok = await confirm({
      title: "Changer le mot de passe",
      message: "Confirmez-vous le changement de votre mot de passe ?",
      variant: "question",
      confirmText: "Confirmer",
      cancelText: "Annuler",
    });
    if (!ok) return;

    setLoading(true);
    try {
      await authService.changerMotDePasse(currentPassword, newPassword);
      markPasswordChanged();
      if (user.role === "MEDECIN") router.replace("/medecin");
      else if (user.role === "DELEGUE") router.replace("/delegue/home");
      else if (user.role === "ADMIN") router.replace("/admin");
    } catch (error) {
      notify({ title: "Erreur", message: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.form}>
        <Text style={styles.title}>Changement de mot de passe requis</Text>
        <Text style={styles.subtitle}>Choisissez un nouveau mot de passe avant de continuer.</Text>

        <Text>Mot de passe actuel</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <Text>Nouveau mot de passe</Text>
        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Valider</Text>}
        </TouchableOpacity>
      </View>

      {modal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d3d3d3",
    justifyContent: "center",
  },
  form: {
    backgroundColor: "white",
    borderWidth: 3,
    borderRadius: 30,
    borderColor: "grey",
    margin: 15,
    padding: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 15,
    margin: 10,
    padding: 10,
  },
  button: {
    backgroundColor: "#059669",
    borderRadius: 15,
    margin: 10,
    padding: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
