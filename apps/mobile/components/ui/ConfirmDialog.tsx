import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Botón de confirmar en rojo (acción destructiva). */
  destructive?: boolean;
  /** Muestra spinner en el botón de confirmar mientras se procesa. */
  loading?: boolean;
  /** Mensaje de error opcional, se muestra en rojo debajo del texto. */
  errorMessage?: string;
  /** Oculta el botón de cancelar (modo aviso/informativo de un solo botón). */
  hideCancel?: boolean;
}

/** Diálogo de confirmación centrado, con el estilo del sistema de diseño. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  errorMessage,
  hideCancel = false,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View
          className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 gap-3"
          style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } }}
        >
          <Text className="text-xl font-bold text-on-surface">{title}</Text>
          <Text className="text-sm text-on-surface-variant leading-5">{message}</Text>
          {!!errorMessage && <Text className="text-sm text-error">{errorMessage}</Text>}

          <View className="flex-row gap-3 mt-3">
            {!hideCancel && (
              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                activeOpacity={0.8}
                className="flex-1 h-12 rounded-full border border-outline-variant items-center justify-center"
              >
                <Text className="text-on-surface font-bold text-sm">{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
              className={`flex-1 h-12 rounded-full items-center justify-center ${destructive ? 'bg-error' : 'bg-primary'}`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-sm">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
