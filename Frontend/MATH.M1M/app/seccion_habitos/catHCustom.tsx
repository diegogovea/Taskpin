import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, radius, shadows } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Toast } from "../../components/ui";

// ── Paleta de colores para el hábito ───────────────────────
const COLORES_HABITO = [
  { hex: "#6366F1", nombre: "Índigo" },
  { hex: "#8B5CF6", nombre: "Violeta" },
  { hex: "#EC4899", nombre: "Rosa" },
  { hex: "#EF4444", nombre: "Rojo" },
  { hex: "#F97316", nombre: "Naranja" },
  { hex: "#EAB308", nombre: "Amarillo" },
  { hex: "#22C55E", nombre: "Verde" },
  { hex: "#14B8A6", nombre: "Teal" },
  { hex: "#06B6D4", nombre: "Cian" },
  { hex: "#3B82F6", nombre: "Azul" },
  { hex: "#64748B", nombre: "Gris" },
  { hex: "#1E293B", nombre: "Negro" },
];

// ── Íconos disponibles (Ionicons) ──────────────────────────
const ICONOS_HABITO = [
  "book-outline", "barbell-outline", "bicycle-outline", "body-outline",
  "cafe-outline", "camera-outline", "chatbubble-outline", "code-outline",
  "color-palette-outline", "diamond-outline", "earth-outline", "fast-food-outline",
  "fitness-outline", "flask-outline", "flower-outline", "game-controller-outline",
  "guitar-outline", "heart-outline", "headset-outline", "home-outline",
  "journal-outline", "leaf-outline", "medkit-outline", "mic-outline",
  "moon-outline", "musical-notes-outline", "navigate-outline", "nutrition-outline",
  "pencil-outline", "people-outline", "person-outline", "phone-portrait-outline",
  "planet-outline", "rose-outline", "school-outline", "sparkles-outline",
  "star-outline", "stopwatch-outline", "sunny-outline", "walk-outline",
  "water-outline", "wifi-outline", "wine-outline", "barcode-outline",
  "alarm-outline", "archive-outline", "bed-outline", "brush-outline",
  "ribbon-outline", "shield-checkmark-outline", "stats-chart-outline", "timer-outline",
];

// ── Frecuencias ─────────────────────────────────────────────
const FRECUENCIAS = [
  { value: "diario", label: "Cada día", icon: "sunny-outline" },
  { value: "cada_2_dias", label: "Cada 2 días", icon: "partly-sunny-outline" },
  { value: "semanal", label: "Cada semana", icon: "calendar-outline" },
  { value: "cada_2_semanas", label: "Cada 2 semanas", icon: "calendar-clear-outline" },
  { value: "mensual", label: "Cada mes", icon: "calendar-number-outline" },
  { value: "cada_2_meses", label: "Cada 2 meses", icon: "time-outline" },
];

// ── Unidades de meta ────────────────────────────────────────
const UNIDADES_META = [
  "minutos", "horas", "páginas", "km", "metros",
  "vasos", "repeticiones", "series", "veces",
];

type ActiveSheet = "color" | "icon" | "frecuencia" | "meta" | "tipo" | null;

