import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { radius as radii, shadow } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { coverGradient, titleInitials } from '@/lib/book-utils';

interface BookCoverProps {
  uri?: string | null;
  title: string;
  author?: string;
  width: number;
  /** Height / width. Books are 3:2 by default. */
  aspect?: number;
  radius?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Content layered on top of the cover (badges etc.). */
  children?: ReactNode;
}

/**
 * Book cover with a gradient "designed" fallback: title initials over a
 * deterministic gradient so a library without images still looks curated.
 */
export function BookCover({ uri, title, author, width, aspect = 1.5, radius = radii.md, elevated = true, style, children }: BookCoverProps) {
  const { theme: t } = useTheme();
  const height = Math.round(width * aspect);
  const colors = coverGradient(title);
  const initialsSize = Math.max(14, Math.round(width * 0.3));

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: t.surfaceAlt, ...(elevated ? shadow(t.shadow, 3) : null) },
        style,
      ]}
    >
      <View style={{ flex: 1, borderRadius: radius, overflow: 'hidden' }}>
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
            accessibilityLabel={`Sampul ${title}`}
          />
        ) : (
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: Math.round(width * 0.1), justifyContent: 'space-between' }}>
            {/* Spine highlight */}
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.max(3, width * 0.045), backgroundColor: 'rgba(255,255,255,0.28)' }} />
            <View style={{ position: 'absolute', left: Math.max(3, width * 0.045), top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.18)' }} />
            <AppText serif weight="bold" color="rgba(255,255,255,0.95)" style={{ fontSize: initialsSize, lineHeight: initialsSize * 1.1, letterSpacing: -1, marginLeft: width * 0.04 }}>
              {titleInitials(title)}
            </AppText>
            {width >= 90 ? (
              <View style={{ marginLeft: width * 0.04 }}>
                <AppText variant="caption" weight="bold" color="rgba(255,255,255,0.95)" numberOfLines={2} style={{ fontSize: Math.max(10, width * 0.09), lineHeight: Math.max(13, width * 0.115) }}>
                  {title}
                </AppText>
                {author ? (
                  <AppText variant="caption" color="rgba(255,255,255,0.7)" numberOfLines={1} style={{ fontSize: Math.max(9, width * 0.075), marginTop: 2 }}>
                    {author}
                  </AppText>
                ) : null}
              </View>
            ) : null}
          </LinearGradient>
        )}
        {/* Subtle gloss */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.5 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%' }}
        />
        {children}
      </View>
    </View>
  );
}
