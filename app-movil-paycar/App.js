import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { Picker } from '@react-native-picker/picker';
import { SUPABASE_ANON_KEY, SUPABASE_BUCKET, SUPABASE_TABLE, SUPABASE_URL } from './src/config';

const PAYCAR_LOGO = require('./assets/apple-touch-icon.png');

const TIPOS_OBRA = [
  'Vivienda Unifamiliar',
  'Obra Civil',
  'Nave Agricola',
  'Edificio Residencial',
];

const MESES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const APP_PIN = '1234';

function getFechaActualPartes() {
  const now = new Date();
  return {
    mes: String(now.getMonth() + 1).padStart(2, '0'),
    anio: String(now.getFullYear()),
  };
}

function crearListaAnios(anioActual) {
  const lista = [];
  for (let y = anioActual + 1; y >= anioActual - 15; y -= 1) {
    lista.push(String(y));
  }
  return lista;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const fechaActual = useMemo(() => getFechaActualPartes(), []);

  const [pin, setPin] = useState('');
  const [accesoOk, setAccesoOk] = useState(false);
  const [pueblo, setPueblo] = useState('');
  const [tiposObra, setTiposObra] = useState(TIPOS_OBRA);
  const [tipo, setTipo] = useState(TIPOS_OBRA[0]);
  const [modoTipoManual, setModoTipoManual] = useState(false);
  const [tipoManual, setTipoManual] = useState('');
  const [mes, setMes] = useState(fechaActual.mes);
  const [anio, setAnio] = useState(fechaActual.anio);
  const [imagenes, setImagenes] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const anios = useMemo(() => crearListaAnios(Number(fechaActual.anio)), [fechaActual.anio]);
  const fecha = `${mes}-${anio}`;
  const tipoFinal = modoTipoManual ? tipoManual.trim() : tipo;

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

    if (!tipoFinal) {
      Alert.alert('Falta tipo', 'Selecciona un tipo o escribe uno nuevo.');
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

  function guardarTipoManual() {
    const nuevoTipo = tipoManual.trim();
    if (!nuevoTipo) {
      Alert.alert('Tipo vacio', 'Escribe el tipo de obra para guardarlo.');
      return;
    }

    const existente = tiposObra.find(
      (item) => item.toLowerCase() === nuevoTipo.toLowerCase()
    );
    if (existente) {
      setTipo(existente);
      setModoTipoManual(false);
      setTipoManual(existente);
      Alert.alert('Tipo existente', 'Ese tipo ya estaba creado. Lo hemos seleccionado.');
      return;
    }

    setTiposObra((prev) => [nuevoTipo, ...prev]);
    setTipo(nuevoTipo);
    setModoTipoManual(false);
    setTipoManual(nuevoTipo);
    Alert.alert('Tipo guardado', 'Ya puedes reutilizar este tipo en nuevas obras.');
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
        tipo: tipoFinal,
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
      const hoy = getFechaActualPartes();
      setMes(hoy.mes);
      setAnio(hoy.anio);
      setModoTipoManual(false);
      setTipoManual('');
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
        <View style={styles.authContainer}>
          <View style={styles.authBackdropTop} />
          <View style={styles.authBackdropBottom} />
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <View style={styles.logoAuthFrame}>
                <Image source={PAYCAR_LOGO} style={styles.logoAuth} resizeMode="cover" />
              </View>
              <View style={styles.authBadge}>
                <Text style={styles.authBadgeText}>Uso interno</Text>
              </View>
              <Text style={styles.authKicker}>Alta de obras</Text>
              <Text style={styles.authTitle}>Paycar Obras</Text>
              <Text style={styles.authSubtitle}>
                Accede con el PIN para subir una nueva obra a la web.
              </Text>
            </View>
            <View style={styles.authForm}>
              <Text style={styles.label}>PIN de acceso</Text>
              <TextInput
                value={pin}
                onChangeText={setPin}
                placeholder="PIN"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                keyboardType="number-pad"
                style={styles.authInput}
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
            </View>
          </View>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.logoHeroFrame}>
            <Image source={PAYCAR_LOGO} style={styles.logoHero} resizeMode="cover" />
          </View>
          <Text style={styles.heroKicker}>Panel interno</Text>
          <Text style={styles.heroTitle}>Nueva obra</Text>
          <Text style={styles.heroSubtitle}>Rellena los datos y sube las fotos para publicarla.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>Pueblo</Text>
          <TextInput
            value={pueblo}
            onChangeText={setPueblo}
            placeholder="Ejemplo: Ponferrada"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />

          <Text style={styles.label}>Tipo de obra</Text>
          <View style={styles.chipsWrap}>
            {tiposObra.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setTipo(item);
                  setModoTipoManual(false);
                }}
                style={[styles.chip, !modoTipoManual && tipo === item ? styles.chipActive : null]}
              >
                <Text
                  style={[
                    styles.chipText,
                    !modoTipoManual && tipo === item ? styles.chipTextActive : null,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.secondaryButton, modoTipoManual ? styles.secondaryButtonActive : null]}
            onPress={() => {
              setModoTipoManual((prev) => !prev);
            }}
          >
            <Text style={styles.secondaryButtonText}>
              {modoTipoManual ? 'Usar tipos guardados' : 'Escribir tipo manual'}
            </Text>
          </Pressable>
          {modoTipoManual ? (
            <View style={styles.inlineGroup}>
              <TextInput
                value={tipoManual}
                onChangeText={setTipoManual}
                placeholder="Ejemplo: Rehabilitacion"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
              <Pressable style={styles.smallButton} onPress={guardarTipoManual}>
                <Text style={styles.smallButtonText}>Guardar tipo</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>Fecha</Text>
          <View style={styles.dateRow}>
            <View style={styles.pickerBox}>
              <Text style={styles.pickerLabel}>Mes</Text>
              <Picker selectedValue={mes} onValueChange={(value) => setMes(value)}>
                {MESES.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerBox}>
              <Text style={styles.pickerLabel}>Ano</Text>
              <Picker selectedValue={anio} onValueChange={(value) => setAnio(value)}>
                {anios.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>
          <Text style={styles.note}>Fecha guardada: {fecha}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Pressable style={styles.secondaryButton} onPress={seleccionarImagenes}>
            <Text style={styles.secondaryButtonText}>Seleccionar fotos ({imagenes.length})</Text>
          </Pressable>

          {imagenes.length > 0 ? (
            <View style={styles.previewWrap}>
              {imagenes.slice(0, 6).map((asset, idx) => (
                <Image key={`${asset.uri}-${idx}`} source={{ uri: asset.uri }} style={styles.previewImage} />
              ))}
            </View>
          ) : (
            <Text style={styles.note}>Aun no has seleccionado imagenes.</Text>
          )}

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
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  authBackdropTop: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#fdba74',
    opacity: 0.22,
  },
  authBackdropBottom: {
    position: 'absolute',
    bottom: -90,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#fed7aa',
    opacity: 0.35,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#7c2d12',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 18,
  },
  authHeader: {
    alignItems: 'center',
    gap: 8,
  },
  container: {
    padding: 20,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#c2410c',
    borderRadius: 18,
    padding: 18,
  },
  logoAuthFrame: {
    width: 118,
    height: 118,
    alignSelf: 'center',
    borderRadius: 28,
    padding: 7,
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  logoAuth: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  authBadge: {
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  authBadgeText: {
    color: '#c2410c',
    fontWeight: '700',
    fontSize: 12,
  },
  logoHeroFrame: {
    width: 92,
    height: 92,
    borderRadius: 24,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 10,
  },
  logoHero: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  authKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c2410c',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  authTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  authForm: {
    gap: 12,
  },
  authInput: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f172a',
    fontSize: 16,
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fed7aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffedd5',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#7c2d12',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    gap: 10,
  },
  label: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#0f172a',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: '#fff7ed',
  },
  chipActive: {
    borderColor: '#ea580c',
    backgroundColor: '#ffedd5',
  },
  chipText: {
    color: '#334155',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#9a3412',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 2,
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
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fdba74',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonActive: {
    borderColor: '#ea580c',
    backgroundColor: '#ffedd5',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  inlineGroup: {
    gap: 8,
  },
  smallButton: {
    backgroundColor: '#ea580c',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff7ed',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  previewWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  note: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
});
