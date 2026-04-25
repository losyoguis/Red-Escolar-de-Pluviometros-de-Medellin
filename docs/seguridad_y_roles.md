# Seguridad y roles

## Zona pública

Disponible para ciudadanía, estudiantes, docentes e instituciones:

- Dashboard general.
- Datos de precipitación sin información personal.
- Directorio de sedes.
- Mapa pedagógico.
- Reporte público.
- Descarga pública en CSV, Excel y PDF sin PIN, usuario ni contraseña.
- Descarga pública del directorio de sedes en CSV.

No muestra:

- Observador.
- Observaciones internas.
- PIN de sede.
- Contraseña administrativa.

## Zona de sede

Cada sede registra información con:

- Código de sede.
- PIN institucional.

El PIN se valida en Google Apps Script antes de guardar el registro.

## Zona administradora

Requiere:

- Usuario administrador.
- Contraseña.
- Token temporal de sesión.

Permite sincronizar datos completos y ver observador/observaciones. Las descargas públicas se realizan sin autenticación desde la sección Reportes.

## Validaciones incluidas

- PIN obligatorio por sede.
- Límite recomendado de registros diarios por sede.
- Marcación automática como `Revisar` si se supera el número recomendado de registros.
- Marcación automática como `Revisar` si la precipitación supera el umbral definido.
- Sanitización básica de textos para evitar etiquetas HTML.
- JSONP con callback validado.
