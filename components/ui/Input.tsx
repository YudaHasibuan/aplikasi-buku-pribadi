import { useState } from 'react';
import { Platform, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { fonts, radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  icon?: IconSymbolName;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Labelled text field with a focus ring, matching the card surfaces. */
export function Input({ label, hint, icon, required, containerStyle, multiline, style, onFocus, onBlur, ...rest }: InputProps) {
  const { theme: t } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: space.sm }}>
          <AppText variant="label" color={t.textSecondary}>{label}</AppText>
          {required ? <AppText variant="label" color={t.danger}>*</AppText> : null}
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: t.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: focused ? t.accent : t.border,
          paddingHorizontal: space.lg,
          minHeight: multiline ? 120 : 52,
          gap: space.md,
        }}
      >
        {icon ? (
          <IconSymbol name={icon} size={20} color={focused ? t.accent : t.textMuted} style={multiline ? { marginTop: 16 } : undefined} />
        ) : null}
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={t.textMuted}
          selectionColor={t.accent}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[
            {
              flex: 1,
              color: t.text,
              fontFamily: fonts.sans.medium,
              fontSize: 15,
              paddingVertical: multiline ? 14 : 0,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            // Web: the container draws the focus ring, so hide the browser outline.
            Platform.OS === 'web' ? { outlineWidth: 0 } : null,
            style,
          ]}
        />
      </View>
      {hint ? (
        <AppText variant="caption" color={t.textMuted} style={{ marginTop: space.sm }}>{hint}</AppText>
      ) : null}
    </View>
  );
}
