import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

export default function ConfiguracionScreen() {
  const router = useRouter();
  
  // Estados para los datos del usuario
  const [userData, setUserData] = useState({
    user_id: '',
    nombre: '',
    correo: '',
  });
  
  // Estados para edición
  const [editingField, setEditingField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false); // Nuevo estado para modal de logout

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [user_id, nombre, correo] = await AsyncStorage.multiGet([
        'user_id',
        'nombre', 
        'correo'
      ]);

      setUserData({
        user_id: user_id[1] || '',
        nombre: nombre[1] || 'Usuario',
        correo: correo[1] || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    setModalVisible(true);
  };

  const saveChanges = async () => {
    if (!editValue.trim()) {
      Alert.alert("Error", "El campo no puede estar vacío");
      return;
    }

    // Validación específica por campo
    if (editingField === 'correo') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        Alert.alert("Error", "Formato de correo inválido");
        return;
      }
    }

    if (editingField === 'nombre' && editValue.trim().length < 2) {
      Alert.alert("Error", "El nombre debe tener al menos 2 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para actualizar
      const updateData: any = {};
      updateData[editingField] = editValue.trim();

      // Hacer petición al backend
      await axios.put(`http://127.0.0.1:8000/api/usuario/${userData.user_id}`, updateData);

      // Actualizar estado local
      const newUserData = { ...userData };
      newUserData[editingField as keyof typeof userData] = editValue.trim();
      setUserData(newUserData);

      // Actualizar AsyncStorage
      await AsyncStorage.setItem(editingField, editValue.trim());

      Alert.alert("Éxito", "Datos actualizados correctamente");
      setModalVisible(false);
      setEditingField('');
      setEditValue('');

    } catch (error: any) {
      console.error('Error updating user data:', error);
      
      let errorMessage = "Error al actualizar datos";
      if (error.response?.status === 400) {
        errorMessage = "El correo electrónico ya está en uso";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Simplemente abrir el modal de confirmación
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLoading(true);
    try {
      console.log("Cerrando sesión...");
      
      // Limpiar TODOS los datos del AsyncStorage
      await AsyncStorage.clear();
      console.log("AsyncStorage limpiado");
      
      // Cerrar modal
      setLogoutModalVisible(false);
      
      // Navegar al inicio de la app
      router.replace("/inicio");
      console.log("Navegación completada");
      
    } catch (error) {
      console.error('Error during logout:', error);
      setLogoutModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    // Navegar de regreso a la pestaña de perfil
    router.push("/(tabs)/perfil");
  };

  const getFieldDisplayName = (field: string) => {
    switch (field) {
      case 'nombre': return 'Nombre';
      case 'correo': return 'Correo Electrónico';
      default: return field;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header con botón de regreso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Avatar y nombre */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#8B5CF6" />
          </View>
          <Text style={styles.userName}>{userData.nombre}</Text>
          <Text style={styles.userEmail}>{userData.correo}</Text>
        </View>

        {/* Sección de información personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          {/* Nombre */}
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.label}>NOMBRE COMPLETO</Text>
              <Text style={styles.value}>{userData.nombre}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => startEditing('nombre', userData.nombre)}
            >
              <Ionicons name="create-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {/* Correo */}
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <Text style={styles.value}>{userData.correo}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => startEditing('correo', userData.correo)}
            >
              <Ionicons name="create-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de preferencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.label}>NOTIFICACIONES</Text>
              <Text style={styles.subtitle}>Recordatorios de hábitos y planes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.label}>TEMA</Text>
              <Text style={styles.subtitle}>Apariencia de la aplicación</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sección de cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.label}>CAMBIAR CONTRASEÑA</Text>
              <Text style={styles.subtitle}>Actualizar tu contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.label}>PRIVACIDAD</Text>
              <Text style={styles.subtitle}>Configuración de datos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Botón de cerrar sesión */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modal para cerrar sesión */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.logoutModalHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={styles.logoutModalTitle}>¿Cerrar Sesión?</Text>
              <Text style={styles.logoutModalMessage}>
                ¿Estás seguro que deseas cerrar sesión?{'\n'}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmButton, loading && styles.logoutConfirmButtonDisabled]}
                onPress={confirmLogout}
                disabled={loading}
              >
                <Text style={styles.logoutConfirmText}>
                  {loading ? 'Cerrando...' : 'Sí, cerrar sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar {getFieldDisplayName(editingField)}</Text>
            
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Ingresa tu ${getFieldDisplayName(editingField).toLowerCase()}`}
              placeholderTextColor="#9CA3AF"
              keyboardType={editingField === 'correo' ? 'email-address' : 'default'}
              autoCapitalize={editingField === 'correo' ? 'none' : 'words'}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setEditingField('');
                  setEditValue('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}
                onPress={saveChanges}
                disabled={loading}
              >
                <Text style={styles.modalSaveText}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Text>
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
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#FFFFFF",
    marginTop: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#6B7280",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  editButton: {
    padding: 8,
  },
  logoutSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#EF4444",
    marginLeft: 8,
  },
  bottomSpace: {
    height: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#E0E7FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6366F1",
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Estilos específicos para el modal de logout
  logoutModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 12,
  },
  logoutModalMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutConfirmButtonDisabled: {
    backgroundColor: "#F87171",
  },
  logoutConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});