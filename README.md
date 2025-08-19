## BEFORE YOU START

RUN ALL THIS COMMANDS TO INSTALL AL THE DEPENDENCIES:
FROM FOLDER RUN:
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend> npm install expo
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend> npm install -g expo-cli                                                              
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend> npm install react-native-circular-progress-indicator      
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend> npm install expo@latest                                                              
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend> npx expo install @react-navigation/native @react-navigation/stack react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-community/masked-view
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend> npm install @react-native-async-storage/async-storage                                

AND TO START THE PROYECT:
## IMPORTANTEEEEEEE

PARA CORRER BACKEND:
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Backend> python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000                    
PARA CORRER FRONTEND:
PS C:\Users\ferbe\OneDrive\Documentos\TASKPIN\Taskpin\Frontend\MATH.M1M> npx expo start