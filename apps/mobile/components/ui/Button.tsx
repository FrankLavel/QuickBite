import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'outline';
}

export function Button({ label, variant = 'primary', ...props }: ButtonProps) {
  return (
    <TouchableOpacity
      className={variant === 'primary' ? 'bg-primary rounded-xl py-3 px-6' : 'border border-primary rounded-xl py-3 px-6'}
      {...props}
    >
      <Text className={variant === 'primary' ? 'text-white font-semibold text-center' : 'text-primary font-semibold text-center'}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
