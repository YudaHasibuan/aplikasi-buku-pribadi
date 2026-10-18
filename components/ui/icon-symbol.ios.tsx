import { SymbolView } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconSymbolProps } from './icon-symbol';

/** iOS: renders the SF Symbol natively. See icon-symbol.tsx for the shared name list. */
export function IconSymbol({ name, size = 24, color, style, weight = 'medium' }: IconSymbolProps) {
  return (
    <SymbolView
      weight={weight}
      tintColor={typeof color === 'string' ? color : undefined}
      resizeMode="scaleAspectFit"
      name={name}
      style={[{ width: size, height: size }, style as StyleProp<ViewStyle>]}
    />
  );
}
