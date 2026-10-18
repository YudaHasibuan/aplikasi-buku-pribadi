import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { AppText } from './AppText';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { radius, shadow, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { haptic } from '@/lib/haptics';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

const icons: Record<ToastType, IconSymbolName> = {
  success: 'checkmark.circle.fill',
  error: 'exclamationmark.triangle.fill',
  info: 'info.circle.fill',
};

/** Lightweight in-app notifications that replace blocking "Sukses" alerts. */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(({ message, type = 'success', duration = 2600 }: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    if (type === 'success') haptic.success();
    else if (type === 'error') haptic.error();
    setToast({ id: Date.now(), message, type, duration });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toast={toast} />
    </ToastContext.Provider>
  );
};

function ToastHost({ toast }: { toast: (ToastOptions & { id: number }) | null }) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  if (!toast) return null;

  const type = toast.type ?? 'success';
  const color = type === 'success' ? t.success : type === 'error' ? t.danger : t.info;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + (Platform.OS === 'web' ? 16 : 8), left: 0, right: 0, alignItems: 'center', zIndex: 1000 }}>
      <Animated.View
        key={toast.id}
        entering={FadeInUp.springify().damping(18)}
        exiting={FadeOutUp.duration(180)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          maxWidth: 420,
          marginHorizontal: space['2xl'],
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          borderRadius: radius.lg,
          backgroundColor: t.isDark ? t.surfaceAlt : t.text,
          ...shadow('#000', 4),
        }}
      >
        <IconSymbol name={icons[type]} size={20} color={color} />
        <AppText variant="body" weight="semibold" color={t.isDark ? t.text : t.bg} style={{ flexShrink: 1 }}>
          {toast.message}
        </AppText>
      </Animated.View>
    </View>
  );
}

export const useToast = () => useContext(ToastContext);