export default function CatHCustomScreen() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const { palette } = useTheme();

  // ── Campos del formulario ───────────────────────────────
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [frecuencia, setFrecuencia] = useState("diario");
  const [color, setColor] = useState(COLORES_HABITO[0].hex);
  const [icono, setIcono] = useState("star-outline");
  const [tipo, setTipo] = useState<"bueno" | "por_eliminar">("bueno");
  const [conFechaFin, setConFechaFin] = useState(false);
  const [fechaFinDisplay, setFechaFinDisplay] = useState('');
  const [conMeta, setConMeta] = useState(false);
  const [metaValor, setMetaValor] = useState("");
  const [metaUnidad, setMetaUnidad] = useState("minutos");

  // ── Estado UI ───────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/seccion_habitos/tiposHabitos");
  };

  const isValidForm = () => nombre.trim().length >= 3;

  const formatDateInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const displayToIso = (display: string): string => {
    const digits = display.replace(/\D/g, '');
    if (digits.length !== 8) return '';
    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  };

  const handleCreate = async () => {
    if (!user?.user_id || !isValidForm() || isLoading) return;
    setIsLoading(true);
    try {
      const isoFecha = displayToIso(fechaFinDisplay);
      const body: Record<string, unknown> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        frecuencia_personal: frecuencia,
        color,
        icono,
        tipo,
      };
      if (conFechaFin && isoFecha) body.fecha_fin = isoFecha;
      if (conMeta && metaValor) {
        body.meta_valor = parseFloat(metaValor);
        body.meta_unidad = metaUnidad;
      }

      const response = await authFetch(
        `/api/usuario/${user.user_id}/habitos/custom`,
        { method: "POST", body: JSON.stringify(body) }
      );
      const data = await response.json();

      if (data.success) {
        setToast({ visible: true, message: "¡Hábito creado exitosamente!", type: "success" });
        setTimeout(() => router.replace("/(tabs)/habitos"), 1200);
      } else {
        setToast({ visible: true, message: data.detail || "Error al crear el hábito", type: "error" });
      }
    } catch {
      setToast({ visible: true, message: "Error de conexión", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Label helpers ───────────────────────────────────────
  const frecLabel = FRECUENCIAS.find((f) => f.value === frecuencia)?.label ?? frecuencia;
  const tipoLabel = tipo === "bueno" ? "Hábito positivo" : "Hábito a eliminar";

  // ── Fila de opción estilo iOS ───────────────────────────
  const Row = ({
    icon, iconBg, label, value, onPress, last = false,
  }: {
    icon: string; iconBg: string; label: string; value?: string;
    onPress: () => void; last?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color="#fff" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
      </View>
    </TouchableOpacity>
  );

  // ── Toggle row ──────────────────────────────────────────
  const ToggleRow = ({
    icon, iconBg, label, value, onChange, last = false,
  }: {
    icon: string; iconBg: string; label: string;
    value: boolean; onChange: (v: boolean) => void; last?: boolean;
  }) => (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color="#fff" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.neutral[200], true: colors.primary[500] }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Hábito</Text>
          <TouchableOpacity
            style={[styles.saveBtn, !isValidForm() && styles.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={!isValidForm() || isLoading}
          >
            <Text style={[styles.saveBtnText, !isValidForm() && { color: colors.neutral[400] }]}>
              {isLoading ? "..." : "Guardar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Vista previa del hábito ── */}
          <View style={styles.previewCard}>
            <View style={[styles.previewIconWrap, { backgroundColor: color + "30" }]}>
              <Ionicons name={icono as any} size={32} color={color} />
            </View>
            <Text style={[styles.previewNombre, { color: nombre ? colors.neutral[900] : colors.neutral[400] }]}>
              {nombre || "Nombre del hábito"}
            </Text>
            <View style={[styles.previewBadge, { backgroundColor: tipo === "bueno" ? "#22C55E20" : "#EF444420" }]}>
              <Ionicons
                name={tipo === "bueno" ? "checkmark-circle" : "warning"}
                size={12}
                color={tipo === "bueno" ? "#22C55E" : "#EF4444"}
              />
              <Text style={[styles.previewBadgeText, { color: tipo === "bueno" ? "#22C55E" : "#EF4444" }]}>
                {tipoLabel}
              </Text>
            </View>
          </View>

          {/* ── Sección: Información básica ── */}
          <Text style={styles.sectionLabel}>INFORMACIÓN</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: color }]}>
                <Ionicons name={icono as any} size={18} color="#fff" />
              </View>
              <TextInput
                style={styles.inputInline}
                placeholder="Nombre del hábito *"
                placeholderTextColor={colors.neutral[400]}
                value={nombre}
                onChangeText={setNombre}
                maxLength={100}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#64748B" }]}>
                <Ionicons name="document-text-outline" size={18} color="#fff" />
              </View>
              <TextInput
                style={[styles.inputInline, styles.inputMultiline]}
                placeholder="Descripción (opcional)"
                placeholderTextColor={colors.neutral[400]}
                value={descripcion}
                onChangeText={setDescripcion}
                maxLength={500}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── Sección: Apariencia ── */}
          <Text style={styles.sectionLabel}>APARIENCIA</Text>
          <View style={styles.card}>
            <Row
              icon="color-palette-outline"
              iconBg={color}
              label="Color"
              value={COLORES_HABITO.find((c) => c.hex === color)?.nombre}
              onPress={() => setActiveSheet("color")}
            />
            <View style={styles.divider} />
            <Row
              icon={icono}
              iconBg={color}
              label="Ícono"
              value={icono.replace(/-outline$/, "").replace(/-/g, " ")}
              onPress={() => setActiveSheet("icon")}
              last
            />
          </View>

          {/* ── Sección: Configuración ── */}
          <Text style={styles.sectionLabel}>CONFIGURACIÓN</Text>
          <View style={styles.card}>
            <Row
              icon="repeat-outline"
              iconBg="#3B82F6"
              label="Repetir"
              value={frecLabel}
              onPress={() => setActiveSheet("frecuencia")}
            />
            <View style={styles.divider} />
            <Row
              icon={tipo === "bueno" ? "checkmark-circle-outline" : "warning-outline"}
              iconBg={tipo === "bueno" ? "#22C55E" : "#EF4444"}
              label="Tipo"
              value={tipoLabel}
              onPress={() => setActiveSheet("tipo")}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon="calendar-clear-outline"
              iconBg="#F97316"
              label="Fecha de finalización"
              value={conFechaFin}
              onChange={setConFechaFin}
            />
            {conFechaFin && (
              <>
                <View style={styles.divider} />
                <View style={styles.inputRow}>
                  <View style={[styles.rowIconWrap, { backgroundColor: "#F97316" }]}>
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                  </View>
                  <TextInput
                    style={styles.inputInline}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.neutral[400]}
                    keyboardType="numeric"
                    value={fechaFinDisplay}
                    maxLength={10}
                    onChangeText={(raw) => setFechaFinDisplay(formatDateInput(raw))}
                  />
                  {fechaFinDisplay.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setFechaFinDisplay('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
            <View style={styles.divider} />
            <ToggleRow
              icon="flag-outline"
              iconBg="#8B5CF6"
              label="Definir meta"
              value={conMeta}
              onChange={setConMeta}
              last={!conMeta}
            />
            {conMeta && (
              <>
                <View style={styles.divider} />
                <Row
                  icon="trophy-outline"
                  iconBg="#8B5CF6"
                  label="Meta"
                  value={metaValor ? `${metaValor} ${metaUnidad}` : "Sin definir"}
                  onPress={() => setActiveSheet("meta")}
                  last
                />
              </>
            )}
          </View>

          {/* ── Info puntos ── */}
          <View style={styles.infoCard}>
            <Ionicons name="diamond" size={18} color={colors.primary[600]} />
            <Text style={styles.infoText}>
              Los hábitos personalizados dan{" "}
              <Text style={styles.infoHighlight}>10 puntos</Text> cada vez que los completas
            </Text>
          </View>

          {/* ── Botón crear ── */}
          <TouchableOpacity
            style={[styles.createBtn, !isValidForm() && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!isValidForm() || isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isValidForm() ? colors.gradients.primary : [colors.neutral[300], colors.neutral[300]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createBtnGradient}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.createBtnText}>
                {isLoading ? "Creando..." : "Crear Hábito"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ════════════════════════════════════════ */}
      {/* BOTTOM SHEETS                           */}
      {/* ════════════════════════════════════════ */}

      {/* ── Sheet: Color ── */}
      <Modal visible={activeSheet === "color"} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige un color</Text>
            <View style={styles.colorGrid}>
              {COLORES_HABITO.map((c) => (
                <TouchableOpacity
                  key={c.hex}
                  style={[styles.colorSwatch, { backgroundColor: c.hex },
                    color === c.hex && styles.colorSwatchSelected]}
                  onPress={() => { setColor(c.hex); setActiveSheet(null); }}
                >
                  {color === c.hex && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setActiveSheet(null)}>
              <Text style={styles.sheetCloseBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Sheet: Ícono ── */}
      <Modal visible={activeSheet === "icon"} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { maxHeight: "75%" }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige un ícono</Text>
            <FlatList
              data={ICONOS_HABITO}
              numColumns={6}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.iconGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.iconOption, icono === item && { backgroundColor: color + "30", borderColor: color }]}
                  onPress={() => { setIcono(item); setActiveSheet(null); }}
                >
                  <Ionicons name={item as any} size={24} color={icono === item ? color : colors.neutral[600]} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setActiveSheet(null)}>
              <Text style={styles.sheetCloseBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Sheet: Frecuencia ── */}
      <Modal visible={activeSheet === "frecuencia"} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Frecuencia</Text>
            {FRECUENCIAS.map((f, i) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.optionRow, i === FRECUENCIAS.length - 1 && styles.optionRowLast]}
                onPress={() => { setFrecuencia(f.value); setActiveSheet(null); }}
              >
                <Ionicons name={f.icon as any} size={20} color={frecuencia === f.value ? colors.primary[600] : colors.neutral[500]} />
                <Text style={[styles.optionLabel, frecuencia === f.value && styles.optionLabelSelected]}>
                  {f.label}
                </Text>
                {frecuencia === f.value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setActiveSheet(null)}>
              <Text style={styles.sheetCloseBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Sheet: Tipo ── */}
      <Modal visible={activeSheet === "tipo"} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Tipo de hábito</Text>
            {[
              { value: "bueno", label: "Hábito positivo", sub: "Quieres adoptarlo", icon: "checkmark-circle-outline", color: "#22C55E" },
              { value: "por_eliminar", label: "Hábito a eliminar", sub: "Quieres dejar de hacerlo", icon: "warning-outline", color: "#EF4444" },
            ].map((t, i) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.optionRow, i === 1 && styles.optionRowLast]}
                onPress={() => { setTipo(t.value as "bueno" | "por_eliminar"); setActiveSheet(null); }}
              >
                <Ionicons name={t.icon as any} size={22} color={t.color} />
                <View style={{ flex: 1, marginLeft: spacing[3] }}>
                  <Text style={[styles.optionLabel, tipo === t.value && { color: t.color }]}>{t.label}</Text>
                  <Text style={styles.optionSub}>{t.sub}</Text>
                </View>
                {tipo === t.value && <Ionicons name="checkmark" size={18} color={t.color} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setActiveSheet(null)}>
              <Text style={styles.sheetCloseBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Sheet: Meta ── */}
      <Modal visible={activeSheet === "meta"} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={styles.sheetOverlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Definir meta</Text>
              <Text style={styles.sheetSubtitle}>¿Cuánto quieres hacer cada vez?</Text>
              <TextInput
                style={styles.metaInput}
                placeholder="Cantidad (ej. 30)"
                placeholderTextColor={colors.neutral[400]}
                value={metaValor}
                onChangeText={setMetaValor}
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.sheetSectionLabel}>Unidad</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[4] }}>
                {UNIDADES_META.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, metaUnidad === u && styles.unitChipSelected]}
                    onPress={() => setMetaUnidad(u)}
                  >
                    <Text style={[styles.unitChipText, metaUnidad === u && styles.unitChipTextSelected]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.sheetConfirmBtn}
                onPress={() => setActiveSheet(null)}
              >
                <Text style={styles.sheetConfirmText}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[100] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: {
    flex: 1, textAlign: "center",
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.neutral[900],
  },
  saveBtn: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
  },
  saveBtnDisabled: { backgroundColor: colors.neutral[200] },
  saveBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: "#fff",
  },

  // Preview card
  previewCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius["2xl"],
    padding: spacing[6],
    alignItems: "center",
    marginTop: spacing[4],
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  previewIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
    marginBottom: spacing[3],
  },
  previewNombre: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[2],
    textAlign: "center",
  },
  previewBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  previewBadgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },

  // Section label
  sectionLabel: {
    fontSize: 11, fontWeight: typography.weight.semibold,
    color: colors.neutral[500],
    marginTop: spacing[5], marginBottom: spacing[2],
    paddingHorizontal: spacing[2],
    letterSpacing: 0.6,
  },

  // Card
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  divider: { height: 1, backgroundColor: colors.neutral[100], marginLeft: 56 },

  // Row (iOS settings style)
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    minHeight: 52,
  },
  rowLast: {},
  rowIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
    marginRight: spacing[3],
  },
  rowLabel: {
    flex: 1, fontSize: typography.size.base, color: colors.neutral[800],
  },
  rowRight: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  rowValue: {
    fontSize: typography.size.sm, color: colors.neutral[500], maxWidth: 120,
  },

  // Input inline
  inputRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    minHeight: 52,
  },
  inputInline: {
    flex: 1, fontSize: typography.size.base, color: colors.neutral[900],
    marginLeft: spacing[3],
    paddingTop: 0,
  },
  inputMultiline: { minHeight: 60 },

  // Info card
  infoCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
    padding: spacing[4], gap: spacing[3],
    marginTop: spacing[4], marginBottom: spacing[4],
  },
  infoText: { flex: 1, fontSize: typography.size.sm, color: colors.neutral[600], lineHeight: 20 },
  infoHighlight: { fontWeight: typography.weight.bold, color: colors.primary[700] },

  // Create button
  createBtn: { borderRadius: radius.xl, overflow: "hidden", ...shadows.md, shadowColor: colors.primary[600] },
  createBtnDisabled: { shadowOpacity: 0 },
  createBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: spacing[5], gap: spacing[2],
  },
  createBtnText: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: "#fff" },

  // Sheet base
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing[5], paddingBottom: spacing[8],
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: colors.neutral[300],
    borderRadius: 2, alignSelf: "center", marginBottom: spacing[4],
  },
  sheetTitle: {
    fontSize: typography.size.xl, fontWeight: typography.weight.bold,
    color: colors.neutral[900], marginBottom: spacing[4],
  },
  sheetSubtitle: { fontSize: typography.size.sm, color: colors.neutral[500], marginBottom: spacing[3] },
  sheetSectionLabel: {
    fontSize: typography.size.sm, fontWeight: typography.weight.semibold,
    color: colors.neutral[600], marginBottom: spacing[2],
  },
  sheetCloseBtn: {
    marginTop: spacing[4], paddingVertical: spacing[4],
    backgroundColor: colors.neutral[100], borderRadius: radius.xl, alignItems: "center",
  },
  sheetCloseBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.neutral[600] },
  sheetConfirmBtn: {
    paddingVertical: spacing[4],
    backgroundColor: colors.primary[600], borderRadius: radius.xl, alignItems: "center",
  },
  sheetConfirmText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: "#fff" },

  // Color grid
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3], marginBottom: spacing[2] },
  colorSwatch: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "transparent",
  },
  colorSwatchSelected: { borderColor: colors.neutral[900] },

  // Icon grid
  iconGrid: { paddingBottom: spacing[4] },
  iconOption: {
    flex: 1, aspectRatio: 1, margin: 4,
    justifyContent: "center", alignItems: "center",
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: "transparent",
    backgroundColor: colors.neutral[50],
  },

  // Frequency / tipo options
  optionRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: spacing[4], borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  optionRowLast: { borderBottomWidth: 0 },
  optionLabel: { flex: 1, fontSize: typography.size.base, color: colors.neutral[700], marginLeft: spacing[3] },
  optionLabelSelected: { color: colors.primary[600], fontWeight: typography.weight.semibold },
  optionSub: { fontSize: typography.size.xs, color: colors.neutral[400], marginTop: 2 },

  // Meta
  metaInput: {
    borderWidth: 1.5, borderColor: colors.primary[300],
    borderRadius: radius.lg, paddingHorizontal: spacing[4],
    paddingVertical: spacing[3], fontSize: typography.size.lg,
    color: colors.neutral[900], marginBottom: spacing[4],
  },
  unitChip: {
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    backgroundColor: colors.neutral[100], borderRadius: radius.full,
    marginRight: spacing[2], borderWidth: 1.5, borderColor: "transparent",
  },
  unitChipSelected: { backgroundColor: colors.primary[50], borderColor: colors.primary[500] },
  unitChipText: { fontSize: typography.size.sm, color: colors.neutral[600] },
  unitChipTextSelected: { color: colors.primary[700], fontWeight: typography.weight.semibold },

});
