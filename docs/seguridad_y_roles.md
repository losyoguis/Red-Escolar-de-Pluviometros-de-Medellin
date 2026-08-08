# Seguridad y roles · v9.0

## Zona pública

Disponible para ciudadanía, estudiantes, docentes e instituciones:

- dashboard;
- mapa territorial;
- registros sanitizados;
- directorio de sedes;
- calidad del dato;
- reportes y exportaciones públicas.

No debe mostrar:

- PIN;
- contraseña;
- token administrativo;
- nombre del observador;
- observaciones internas.

## Zona de sede

Cada registro oficial requiere:

- código de sede;
- PIN institucional.

El PIN se valida en Google Apps Script. Si el PIN es rechazado, v9.0 **no intenta guardar el registro por una ruta sin PIN**.

## Zona administradora

Requiere:

- usuario;
- contraseña;
- token temporal devuelto por el backend.

El frontend conserva el token únicamente en `sessionStorage`; el backend de referencia usa `CacheService` para expirar la sesión.

## Transporte

- JSONP: solo para `ping`, `sedes` y `publicrecords`.
- POST: `add`, `adminlogin`, `records`, `photostart`, `photochunk`, `photofinish`.
- El frontend rechaza parámetros sensibles en `apiJsonp`.

## Credenciales del backend de referencia

- PIN: hash SHA-256 con salt por sede.
- Contraseña administrativa: hash SHA-256 con salt en Script Properties.
- No existe una contraseña inicial publicada en el frontend.

## Recomendaciones operativas

- desplegar siempre con HTTPS;
- limitar los permisos del token de GitHub al repositorio necesario;
- rotar credenciales ante cambios de responsables;
- evitar compartir PIN por canales públicos;
- mantener una copia de seguridad periódica del Google Sheets central.
