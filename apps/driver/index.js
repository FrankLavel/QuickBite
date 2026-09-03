import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App)
// y configura el entorno (Expo Go / build nativo).
registerRootComponent(App);
