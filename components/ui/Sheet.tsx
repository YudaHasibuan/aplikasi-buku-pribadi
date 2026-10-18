import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { AppText } from './AppText';
import { IconButton } from './Button';
import { gutter, radius, shadow, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Let the content scroll when taller than the screen. */
  scroll?: boolean;
}

/**
 * Bottom sheet dialog with a dimmed backdrop. Replaces the old centred
 * modals so forms feel native on phones and stay centred on wide screens.
 */
export function Sheet({ visible, onClose, title, subtitle, children, scroll = false }: SheetProps) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: t.overlay }} accessibilityLabel="Tutup" />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxWidth: 560 }}>
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(220)}
            exiting={SlideOutDown.duration(200)}
            style={{
              backgroundColor: t.surface,
              borderTopLeftRadius: radius['2xl'],
              borderTopRightRadius: radius['2xl'],
              paddingHorizontal: gutter,
              paddingTop: space.md,
              paddingBottom: Math.max(insets.bottom, space.xl) + space.sm,
              maxHeight: '88%',
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: t.border,
              ...shadow(t.shadow, 4),
            }}
          >
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.borderStrong, marginBottom: space.lg }} />
            {(title || subtitle) ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space.xl }}>
                <View style={{ flex: 1, paddingRight: space.md }}>
                  {title ? <AppText variant="heading" serif weight="semibold">{title}</AppText> : null}
                  {subtitle ? <AppText variant="body" color={t.textSecondary} style={{ marginTop: 4 }}>{subtitle}</AppText> : null}
                </View>
                <IconButton icon="xmark" onPress={onClose} size={34} iconSize={16} accessibilityLabel="Tutup" />
              </View>
            ) : null}
            {scroll ? (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
            ) : (
              children
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
