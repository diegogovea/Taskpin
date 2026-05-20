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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../constants/theme";
import { API_BASE_URL } from "../constants/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";


interface UserData {
  user_id: string | null;
  nombre: string;
  correo: string;
}

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading, authFetch } = useAuth();
  const { isDark, toggleDark, palette } = useTheme();

  const [userData, setUserData] = useState<UserData>({
    user_id: null,
    nombre: "",
    correo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Modal (nombre / correo)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<"nombre" | "correo" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editPasswordError, setEditPasswordError] = useState("");

  // Change Password Modal
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwdActual, setShowPwdActual] = useState(false);
  const [showPwdNueva, setShowPwdNueva] = useState(false);
  const [showPwdConfirmar, setShowPwdConfirmar] = useState(false);

  // Legal Modal (privacidad / términos)
  const [legalModal, setLegalModal] = useState<"privacidad" | "terminos" | null>(null);

  // Logout Modal
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
    setEditPassword("");
    setShowEditPassword(false);
    setEditPasswordError("");
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editField || !userData.user_id) return;

    if (!editValue.trim()) {
      Alert.alert("Error", "El campo no puede estar vacío");
      return;
    }

    if (editField === "correo") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        Alert.alert("Error", "Por favor ingresa un correo válido");
        return;
      }
    }

    if (editField === "correo" && !editPassword) {
      setEditPasswordError("Ingresa tu contraseña para confirmar");
      return;
    }

    setSaving(true);
    setEditPasswordError("");

    try {
      // Para cambio de correo, verificar contraseña primero
      if (editField === "correo") {
        const verifyRes = await authFetch(`/api/usuario/${userData.user_id}/verificar-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contrasena: editPassword }),
        });

        if (!verifyRes.ok) {
          const verifyData = await verifyRes.json();
          setEditPasswordError(verifyData.detail || "Contraseña incorrecta");
          return;
        }
      }

      // Actualizar el campo
      const updateRes = await authFetch(`/api/usuario/${userData.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editField]: editValue.trim() }),
      });

      if (updateRes.ok || updateRes.status === 204) {
        setUserData((prev) => ({ ...prev, [editField!]: editValue.trim() }));
        setEditModalVisible(false);
        Alert.alert("Éxito", "Perfil actualizado correctamente");
      } else {
        const errData = await updateRes.json().catch(() => ({}));
        Alert.alert("Error", (errData as any).detail || "No se pudo actualizar el perfil");
      }
    } catch {
      Alert.alert("Error", "Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const openPwdModal = () => {
    setPwdActual("");
    setPwdNueva("");
    setPwdConfirmar("");
    setShowPwdActual(false);
    setShowPwdNueva(false);
    setShowPwdConfirmar(false);
    setPwdModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!userData.user_id) return;
    if (!pwdActual || !pwdNueva || !pwdConfirmar) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (pwdNueva.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (pwdNueva !== pwdConfirmar) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden");
      return;
    }
    setPwdSaving(true);
    try {
      const res = await authFetch(`/api/usuario/${userData.user_id}/cambiar-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contrasena_actual: pwdActual, nueva_contrasena: pwdNueva }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwdModalVisible(false);
        Alert.alert("Éxito", "Contraseña actualizada correctamente");
      } else {
        Alert.alert("Error", data.detail || "No se pudo cambiar la contraseña");
      }
    } catch {
      Alert.alert("Error", "Error de conexión. Intenta de nuevo.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // ← Ahora usa el logout del contexto
      setLogoutModalVisible(false);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión");
    }
  };

  const goBack = () => {
    router.canGoBack() ? router.back() : router.replace("/(tabs)/home");
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
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: palette.surface }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: danger ? colors.semantic.error + "15" : palette.border },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? colors.semantic.error : palette.textMuted}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger ? colors.semantic.error : palette.text }]}>
          {title}
        </Text>
        {value && (
          <Text style={[styles.settingValue, { color: palette.textMuted }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={danger ? colors.semantic.error : palette.textMuted}
        />
      )}
    </TouchableOpacity>
  );

  const SettingItemSwitch = ({
    icon,
    title,
    value,
    onToggle,
  }: {
    icon: string;
    title: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={[styles.settingItem, { backgroundColor: palette.surface }]}>
      <View style={[styles.settingIcon, { backgroundColor: palette.border }]}>
        <Ionicons name={icon as any} size={20} color={palette.textMuted} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: palette.text }]}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.neutral[200], true: colors.primary[400] }}
        thumbColor={value ? colors.primary[600] : colors.neutral[400]}
        ios_backgroundColor={colors.neutral[200]}
      />
    </View>
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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: palette.border }]} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Configuración</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>Perfil</Text>
          <View style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
            <SettingItem
              icon="person"
              title="Nombre"
              value={userData.nombre}
              onPress={() => openEditModal("nombre")}
            />
            <View style={[styles.settingDivider, { backgroundColor: palette.border }]} />
            <SettingItem
              icon="mail"
              title="Correo"
              value={userData.correo}
              onPress={() => openEditModal("correo")}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>Preferencias</Text>
          <View style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
            <SettingItemSwitch
              icon="moon"
              title="Modo Oscuro"
              value={isDark}
              onToggle={toggleDark}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>Privacidad y Seguridad</Text>
          <View style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
            <SettingItem icon="lock-closed" title="Cambiar Contraseña" onPress={openPwdModal} />
            <View style={[styles.settingDivider, { backgroundColor: palette.border }]} />
            <SettingItem icon="shield" title="Política de Privacidad" onPress={() => setLegalModal("privacidad")} />
            <View style={[styles.settingDivider, { backgroundColor: palette.border }]} />
            <SettingItem icon="document-text" title="Términos de Servicio" onPress={() => setLegalModal("terminos")} />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>Cuenta</Text>
          <View style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
            <SettingItem
              icon="log-out"
              title="Cerrar Sesión"
              onPress={() => setLogoutModalVisible(true)}
              showChevron={false}
              danger
            />
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: palette.textMuted }]}>Taskpin v1.0.0</Text>
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
          <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: palette.bg }]}>
            <View style={[styles.modalHeader, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.modalCancel, { color: palette.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                Editar {editField === "nombre" ? "Nombre" : "Correo"}
              </Text>
              <TouchableOpacity onPress={saveEdit} disabled={saving}>
                <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                  {saving ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalContent, { backgroundColor: palette.bg }]}>
              {/* Campo a editar */}
              <Text style={[styles.inputLabel, { color: palette.textMuted }]}>
                {editField === "nombre" ? "Nombre Completo" : "Correo Electrónico"}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={editField === "nombre" ? "Tu nombre" : "tucorreo@email.com"}
                placeholderTextColor={palette.textMuted}
                keyboardType={editField === "correo" ? "email-address" : "default"}
                autoCapitalize={editField === "nombre" ? "words" : "none"}
                autoFocus
              />

              {/* Confirmación de contraseña (solo para cambio de correo) */}
              {editField === "correo" && (
                <>
                  <View style={styles.editPwdHeader}>
                    <Ionicons name="lock-closed-outline" size={14} color={palette.textMuted} />
                    <Text style={[styles.inputLabel, { color: palette.textMuted, marginBottom: 0 }]}>
                      Confirma con tu contraseña
                    </Text>
                  </View>
                  <View style={[
                    styles.pwdInputRow,
                    { backgroundColor: palette.surface, borderColor: editPasswordError ? colors.semantic.error : palette.border }
                  ]}>
                    <TextInput
                      style={[styles.pwdInput, { color: palette.text }]}
                      value={editPassword}
                      onChangeText={(t) => { setEditPassword(t); setEditPasswordError(""); }}
                      placeholder="Tu contraseña actual"
                      placeholderTextColor={palette.textMuted}
                      secureTextEntry={!showEditPassword}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={saveEdit}
                    />
                    <TouchableOpacity onPress={() => setShowEditPassword(v => !v)} style={styles.eyeBtn}>
                      <Ionicons name={showEditPassword ? "eye-off" : "eye"} size={20} color={palette.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {editPasswordError !== "" && (
                    <View style={styles.inlineError}>
                      <Ionicons name="alert-circle" size={14} color={colors.semantic.error} />
                      <Text style={styles.inlineErrorText}>{editPasswordError}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Cambiar Contraseña Modal ── */}
      <Modal
        visible={pwdModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPwdModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalContainer, { backgroundColor: palette.bg }]}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={[styles.modalHeader, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
              <TouchableOpacity onPress={() => setPwdModalVisible(false)}>
                <Text style={[styles.modalCancel, { color: palette.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={handleChangePassword} disabled={pwdSaving}>
                <Text style={[styles.modalSave, pwdSaving && styles.modalSaveDisabled]}>
                  {pwdSaving ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalContent, { backgroundColor: palette.bg }]}>
              {/* Contraseña actual */}
              <Text style={[styles.inputLabel, { color: palette.textMuted }]}>Contraseña actual</Text>
              <View style={[styles.pwdInputRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <TextInput
                  style={[styles.pwdInput, { color: palette.text }]}
                  value={pwdActual}
                  onChangeText={setPwdActual}
                  placeholder="Tu contraseña actual"
                  placeholderTextColor={palette.textMuted}
                  secureTextEntry={!showPwdActual}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPwdActual(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPwdActual ? "eye-off" : "eye"} size={20} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Nueva contraseña */}
              <Text style={[styles.inputLabel, { color: palette.textMuted, marginTop: spacing[5] }]}>Nueva contraseña</Text>
              <View style={[styles.pwdInputRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <TextInput
                  style={[styles.pwdInput, { color: palette.text }]}
                  value={pwdNueva}
                  onChangeText={setPwdNueva}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={palette.textMuted}
                  secureTextEntry={!showPwdNueva}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPwdNueva(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPwdNueva ? "eye-off" : "eye"} size={20} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Confirmar contraseña */}
              <Text style={[styles.inputLabel, { color: palette.textMuted, marginTop: spacing[5] }]}>Confirmar nueva contraseña</Text>
              <View style={[styles.pwdInputRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <TextInput
                  style={[styles.pwdInput, { color: palette.text }]}
                  value={pwdConfirmar}
                  onChangeText={setPwdConfirmar}
                  placeholder="Repite la nueva contraseña"
                  placeholderTextColor={palette.textMuted}
                  secureTextEntry={!showPwdConfirmar}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPwdConfirmar(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPwdConfirmar ? "eye-off" : "eye"} size={20} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              {pwdNueva && pwdConfirmar && pwdNueva !== pwdConfirmar && (
                <Text style={styles.pwdMismatch}>Las contraseñas no coinciden</Text>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Legal Modal (Privacidad / Términos) ── */}
      <Modal
        visible={legalModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModal(null)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: palette.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
            <TouchableOpacity onPress={() => setLegalModal(null)}>
              <Text style={[styles.modalCancel, { color: palette.textMuted }]}>Cerrar</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: palette.text }]}>
              {legalModal === "privacidad" ? "Política de Privacidad" : "Términos de Servicio"}
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={[styles.legalContent, { backgroundColor: palette.bg }]}>
            {legalModal === "privacidad" ? (
              <>
                <Text style={[styles.legalTitle, { color: palette.text }]}>Política de Privacidad</Text>
                <Text style={[styles.legalDate, { color: palette.textMuted }]}>Última actualización: mayo 2026</Text>
                <Text style={[styles.legalBody, { color: palette.text }]}>
                  En Taskpin nos comprometemos a proteger tu privacidad y tus datos personales.{"\n\n"}
                  <Text style={styles.legalSubtitle}>1. Datos que recopilamos{"\n"}</Text>
                  Recopilamos únicamente los datos necesarios para brindarte el servicio: nombre, correo electrónico y los hábitos que registras.{"\n\n"}
                  <Text style={styles.legalSubtitle}>2. Uso de los datos{"\n"}</Text>
                  Tus datos se usan exclusivamente para personalizar tu experiencia en la app. No vendemos ni compartimos tu información con terceros.{"\n\n"}
                  <Text style={styles.legalSubtitle}>3. Almacenamiento{"\n"}</Text>
                  Tus datos se almacenan de forma segura con contraseñas cifradas (bcrypt). Puedes solicitar la eliminación de tu cuenta en cualquier momento.{"\n\n"}
                  <Text style={styles.legalSubtitle}>4. Contacto{"\n"}</Text>
                  Para cualquier duda sobre tu privacidad, contáctanos en: privacidad@taskpin.app
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.legalTitle, { color: palette.text }]}>Términos de Servicio</Text>
                <Text style={[styles.legalDate, { color: palette.textMuted }]}>Última actualización: mayo 2026</Text>
                <Text style={[styles.legalBody, { color: palette.text }]}>
                  Al usar Taskpin aceptas los siguientes términos.{"\n\n"}
                  <Text style={styles.legalSubtitle}>1. Uso aceptable{"\n"}</Text>
                  Taskpin está diseñado para ayudarte a construir hábitos positivos. Queda prohibido cualquier uso que dañe a otros usuarios o a la plataforma.{"\n\n"}
                  <Text style={styles.legalSubtitle}>2. Responsabilidad{"\n"}</Text>
                  Taskpin no se hace responsable de decisiones tomadas con base en las sugerencias de la app. Siempre consulta a profesionales de salud cuando sea relevante.{"\n\n"}
                  <Text style={styles.legalSubtitle}>3. Modificaciones{"\n"}</Text>
                  Podemos actualizar estos términos en cualquier momento. Te notificaremos con 15 días de anticipación ante cambios significativos.{"\n\n"}
                  <Text style={styles.legalSubtitle}>4. Cancelación{"\n"}</Text>
                  Puedes eliminar tu cuenta desde la app en cualquier momento. Tus datos se borrarán de nuestros servidores en un plazo de 30 días.{"\n\n"}
                  <Text style={styles.legalSubtitle}>5. Contacto{"\n"}</Text>
                  Para dudas sobre estos términos: soporte@taskpin.app
                </Text>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
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
            <Text style={styles.logoutTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.logoutMessage}>
              ¿Estás seguro de que quieres cerrar sesión?
            </Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={styles.logoutCancelButton}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.logoutCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirmButton} onPress={handleLogout}>
                <Text style={styles.logoutConfirmText}>Cerrar Sesión</Text>
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
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
  },
  inlineErrorText: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    flex: 1,
  },
  editPwdHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[6],
    marginBottom: spacing[2],
  },
  // Password input row
  pwdInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  pwdInput: {
    flex: 1,
    fontSize: typography.size.base,
  },
  eyeBtn: {
    padding: spacing[1],
    marginLeft: spacing[2],
  },
  pwdMismatch: {
    color: colors.semantic.error,
    fontSize: typography.size.sm,
    marginTop: spacing[2],
  },
  // Legal Modal
  legalContent: {
    padding: spacing[6],
    paddingBottom: spacing[12],
  },
  legalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[1],
  },
  legalDate: {
    fontSize: typography.size.sm,
    marginBottom: spacing[6],
  },
  legalBody: {
    fontSize: typography.size.base,
    lineHeight: 26,
  },
  legalSubtitle: {
    fontWeight: typography.weight.semibold,
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
