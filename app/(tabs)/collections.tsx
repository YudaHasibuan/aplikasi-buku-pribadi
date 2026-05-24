import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCollections, addCollection, deleteCollection, Collection, initDb } from '@/database/db';
import { useFocusEffect, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function CollectionsScreen() {
  const { theme: t } = useTheme();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchCollections = async () => {
        try {
          await initDb();
          const data = await getCollections();
          if (isActive) setCollections(data);
        } catch (error) {
          console.error('Failed to fetch collections', error);
        }
      };
      fetchCollections();
      return () => { isActive = false; };
    }, [])
  );

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) { Alert.alert('Error', 'Nama rak tidak boleh kosong.'); return; }
    try {
      await addCollection(newCollectionName, newCollectionDesc);
      const data = await getCollections();
      setCollections(data);
      setModalVisible(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
    } catch (error) {
      Alert.alert('Error', 'Gagal membuat rak baru.');
    }
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    Alert.alert('Hapus Rak Buku', 'Yakin ingin menghapus rak ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteCollection(id); setCollections(await getCollections()); } }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>
          <View>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>Kelompokkan Buku Anda</Text>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 }}>Koleksi & Rak</Text>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 6, shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }} onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus.circle.fill" size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Rak Baru</Text>
          </Pressable>
        </View>

        {collections.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40, backgroundColor: t.card, marginHorizontal: 24, borderRadius: 24, paddingVertical: 40, borderWidth: 1, borderColor: t.accentBorder, shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <IconSymbol name="folder" size={40} color={t.accent} />
            </View>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>Belum Ada Rak</Text>
            <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>Buat rak kustom pertama Anda untuk menyortir buku.</Text>
            <Pressable style={{ backgroundColor: t.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 24 }} onPress={() => setModalVisible(true)}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Buat Rak Sekarang</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 24, gap: 16 }}>
            {collections.map((col) => (
              <Pressable key={col.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: t.accentBorder, shadowColor: t.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }} onPress={() => router.push(`/collection/${col.id}`)}>
                <View style={{ width: 56, height: 56, backgroundColor: t.accentLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <IconSymbol name="folder" size={28} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 }} numberOfLines={1}>{col.name}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: '600' }}>{col.bookCount || 0} Buku Terdaftar</Text>
                </View>
                <Pressable onPress={() => handleDelete(col.id)} style={{ padding: 8 }}>
                  <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal animationType="fade" transparent visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: t.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: t.accentBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 }}>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>Buat Rak Baru</Text>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Nama Rak *</Text>
            <TextInput style={{ backgroundColor: t.bg, color: t.text, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: t.accentBorder, fontSize: 16, marginBottom: 20, outlineStyle: 'none' } as any} value={newCollectionName} onChangeText={setNewCollectionName} placeholder="Contoh: Kuliah, Novel Favorit..." placeholderTextColor={t.textMuted} />
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Deskripsi (Opsional)</Text>
            <TextInput style={{ backgroundColor: t.bg, color: t.text, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: t.accentBorder, fontSize: 16, marginBottom: 20, minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none' } as any} value={newCollectionDesc} onChangeText={setNewCollectionDesc} placeholder="Berikan penjelasan singkat..." placeholderTextColor={t.textMuted} multiline numberOfLines={3} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg }} onPress={() => setModalVisible(false)}>
                <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: '600' }}>Batal</Text>
              </Pressable>
              <Pressable style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: t.accent }} onPress={handleAddCollection}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Simpan Rak</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
