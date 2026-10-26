import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import useConfirmModal from "../hooks/useConfirmModal";

export default function Index() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { confirm, notify, modal } = useConfirmModal();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.mustChangePassword) {
        router.replace("/changer-mot-de-passe");
      } else if (user.role === "MEDECIN") {
        router.replace("/medecin");
      } else if (user.role === "DELEGUE") {
        router.replace("/delegue/home");
      } else if (user.role === "ADMIN") {
        router.replace("/admin");
      }
    } catch (error) {
      if (error.message?.includes("vérifier votre adresse email")) {
        const goVerify = await confirm({
          title: "Erreur",
          message: error.message,
          variant: "warning",
          confirmText: "Vérifier mon email",
          cancelText: "Fermer",
        });
        if (goVerify) router.push("/verifier-email");
      } else {
        notify({ title: "Erreur", message: error.message, variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBanner} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrapper}>
            <Text style={styles.logoEmoji}>🩺</Text>
          </View>
          <Text style={styles.brand}>MediSync</Text>
          <Text style={styles.tagline}>Gestion des rendez-vous médicaux</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSubtitle}>Connectez-vous pour accéder à votre espace</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="vous@exemple.com"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} activeOpacity={0.7}>
                  <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Pas encore de compte ?</Text>
              <View style={styles.signupLinks}>
                <TouchableOpacity onPress={() => router.push("/inscription-medecin")} activeOpacity={0.7}>
                  <Text style={styles.signupLink}>Je suis médecin</Text>
                </TouchableOpacity>
                <Text style={styles.signupDot}>·</Text>
                <TouchableOpacity onPress={() => router.push("/inscription-delegue")} activeOpacity={0.7}>
                  <Text style={styles.signupLink}>Je suis délégué</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {modal}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  flex: {
    flex: 1,
  },
  topBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: "#059669",
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 72,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  logoEmoji: {
    fontSize: 38,
  },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginTop: 4,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginTop: 36,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 22,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0f172a",
  },
  eyeIcon: {
    fontSize: 16,
    paddingLeft: 8,
  },
  button: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  signupRow: {
    marginTop: 18,
    alignItems: "center",
  },
  signupText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  signupLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  signupDot: {
    color: "#cbd5e1",
  },
});
