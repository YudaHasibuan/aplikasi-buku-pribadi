import { useCallback, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShelfCard } from '@/components/ShelfCard';
import { AppText, Button, Card, EmptyState, IconButton, IconSymbol, Input, PressableScale, Screen, ScreenHeader, Sheet, useTabBarPadding, useToast } from '@/components/ui';
import { gutter, radius, space } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { addCollection, deleteCollection, getBooksByCollection, getCollections, initDb, updateCollection, type Book, type Collection } from '@/database/db';
import { confirmAsync, notify } from '@/lib/dialogs';

const MAX_CONTENT_WIDTH = 1000;

export default function CollectionsScreen() {
  const { theme: t } = useTheme();
  const toast = useToast();
  const bottomPad = useTabBarPadding();
  const { width: windowWidth } = useWindowDimensions();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [previews, setPreviews] = useState<Record<number, Book[]>>({});
  const [loaded, setLoaded] = useState(false);

  const [editor, setEditor] = useState<{ mode: 'create' } | { mode: 'edit'; collection: Collection } | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [menuFor, setMenuFor] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    await initDb();
    const cols = await getCollections();
    const entries = await Promise.all(cols.map(async (c) => [c.id!, await getBooksByCollection(c.id!)] as const));
    setCollections(cols);
    setPreviews(Object.fromEntries(entries));
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => console.error('Failed to load collections', e));
    }, [load])
  );

  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const columns = contentWidth >= 820 ? 3 : 2;
  const gap = space.lg;
  const cardWidth = Math.floor((contentWidth - gutter * 2 - gap * (columns - 1)) / columns);
  const totalBooks = collections.reduce((a, c) => a + (c.bookCount ?? 0), 0);

  const openCreate = () => { setName(''); setDesc(''); setEditor({ mode: 'create' }); };
  const openEdit = (c: Collection) => { setMenuFor(null); setName(c.name); setDesc(c.description ?? ''); setEditor({ mode: 'edit', collection: c }); };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) { notify('Nama rak kosong', 'Beri nama untuk rak ini terlebih dahulu.'); return; }
    if (!editor) return;
    setSaving(true);
    try {
      if (editor.mode === 'create') {
        await addCollection(trimmed, desc.trim());
        toast.show({ message: `Rak “${trimmed}” dibuat` });
      } else {
        await updateCollection(editor.collection.id!, trimmed, desc.trim());
        toast.show({ message: 'Rak diperbarui' });
      }
      setEditor(null);
      await load();
    } catch {
      notify('Gagal', 'Rak tidak dapat disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Collection) => {
    setMenuFor(null);
    const ok = await confirmAsync({ title: `Hapus rak “${c.name}”?`, message: 'Buku di dalamnya tetap tersimpan di perpustakaan Anda.', confirmText: 'Hapus', destructive: true });
    if (!ok) return;
    await deleteCollection(c.id!);
    toast.show({ message: 'Rak dihapus', type: 'info' });
    await load();
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad, alignSelf: 'center', width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
        <ScreenHeader
          eyebrow="Kelompokkan koleksi"
          title="Rak Buku"
          right={<IconButton icon="plus" onPress={openCreate} background={t.accent} color={t.onAccent} size={44} iconSize={22} accessibilityLabel="Buat rak baru" style={{ borderColor: 'transparent' }} />}
        />

        {collections.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: gutter, marginBottom: space['2xl'] }}>
            <Card variant="soft" padding={space.lg} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}><IconSymbol name="folder.fill" size={20} color={t.accent} /></View>
              <View><AppText variant="heading" serif weight="semibold">{collections.length}</AppText><AppText variant="caption" color={t.textMuted}>Rak</AppText></View>
            </Card>
            <Card variant="soft" padding={space.lg} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}><IconSymbol name="books.vertical.fill" size={20} color={t.accent} /></View>
              <View><AppText variant="heading" serif weight="semibold">{totalBooks}</AppText><AppText variant="caption" color={t.textMuted}>Buku tersusun</AppText></View>
            </Card>
          </View>
        ) : null}

        {loaded && collections.length === 0 ? (
          <EmptyState
            icon="folder.fill"
            title="Belum ada rak"
            description="Rak membantu Anda mengelompokkan buku: Favorit, Wishlist, Tugas Kuliah, atau apa pun yang Anda mau."
            actionLabel="Buat Rak Pertama"
            onAction={openCreate}
          />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingHorizontal: gutter }}>
            {collections.map((c, i) => (
              <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i, 6) * 50).duration(350)}>
                <ShelfCard
                  collection={c}
                  previews={previews[c.id!] ?? []}
                  width={cardWidth}
                  onPress={() => router.push({ pathname: '/collection/[id]', params: { id: String(c.id) } })}
                  onMore={() => setMenuFor(c)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create / edit sheet */}
      <Sheet visible={editor !== null} onClose={() => setEditor(null)} title={editor?.mode === 'edit' ? 'Ubah Rak' : 'Rak Baru'} subtitle="Beri nama yang mudah diingat.">
        <View style={{ gap: space.lg }}>
          <Input label="Nama rak" required icon="folder.fill" placeholder="Contoh: Novel Favorit, Wishlist…" value={name} onChangeText={setName} autoFocus returnKeyType="done" onSubmitEditing={save} />
          <Input label="Deskripsi" icon="text.alignleft" placeholder="Opsional" value={desc} onChangeText={setDesc} />
          <Button label={editor?.mode === 'edit' ? 'Simpan Perubahan' : 'Buat Rak'} icon="checkmark" size="lg" fullWidth loading={saving} onPress={save} style={{ marginTop: space.sm }} />
        </View>
      </Sheet>

      {/* Shelf options sheet */}
      <Sheet visible={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.name} subtitle={`${menuFor?.bookCount ?? 0} buku`}>
        <View style={{ gap: space.sm }}>
          {[
            { icon: 'arrow.right' as const, label: 'Buka rak', onPress: () => { const c = menuFor!; setMenuFor(null); router.push({ pathname: '/collection/[id]', params: { id: String(c.id) } }); } },
            { icon: 'pencil' as const, label: 'Ubah nama & deskripsi', onPress: () => menuFor && openEdit(menuFor) },
            { icon: 'trash.fill' as const, label: 'Hapus rak', onPress: () => menuFor && remove(menuFor), danger: true },
          ].map((item) => (
            <PressableScale key={item.label} onPress={item.onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.md, backgroundColor: item.danger ? t.dangerSoft : t.surfaceAlt }}>
              <IconSymbol name={item.icon} size={20} color={item.danger ? t.danger : t.accent} />
              <AppText variant="body" weight="semibold" color={item.danger ? t.danger : t.text}>{item.label}</AppText>
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}
