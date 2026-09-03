import { View, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ReactNode } from 'react';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Sube el contenido por encima del teclado para no tapar los campos. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={onClose} />
        <View className="bg-surface-container-lowest rounded-t-3xl p-6">{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
