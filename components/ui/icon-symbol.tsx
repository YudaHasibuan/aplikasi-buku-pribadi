// Fallback for using MaterialIcons on Android and web.
// iOS uses native SF Symbols via icon-symbol.ios.tsx.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { SFSymbol, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * SF Symbol → Material Icon mapping. Keys are validated against the
 * SF Symbols catalogue by TypeScript; values against the Material glyph map.
 * Add new icons here, then use them anywhere via <IconSymbol name="..." />.
 */
export const ICON_MAPPING = {
  'house.fill': 'home',
  'books.vertical.fill': 'library-books',
  'book.fill': 'menu-book',
  'book.closed.fill': 'book',
  'text.book.closed.fill': 'auto-stories',
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'folder': 'folder-open',
  'folder.fill': 'folder',
  'chart.bar.fill': 'bar-chart',
  'chart.pie.fill': 'pie-chart',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'person.fill': 'person',
  'person.circle.fill': 'account-circle',
  'magnifyingglass': 'search',
  'camera.fill': 'photo-camera',
  'photo.fill': 'image',
  'photo.badge.plus': 'add-photo-alternate',
  'barcode.viewfinder': 'qr-code-scanner',
  'doc.fill': 'picture-as-pdf',
  'doc.text.fill': 'description',
  'trash.fill': 'delete',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'star.fill': 'star',
  'star': 'star-border',
  'star.leadinghalf.filled': 'star-half',
  'xmark': 'close',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle',
  'pencil': 'edit',
  'square.and.arrow.up': 'share',
  'arrow.down.doc.fill': 'file-download',
  'arrow.up.doc.fill': 'file-upload',
  'sparkles': 'auto-awesome',
  'bookmark.fill': 'bookmark',
  'clock.fill': 'schedule',
  'pause.circle.fill': 'pause-circle-filled',
  'play.fill': 'play-arrow',
  'flame.fill': 'local-fire-department',
  'quote.opening': 'format-quote',
  'paintpalette.fill': 'palette',
  'gearshape.fill': 'settings',
  'info.circle.fill': 'info',
  'minus': 'remove',
  'text.alignleft': 'notes',
  'tag.fill': 'label',
  'line.3.horizontal.decrease': 'filter-list',
  'slider.horizontal.3': 'tune',
  'eye.fill': 'visibility',
  'moon.fill': 'dark-mode',
  'sun.max.fill': 'light-mode',
  'exclamationmark.triangle.fill': 'warning',
  'bolt.fill': 'bolt',
  'trophy.fill': 'emoji-events',
  'calendar': 'calendar-today',
  'arrow.clockwise': 'refresh',
  'ellipsis': 'more-horiz',
  'square.grid.2x2.fill': 'grid-view',
  'list.bullet': 'view-list',
  'link': 'link',
  'lock.fill': 'lock',
  'globe': 'language',
  'hand.wave.fill': 'waving-hand',
  'lightbulb.fill': 'insights',
  'timer': 'timer',
  'building.columns.fill': 'local-library',
  'medal.fill': 'military-tech',
  'rosette': 'workspace-premium',
  'arrow.up.right.square': 'open-in-new',
  'icloud.and.arrow.up.fill': 'backup',
  'arrow.counterclockwise': 'restore',
} satisfies Partial<Record<SFSymbol, MaterialIconName>>;

export type IconSymbolName = keyof typeof ICON_MAPPING;

export interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on
 * Android and web. Icon names are SF Symbol names mapped above.
 */
export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  return <MaterialIcons color={color} size={size} name={ICON_MAPPING[name]} style={style} />;
}
