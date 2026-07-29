# App movil Paycar (alta de obras)

Esta app permite crear obras nuevas y subir fotos a Supabase para que aparezcan en la web automaticamente.

## Donde crear el proyecto

Se ha creado dentro de este mismo repo en la carpeta `app-movil-paycar/`.

Ventaja: tienes web + app en un solo sitio.

## 1) Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta el SQL de `../supabase/schema.sql` en SQL Editor.
3. Copia `Project URL` y `anon public key`.
4. Rellena `src/config.js`.

## 2) Conectar la web

En la web, abre `../js/proyectos-config.js` y rellena:

- `url`
- `anonKey`
- `tableName` (deja `obras`)

La pagina de trabajos ya esta preparada para:

- leer de Supabase
- y si falla, usar `data/proyectos.json` como respaldo.

## 3) Ejecutar app

Desde `app-movil-paycar/`:

```bash
npm install
npm run start
```

Luego:

- `a` para Android
- `i` para iOS (requiere macOS + simulador)

## Notas

- PIN simple en `App.js` (`APP_PIN`), sin login.
- Tipos base de obra definidos en `TIPOS_OBRA`, con opcion de crear tipos manuales desde la app.
- Fecha con desplegable separado de mes y ano.
- Si subes una obra y no sale al instante, recarga `trabajos.html`.

## Compartir la app con empleados

No tienen que montar todo como tu.

### Opcion 1 (rapida, para pruebas): Expo Go + QR

1. Tu ejecutas en tu ordenador:

```bash
npm run start
```

2. Les pasas el QR o el enlace de Expo.
3. Ellos instalan `Expo Go` en su movil y abren ese QR.

Limitacion: esta opcion depende de que la sesion de desarrollo este levantada.

### Opcion 2 (recomendada para empleados): app instalada

Generas un build instalable y compartes ese enlace/apk/ipa:

1. Instalar EAS CLI:

```bash
npm install -g eas-cli
```

2. Loguearte:

```bash
eas login
```

3. Configurar builds:

```bash
eas build:configure
```

4. Generar build:

```bash
eas build -p android --profile preview
```

Luego compartes el enlace de instalacion con el equipo.
