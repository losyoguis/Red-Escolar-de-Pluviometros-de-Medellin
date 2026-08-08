# Red Escolar de Pluviómetros de Medellín · v9.0

Sistema web educativo para registrar, visualizar e interpretar precipitación reportada por sedes educativas de Medellín.

## Cambios principales de v9.0

- Corrige la agregación territorial: ya no suma indiscriminadamente los milímetros de distintas sedes.
- Normaliza por **sede + día** y calcula una **mediana diaria representativa** antes de construir acumulados territoriales.
- Mantiene el acumulado individual de cada sede para su propia ficha e histórico.
- Sustituye la etiqueta meteorológicamente ambigua de “intensidad” por **nivel de precipitación registrada** cuando solo se dispone de milímetros acumulados.
- Cambia “Horas con más lluvia” por **Horarios con más mediciones**.
- El índice de colores se presenta explícitamente como **índice pedagógico de seguimiento**, no como alerta oficial.
- Elimina el intento de guardar registros oficiales por rutas alternativas sin PIN.
- Las operaciones sensibles del frontend (`add`, `adminlogin`, `records` y fotos) usan POST.
- JSONP queda reservado para consultas públicas y bloquea parámetros sensibles.
- La URL del backend tiene una única fuente de configuración y puede actualizarse desde Privado.
- Se eliminó del frontend cualquier contraseña administrativa publicada.
- Navegación agrupada visualmente y estado activo también en la barra móvil.
- Se incluye `backend_apps_script/Code.gs` como backend de referencia desplegable.

## Estructura

```text
index.html                       Aplicación web principal
manifest.webmanifest             Configuración PWA
service-worker.js                Cache básico/offline
data/instituciones.js            Directorio territorial de sedes
assets/                          Logos e imágenes de la interfaz
docs/                            Documentación y matrices territoriales
backend_apps_script/Code.gs      Backend seguro de referencia
backend_apps_script/appsscript.json
```

## Uso del frontend

Para pruebas locales, sirve la carpeta por HTTP; por ejemplo:

```bash
python3 -m http.server 8080
```

Luego abre `http://localhost:8080/`.

Para producción puede publicarse en GitHub Pages. El frontend contiene el directorio de sedes como respaldo local y sincroniza los registros públicos desde Google Apps Script cuando hay backend configurado.

## Backend

Consulta `backend_apps_script/README.md`. El backend incluido implementa:

- `ping`
- `sedes`
- `publicrecords`
- `add`
- `adminlogin`
- `records`
- `photostart`
- `photochunk`
- `photofinish`

Las operaciones con PIN, contraseña, token administrativo o contenido de fotografías están diseñadas para POST.

## Metodología de agregación v9.0

Cuando varias sedes reportan en una misma fecha, la aplicación:

1. conserva una lectura por combinación `sede + fecha`;
2. calcula la mediana de las sedes disponibles para ese día;
3. suma esas medianas diarias cuando necesita un acumulado representativo de varios días.

Ejemplo: si 10 sedes registran 20 mm en una fecha, el valor territorial representativo del día es 20 mm, no 200 mm.

Este criterio evita que un territorio parezca “más lluvioso” simplemente porque tiene más sedes reportando.

## Alcance del índice pedagógico

La sección de seguimiento combina precipitación normalizada, recurrencia de días lluviosos, eventos observados y evidencias para priorizar revisión escolar. Es un **indicador educativo interno** y no reemplaza alertas, pronósticos ni decisiones de organismos oficiales.

## Privacidad

Los reportes públicos no deben incluir PIN, contraseña, observador ni observaciones internas. La zona administradora requiere autenticación del backend.


## Backend oficial v9.0.1

La compilación distribuida usa por defecto el Apps Script `/exec` indicado en `docs/BACKEND_OFICIAL_V9_0_1.md`.
