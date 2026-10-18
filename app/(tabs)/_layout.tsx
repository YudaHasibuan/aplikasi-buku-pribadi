import { Tabs } from 'expo-router';
import { FloatingTabBar, type TabIconConfig } from '@/components/ui/TabBar';

const TAB_ICONS: Record<string, TabIconConfig> = {
  index: { icon: 'books.vertical.fill', label: 'Pustaka' },
  add: { icon: 'plus.circle.fill', label: 'Tambah' },
  collections: { icon: 'folder', activeIcon: 'folder.fill', label: 'Rak' },
  explore: { icon: 'chart.pie.fill', label: 'Statistik' },
  profile: { icon: 'person.circle.fill', label: 'Profil' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={(props) => <FloatingTabBar {...props} icons={TAB_ICONS} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Pustaka' }} />
      <Tabs.Screen name="add" options={{ title: 'Tambah Buku' }} />
      <Tabs.Screen name="collections" options={{ title: 'Rak Buku' }} />
      <Tabs.Screen name="explore" options={{ title: 'Statistik' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
