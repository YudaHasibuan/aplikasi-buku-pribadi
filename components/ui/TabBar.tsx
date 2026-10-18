import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from './AppText';
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { PressableScale } from './PressableScale';
import { radius, shadow, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

export const TAB_BAR_HEIGHT = 66;
export const TAB_BAR_MARGIN = 14;

/** Bottom padding a scrollable tab screen needs so content clears the floating bar. */
export function useTabBarPadding() {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_MARGIN + TAB_BAR_HEIGHT + space['2xl'];
}

/**
 * Structural subset of React Navigation's BottomTabBarProps. Typed loosely so
 * the component accepts the props from both expo-router and
 * @react-navigation/bottom-tabs without version coupling.
 */
export interface TabBarProps {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string; tabBarButtonTestID?: string } }>;
  navigation: {
    emit: (event: { type: 'tabPress'; target?: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
}

export interface TabIconConfig {
  icon: IconSymbolName;
  activeIcon?: IconSymbolName;
  label: string;
}

/**
 * Floating pill tab bar. The active tab expands into a tinted capsule with
 * its label; inactive tabs show only their icon.
 */
export function FloatingTabBar({ state, descriptors, navigation, icons }: TabBarProps & { icons: Record<string, TabIconConfig> }) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  const useBlur = Platform.OS === 'ios';

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + TAB_BAR_MARGIN }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: useBlur ? (t.isDark ? 'rgba(20,26,46,0.72)' : 'rgba(255,255,255,0.72)') : t.surface,
            borderColor: t.border,
            ...shadow(t.shadow, 4),
          },
        ]}
      >
        {useBlur ? <BlurView intensity={40} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const cfg = icons[route.name] ?? { icon: 'house.fill', label: route.name };
          const iconName = focused ? (cfg.activeIcon ?? cfg.icon) : cfg.icon;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <PressableScale
              key={route.key}
              onPress={onPress}
              feedback="selection"
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? cfg.label}
              testID={options.tabBarButtonTestID}
              style={[
                styles.item,
                focused ? { flexGrow: 1.9, backgroundColor: t.accentSoft } : { flexGrow: 1 },
              ]}
            >
              <IconSymbol name={iconName} size={22} color={focused ? t.accent : t.textMuted} />
              {focused ? (
                <Animated.View entering={FadeIn.duration(160)}>
                  <AppText variant="label" weight="bold" color={t.accentText} numberOfLines={1}>
                    {cfg.label}
                  </AppText>
                </Animated.View>
              ) : null}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    height: TAB_BAR_HEIGHT,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    gap: 4,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    flexBasis: 0,
  },
});
