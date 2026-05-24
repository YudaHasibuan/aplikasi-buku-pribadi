import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getSetting, setSetting, getAllBooks, getCollections } from '@/database/db';
import { useFocusEffect } from 'expo-router';
import { useTheme, themes } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
  const { theme: t, setThemeId } = useTheme();
  const [name, setName] = useState('Pembaca Setia');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadProfile = async () => {
        const savedName = await getSetting('userName', 'Pembaca Setia');
        const savedAvatar = await getSetting('userAvatar', '');
        if (isActive) {
          setName(savedName);
          setTempName(savedName);
          if (savedAvatar) setAvatar(savedAvatar);
        }
      };
      loadProfile();
      return () => { isActive = false; };
    }, [])
  );

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await setSetting('userName', tempName);
      setName(tempName);
    }
    setIsEditingName(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await setSetting('userAvatar', uri);
    }
  };

  const handleExportJson = async () => {
    try {
      const books = await getAllBooks();
      const collections = await getCollections();
      const backupData = { exportedAt: new Date().toISOString(), books, collections };
      const jsonString = JSON.stringify(backupData, null, 2);
      const fileUri = FileSystem.documentDirectory + 'my_library_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

      try {
        const Sharing = require('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Backup Perpustakaan' });
        } else {
          Alert.alert('Sukses', 'File backup tersimpan di storage internal.');
        }
      } catch (e) {
        Alert.alert('Sukses', 'File backup tersimpan di: ' + fileUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal melakukan export data.');
    }
  };

  const themeList = Object.values(themes);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>Pengaturan Akun</Text>
          <Text style={{ color: t.text, fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 }}>Profil & Tema</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.accentBorder, shadowColor: t.shadow, marginHorizontal: 24, marginBottom: 28, flexDirection: 'row', alignItems: 'center', padding: 20 }]}>
          <Pressable style={{ position: 'relative', marginRight: 20 }} onPress={pickImage}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: t.accent }} />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.accentLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: t.accent }}>
                <IconSymbol name="person.fill" size={32} color={t.accent} />
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: t.accent, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: t.card }}>
              <IconSymbol name="camera.fill" size={11} color="#fff" />
            </View>
          </Pressable>

          <View style={{ flex: 1 }}>
            {isEditingName ? (
              <TextInput
                style={{ fontSize: 20, fontWeight: 'bold', color: t.text, borderBottomWidth: 2, borderBottomColor: t.accent, paddingVertical: 2 }}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                onSubmitEditing={handleSaveName}
                onBlur={handleSaveName}
              />
            ) : (
              <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setIsEditingName(true)}>
                <Text style={{ color: t.text, fontSize: 20, fontWeight: 'bold', marginRight: 8 }}>{name}</Text>
                <IconSymbol name="pencil" size={16} color={t.accent} />
              </Pressable>
            )}
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>Ketuk ikon 📷 untuk ganti foto</Text>
          </View>
        </View>

        {/* Theme Switcher */}
        <Text style={{ paddingHorizontal: 24, color: t.textSecondary, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 14 }}>
          Pilih Tema Aplikasi
        </Text>
        <View style={{ paddingHorizontal: 24, gap: 10, marginBottom: 28 }}>
          {themeList.map((theme) => {
            const isActive = t.id === theme.id;
            return (
              <Pressable
                key={theme.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: t.card,
                    borderColor: isActive ? theme.accent : t.accentBorder,
                    shadowColor: t.shadow,
                    borderWidth: isActive ? 2 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                  }
                ]}
                onPress={() => setThemeId(theme.id)}
              >
                {/* Color Preview Dots */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 6 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.bg, borderWidth: 1, borderColor: '#e2e8f0' }} />
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent }} />
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.accentLight }} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
                    {theme.emoji} {theme.name}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>
                    {theme.isDark ? 'Mode Gelap' : 'Mode Terang'} · Aksen {theme.accent}
                  </Text>
                </View>

                {isActive && (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center' }}>
                    <IconSymbol name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Data & Backup */}
        <Text style={{ paddingHorizontal: 24, color: t.textSecondary, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 14 }}>
          Data & Backup
        </Text>
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.accentBorder, shadowColor: t.shadow, marginHorizontal: 24, marginBottom: 28 }]}>
          <Pressable style={styles.settingRow} onPress={handleExportJson}>
            <View style={[styles.iconBox, { backgroundColor: t.accentLight }]}>
              <IconSymbol name="arrow.down.doc.fill" size={20} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>Export Data (JSON)</Text>
              <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>Backup seluruh koleksi buku Anda</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={t.textMuted} />
          </Pressable>
          <View style={{ height: 1, backgroundColor: t.accentBorder, marginLeft: 68 }} />
          <Pressable style={styles.settingRow} onPress={() => Alert.alert('Info', 'Fitur restore akan segera tersedia!')}>
            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
              <IconSymbol name="arrow.up.doc.fill" size={20} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>Restore Data</Text>
              <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>Kembalikan dari file backup</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={t.textMuted} />
          </Pressable>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>MyApp v1.0.0</Text>
          <Text style={{ color: t.textMuted, fontSize: 11 }}>Dibuat dengan ❤️ untuk pembaca</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});
