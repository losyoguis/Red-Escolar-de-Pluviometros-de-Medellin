# Backend Apps Script · v9.0-secure

Este directorio incluye una implementación de referencia compatible con el frontend de la Red Escolar de Pluviómetros de Medellín.

## Qué cambia

- `GET + JSONP` queda limitado a `ping`, `sedes` y `publicrecords`.
- `add`, `adminlogin`, `records` y las operaciones de fotografía requieren `POST`.
- PIN y contraseña se guardan como hash SHA-256 con salt; no se recomienda guardar valores en texto plano.
- La sesión administrativa se conserva temporalmente en `CacheService`.
- El backend nunca publica observador ni observaciones en `publicrecords`.

## Puesta en marcha

1. Crea o abre un proyecto de Google Apps Script.
2. Copia `Code.gs` y `appsscript.json`.
3. Ejecuta manualmente:

```javascript
configurarBackend('ID_DE_TU_GOOGLE_SHEETS', 'admin', 'UNA_CLAVE_SEGURA_DE_12_O_MAS_CARACTERES')
```

4. Crea el PIN de cada sede con:

```javascript
crearOActualizarPinSede('CODIGO_SEDE', '123456')
```

5. Despliega como **Aplicación web** y copia la URL terminada en `/exec`.
6. En la pestaña **Privado** del frontend pega la URL y pulsa **Guardar URL del backend**.

## Fotografías en GitHub

Agrega en **Propiedades del script**:

- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH` (opcional, por defecto `main`)
- `GITHUB_BASE_PATH` (opcional, por defecto `data/evidencias`)

El token debe limitarse al repositorio y a los permisos estrictamente necesarios para escribir contenidos.

## Migración desde un backend anterior

El frontend v9 usa POST para credenciales. Si el `/exec` anterior solo implementa JSONP para `add` o `adminlogin`, debes desplegar este backend o adaptar `doPost` antes de usar registro oficial o acceso administrador.
