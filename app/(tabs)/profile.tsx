import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getSetting, setSetting, getAllBooks, getCollections } from '@/database/db';
import { useFocusEffect } from 'expo-router';

export default function ProfileScreen() {
  const [name, setName] = useState('Pembaca Setia');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Load profile from settings
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
      
      const backupData = {
        exportedAt: new Date().toISOString(),
        books,
        collections
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileUri = FileSystem.documentDirectory + 'my_library_backup.json';
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Backup Perpustakaan'
        });
      } else {
        Alert.alert('Sukses', 'Data berhasil di-export ke storage internal.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal melakukan export data.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil & Pengaturan</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Pressable style={styles.avatarContainer} onPress={pickImage}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' }]}>
                <IconSymbol name="person.fill" size={40} color="#7C3AED" />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <IconSymbol name="camera.fill" size={12} color="#ffffff" />
            </View>
          </Pressable>
          
          <View style={styles.profileInfo}>
            {isEditingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                  onBlur={handleSaveName}
                />
              </View>
            ) : (
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{name}</Text>
                <Pressable onPress={() => setIsEditingName(true)} style={styles.editNameBtn}>
                  <IconSymbol name="pencil" size={16} color="#7C3AED" />
                </Pressable>
              </View>
            )}
            <Text style={styles.userBio}>Pecinta Buku</Text>
          </View>
        </View>

        {/* Settings Sections */}
        <Text style={styles.sectionTitle}>Data & Backup</Text>
        <View style={styles.settingsGroup}>
          <Pressable style={styles.settingItem} onPress={handleExportJson}>
            <View style={[styles.settingIcon, { backgroundColor: '#EDE9FE' }]}>
              <IconSymbol name="arrow.down.doc.fill" size={20} color="#7C3AED" />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingTitle}>Export Data (JSON)</Text>
              <Text style={styles.settingSubtext}>Backup koleksi buku & rak Anda</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#cbd5e1" />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingItem} onPress={() => Alert.alert('Info', 'Fitur Restore akan segera datang!')}>
            <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
              <IconSymbol name="arrow.up.doc.fill" size={20} color="#d97706" />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingTitle}>Restore Data</Text>
              <Text style={styles.settingSubtext}>Kembalikan dari file backup</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#cbd5e1" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Preferensi</Text>
        <View style={styles.settingsGroup}>
          <Pressable style={styles.settingItem} onPress={() => Alert.alert('Info', 'Notifikasi sedang dalam pengembangan.')}>
            <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
              <IconSymbol name="bell.fill" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingTitle}>Pengingat Baca</Text>
              <Text style={styles.settingSubtext}>Mati</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#cbd5e1" />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: '#e0f2fe' }]}>
              <IconSymbol name="moon.fill" size={20} color="#0284c7" />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingTitle}>Tema Aplikasi</Text>
              <Text style={styles.settingSubtext}>Soft Lavender (Terang)</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>MyApp v1.0.0</Text>
          <Text style={styles.madeWithText}>Dibuat dengan ❤️ untuk pembaca</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { color: '#0f172a', fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 },
  
  profileCard: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarContainer: { position: 'relative', marginRight: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#7C3AED' },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7C3AED',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: { flex: 1, justifyContent: 'center' },
  nameContainer: { flexDirection: 'row', alignItems: 'center' },
  userName: { color: '#0f172a', fontSize: 20, fontWeight: 'bold', marginRight: 8 },
  editNameBtn: { padding: 4 },
  editNameContainer: { marginBottom: 4 },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#7C3AED',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 150,
  },
  userBio: { color: '#64748b', fontSize: 14, marginTop: 4 },

  sectionTitle: { paddingHorizontal: 24, color: '#475569', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  settingsGroup: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingTextContent: { flex: 1 },
  settingTitle: { color: '#0f172a', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  settingSubtext: { color: '#64748b', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 72 },
  
  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  versionText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  madeWithText: { color: '#cbd5e1', fontSize: 12 },
});
