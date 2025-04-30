import React from 'react';
import { ActivityIndicator, ViewStyle } from 'react-native';
import { Button, ButtonProps } from './Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export interface LoadingButtonProps extends Omit<ButtonProps, 'children'> {
  loading?: boolean;
  children: string | React.ReactNode;
  style?: ViewStyle;
}

export function LoadingButton({ loading, children, ...props }: LoadingButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Button
      {...props}
      disabled={props.disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={props.variant === 'outline' ? colors.primary : colors.background} 
        />
      ) : (
        children
      )}
    </Button>
  );
}
