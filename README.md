## 🚀 Before You Start

Follow these steps to install all the necessary dependencies:

### 📂 Navigate to the Frontend Folder:
```bash
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend>
```

### 📦 Install Dependencies:
1. Install Expo:
    ```bash
    npm install expo
    ```
2. Install Expo CLI globally:
    ```bash
    npm install -g expo-cli
    ```
3. Install React Native Circular Progress Indicator:
    ```bash
    npm install react-native-circular-progress-indicator
    ```
4. Update Expo to the latest version:
    ```bash
    npm install expo@latest
    ```
5. Install React Navigation and related dependencies:
    ```bash
    npx expo install @react-navigation/native @react-navigation/stack react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-community/masked-view
    ```
6. Install Async Storage:
    ```bash
    npm install @react-native-async-storage/async-storage
    ```

---

## ⚡ Starting the Project

### 🖥️ Backend:
Run the following command to start the backend:
```bash
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Backend> python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 📱 Frontend:
Run the following command to start the frontend:
```bash
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend\MATH.M1M> npx expo start
```

---

### 💡 Tips:
- Make sure all dependencies are installed before starting the project.
- Use the correct folder paths as shown above.

Happy coding! 🎉