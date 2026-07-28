import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_BUCKET, SUPABASE_TABLE, SUPABASE_URL } from './src/config';

const TIPOS_OBRA = [
  'Vivienda Unifamiliar',
  'Obra Civil',
  'Nave Agricola',
  'Edificio Residencial',
];

const APP_PIN = '1234';

function getFechaActualMMYYYY() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  return `${mm}-${yyyy}`;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [pin, setPin] = useState('');
  const [accesoOk, setAccesoOk] = useState(false);
  const [pueblo, setPueblo] = useState('');
  const [tipo, setTipo] = useState(TIPOS_OBRA[0]);
  const [fecha, setFecha] = useState(getFechaActualMMYYYY());
  const [imagenes, setImagenes] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const configValida = useMemo(() => {
    return Boolean(
      SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_BUCKET &&
      SUPABASE_TABLE &&
      SUPABASE_URL.includes('supabase.co')
    );
  }, []);

  async function seleccionarImagenes() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: 10,
    });

    if (!result.canceled && Array.isArray(result.assets)) {
      setImagenes(result.assets);
    }
  }

  function validarFormulario() {
    if (!pueblo.trim()) {
      Alert.alert('Falta pueblo', 'Escribe el pueblo de la obra.');
      return false;
    }

    if (!/^\d{2}-\d{4}$/.test(fecha)) {
      Alert.alert('Fecha invalida', 'Usa formato MM-AAAA, por ejemplo 08-2026.');
      return false;
    }

    if (imagenes.length === 0) {
      Alert.alert('Faltan fotos', 'Selecciona al menos una foto.');
      return false;
    }

    return true;
  }

  async function subirImagen(asset, index) {
    const fileExt = (asset.fileName || `foto-${index}.jpg`).split('.').pop() || 'jpg';
    const safePueblo = pueblo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'obra';

    const filePath = `${safePueblo}/${Date.now()}-${index}.${fileExt}`;

    const response = await fetch(asset.uri);
    if (!response.ok) {
      throw new Error(`No se pudo leer la imagen ${index + 1} desde el movil.`);
    }
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: asset.mimeType || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Error subiendo imagen ${index + 1}: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      throw new Error(`La imagen ${index + 1} se subio, pero no se pudo obtener la URL publica.`);
    }

    return publicData.publicUrl;
  }

  async function crearObra() {
    if (!configValida) {
      Alert.alert(
        'Configuracion incompleta',
        'Rellena src/config.js con tus datos de Supabase.'
      );
      return;
    }

    if (!validarFormulario()) return;

    setGuardando(true);

    try {
      const urls = [];
      for (let i = 0; i < imagenes.length; i += 1) {
        try {
          const url = await subirImagen(imagenes[i], i);
          urls.push(url);
        } catch (uploadErr) {
          throw new Error(`Fallo en la foto ${i + 1}: ${uploadErr.message}`);
        }
      }

      const payload = {
        pueblo: pueblo.trim(),
        tipo,
        fecha,
        imagenes: urls,
      };

      const { error } = await supabase.from(SUPABASE_TABLE).insert(payload);

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert('Obra creada', 'La obra se ha subido y ya puede salir en la web.');
      setPueblo('');
      setTipo(TIPOS_OBRA[0]);
      setFecha(getFechaActualMMYYYY());
      setImagenes([]);
    } catch (err) {
      console.error('Error creando obra:', err);
      Alert.alert('Error', err.message || 'No se pudo guardar la obra.');
    } finally {
      setGuardando(false);
    }
  }

  if (!accesoOk) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Paycar Obras</Text>
          <Text style={styles.subtitle}>Acceso rapido con PIN</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            placeholder="PIN"
            placeholderTextColor="#888"
            secureTextEntry
            keyboardType="number-pad"
            style={styles.input}
          />
          <Pressable
            style={styles.button}
            onPress={() => {
              if (pin === APP_PIN) {
                setAccesoOk(true);
              } else {
                Alert.alert('PIN incorrecto', 'Prueba de nuevo.');
              }
            }}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </Pressable>
          <Text style={styles.note}>Cambia el PIN en App.js antes de distribuir.</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nueva obra</Text>

        <Text style={styles.label}>Pueblo</Text>
        <TextInput
          value={pueblo}
          onChangeText={setPueblo}
          placeholder="Ejemplo: Ponferrada"
          placeholderTextColor="#888"
          style={styles.input}
        />

        <Text style={styles.label}>Tipo de obra</Text>
        <View style={styles.chipsWrap}>
          {TIPOS_OBRA.map((item) => (
            <Pressable
              key={item}
              onPress={() => setTipo(item)}
              style={[styles.chip, tipo === item ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, tipo === item ? styles.chipTextActive : null]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Fecha (MM-AAAA)</Text>
        <TextInput
          value={fecha}
          onChangeText={setFecha}
          placeholder="08-2026"
          placeholderTextColor="#888"
          style={styles.input}
        />

        <Pressable style={styles.secondaryButton} onPress={seleccionarImagenes}>
          <Text style={styles.secondaryButtonText}>Seleccionar fotos ({imagenes.length})</Text>
        </Pressable>

        <Pressable
          style={[styles.button, guardando ? styles.buttonDisabled : null]}
          disabled={guardando}
          onPress={crearObra}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Crear obra</Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Si la web tarda en reflejarlo, recarga la pagina de trabajos.
        </Text>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  chipActive: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  chipText: {
    color: '#374151',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#9a3412',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  note: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 13,
  },
});
