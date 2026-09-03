import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-gray-700">{label}</Text>}
      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-base"
        placeholderTextColor="#9ca3af"
        {...props}
      />
    </View>
  );
}
