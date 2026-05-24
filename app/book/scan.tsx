import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kami butuh izin kamera Anda untuk melakukan scan ISBN.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Beri Izin</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    setLoading(true);
    
    try {
      // Use OpenLibrary API
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${data}&jscmd=data&format=json`);
      const result = await response.json();
      
      const bookKey = `ISBN:${data}`;
      if (result[bookKey]) {
        const bookData = result[bookKey];
        
        // Parse data safely
        const title = typeof bookData.title === 'string' ? bookData.title : '';
        const author = Array.isArray(bookData.authors) ? bookData.authors.map((a: any) => a.name).join(', ') : '';
        const cover = bookData.cover ? (bookData.cover.large || bookData.cover.medium || '') : '';
        const genre = Array.isArray(bookData.subjects) && bookData.subjects.length > 0 ? bookData.subjects[0].name : '';
        
        let synopsis = '';
        if (typeof bookData.notes === 'string') {
          synopsis = bookData.notes;
        } else if (bookData.notes && typeof bookData.notes.value === 'string') {
          synopsis = bookData.notes.value;
        } else if (typeof bookData.description === 'string') {
          synopsis = bookData.description;
        } else if (bookData.description && typeof bookData.description.value === 'string') {
          synopsis = bookData.description.value;
        }
        
        // Truncate synopsis to avoid URI too long error (max 500 chars)
        if (synopsis.length > 500) {
          synopsis = synopsis.substring(0, 500) + '...';
        }

        Alert.alert(
          'Buku Ditemukan!',
          `${title} by ${author}`,
          [
            { 
              text: 'Batal', 
              style: 'cancel', 
              onPress: () => {
                setScanned(false);
                setLoading(false);
              } 
            },
            { 
              text: 'Gunakan Data', 
              onPress: () => {
                // Navigate back to add screen with safe string params
                router.replace({
                  pathname: '/add',
                  params: { 
                    title: title || '', 
                    author: author || '', 
                    cover: cover || '', 
                    genre: genre || '', 
                    synopsis: synopsis || '' 
                  }
                });
              } 
            }
          ]
        );
      } else {
        Alert.alert('Tidak Ditemukan', 'Buku dengan ISBN ini tidak ditemukan di database.', [
          { text: 'Scan Ulang', onPress: () => { setScanned(false); setLoading(false); } }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal mengambil data buku.', [
        { text: 'OK', onPress: () => { setScanned(false); setLoading(false); } }
      ]);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Scan ISBN',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
        }} 
      />
      <View style={styles.container}>
        <CameraView 
          style={StyleSheet.absoluteFillObject} 
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.focusedContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusFrame} />
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#818cf8" />
            <Text style={styles.loadingText}>Mencari buku...</Text>
          </View>
        )}

        {scanned && !loading && (
          <Pressable style={styles.rescanButton} onPress={() => setScanned(false)}>
            <Text style={styles.rescanButtonText}>Ketuk Untuk Scan Ulang</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#020617' },
  message: { textAlign: 'center', color: '#cbd5e1', paddingBottom: 20, paddingHorizontal: 20 },
  button: { backgroundColor: '#818cf8', padding: 12, borderRadius: 8, alignSelf: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  focusedContainer: {
    flexDirection: 'row',
    height: 250,
  },
  focusFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#818cf8',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#f8fafc', marginTop: 16, fontSize: 16, fontWeight: 'bold' },
  rescanButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#3730a3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  rescanButtonText: { color: '#e0e7ff', fontSize: 16, fontWeight: 'bold' },
});
