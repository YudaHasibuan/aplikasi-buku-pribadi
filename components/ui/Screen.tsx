import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenProps {
  children: ReactNode;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
  /** Soft ambient colour blobs behind the content. */
  glow?: boolean;
  /** Override the page background (e.g. 'transparent' over a hero image). */
  background?: string;
}

/**
 * Page container: themed background, safe-area handling and an optional
 * ambient glow that gives every screen a little depth.
 */
export function Screen({ children, edges = ['top'], style, glow = true, background }: ScreenProps) {
  const { theme: t } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: background ?? t.bg }}>
      {glow && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={[t.glow, t.bg]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[styles.blob, { top: -160, right: -120, opacity: t.isDark ? 0.45 : 0.55 }]}
          />
          <LinearGradient
            colors={[t.accentSoft, t.bg]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.blob, { top: 260, left: -200, width: 360, height: 360, opacity: t.isDark ? 0.35 : 0.7 }]}
          />
        </View>
      )}
      <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 999,
  },
});
