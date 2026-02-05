import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";
import { API_BASE_URL } from "../constants/api";
import { useAuth } from "../contexts/AuthContext"; // ← NUEVO: Hook de autenticación

const ONBOARDING_KEY = "@taskpin_onboarding_completed";

interface UserData {
  user_id: string | null;
  nombre: string;
  correo: string;
}

export default function ConfiguracionScreen() {
  const router = useRouter();
  
  // ✅ NUEVO: Obtenemos user y logout del contexto
  const { user, logout, isLoading: authLoading } = useAuth();
  
  const [userData, setUserData] = useState<UserData>({
    user_id: null,
    nombre: "",
    correo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<"nombre" | "correo" | null>(null);
  const [editValue, setEditValue] = useState("");

  // Logout Modal State
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // ✅ SIMPLIFICADO: Cargamos datos del contexto, no de AsyncStorage
  useEffect(() => {
    if (user && !authLoading) {
      setUserData({
        user_id: String(user.user_id),
        nombre: user.nombre || "",
        correo: user.correo || "",
      });
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const openEditModal = (field: "nombre" | "correo") => {
    setEditField(field);
    setEditValue(userData[field]);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editField || !userData.user_id) return;

    if (!editValue.trim()) {
      Alert.alert("Error", "Field cannot be empty");
      return;
    }

    if (editField === "correo") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        Alert.alert("Error", "Please enter a valid email");
        return;
      }
    }

    setSaving(true);

    try {
      const updateData = { [editField]: editValue.trim() };
      await axios.put(`${API_BASE_URL}/api/usuario/${userData.user_id}`, updateData);

      setUserData((prev) => ({ ...prev, [editField]: editValue.trim() }));
      await AsyncStorage.setItem(editField, editValue.trim());

      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  // ✅ ARREGLADO: Usa logout del AuthContext (limpia memoria + storage)
  const handleLogout = async () => {
    try {
      await logout(); // ← Ahora usa el logout del contexto
      setLogoutModalVisible(false);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Could not sign out");
    }
  };

  const goBack = () => {
    router.canGoBack() ? router.back() : router.replace("/(tabs)/home");
  };

  // Para pruebas: borra la clave de onboarding y vuelve a Loading → verás onboarding de nuevo
  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      Alert.alert(
        "Onboarding reset",
        "Next time you open the app you'll see the onboarding screens again. Going to loading now.",
        [{ text: "OK", onPress: () => router.replace("/loading") }]
      );
    } catch {
      Alert.alert("Error", "Could not reset onboarding");
    }
  };

  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    showChevron = true,
    danger = false,
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress: () => void;
    showChevron?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} activeOpacity={0.8} onPress={onPress}>
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: danger ? colors.semantic.error + "15" : colors.neutral[100] },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? colors.semantic.error : colors.neutral[600]}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
        {value && <Text style={styles.settingValue} numberOfLines={1}>{value}</Text>}
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={danger ? colors.semantic.error : colors.neutral[300]}
        />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="person"
              title="Name"
              value={userData.nombre}
              onPress={() => openEditModal("nombre")}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="mail"
              title="Email"
              value={userData.correo}
              onPress={() => openEditModal("correo")}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <SettingItem icon="notifications" title="Notifications" onPress={() => {}} />
            <View style={styles.settingDivider} />
            <SettingItem icon="moon" title="Dark Mode" onPress={() => {}} />
            <View style={styles.settingDivider} />
            <SettingItem icon="language" title="Language" value="English" onPress={() => {}} />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.sectionCard}>
            <SettingItem icon="lock-closed" title="Change Password" onPress={() => {}} />
            <View style={styles.settingDivider} />
            <SettingItem icon="shield" title="Privacy Policy" onPress={() => {}} />
            <View style={styles.settingDivider} />
            <SettingItem icon="document-text" title="Terms of Service" onPress={() => {}} />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="play-circle-outline"
              title="Ver onboarding de nuevo (pruebas)"
              onPress={handleResetOnboarding}
              showChevron={false}
            />
            <View style={styles.settingDivider} />
            <SettingItem
              icon="log-out"
              title="Sign Out"
              onPress={() => setLogoutModalVisible(true)}
              showChevron={false}
              danger
            />
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Taskpin v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Edit {editField === "nombre" ? "Name" : "Email"}
              </Text>
              <TouchableOpacity onPress={saveEdit} disabled={saving}>
                <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>
                {editField === "nombre" ? "Full Name" : "Email Address"}
              </Text>
              <TextInput
                style={styles.input}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={editField === "nombre" ? "Your name" : "your@email.com"}
                placeholderTextColor={colors.neutral[400]}
                keyboardType={editField === "correo" ? "email-address" : "default"}
                autoCapitalize={editField === "nombre" ? "words" : "none"}
                autoFocus
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out" size={32} color={colors.semantic.error} />
            </View>
            <Text style={styles.logoutTitle}>Sign Out?</Text>
            <Text style={styles.logoutMessage}>
              Are you sure you want to sign out of your account?
            </Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={styles.logoutCancelButton}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirmButton} onPress={handleLogout}>
                <Text style={styles.logoutConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[500],
    marginBottom: spacing[3],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.neutral[800],
  },
  settingTitleDanger: {
    color: colors.semantic.error,
  },
  settingValue: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginLeft: spacing[4] + 40 + spacing[3],
  },
  versionContainer: {
    alignItems: "center",
    marginTop: spacing[4],
  },
  versionText: {
    fontSize: typography.size.sm,
    color: colors.neutral[400],
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalCancel: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
  },
  modalTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[900],
  },
  modalSave: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary[600],
  },
  modalSaveDisabled: {
    color: colors.neutral[400],
  },
  modalContent: {
    padding: spacing[6],
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.size.base,
    color: colors.neutral[900],
  },
  // Logout Modal Styles
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  logoutModalContent: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius["2xl"],
    padding: spacing[6],
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.semantic.error + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  logoutTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  logoutMessage: {
    fontSize: typography.size.base,
    color: colors.neutral[500],
    textAlign: "center",
    marginBottom: spacing[6],
    lineHeight: 22,
  },
  logoutButtons: {
    flexDirection: "row",
    gap: spacing[3],
    width: "100%",
  },
  logoutCancelButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
    alignItems: "center",
  },
  logoutCancelText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[700],
  },
  logoutConfirmButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.semantic.error,
    alignItems: "center",
  },
  logoutConfirmText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.neutral[0],
  },
});
