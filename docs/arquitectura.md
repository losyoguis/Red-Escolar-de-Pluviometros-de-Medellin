# Arquitectura · Red Escolar de Pluviómetros de Medellín v9.0

```text
Pluviómetro de la sede
        ↓
QR o enlace único
        ↓
Formulario web con código de sede
        ↓
PIN privado
        ↓ POST
Google Apps Script valida PIN
        ↓
Google Sheets central
        ↓
GET público sanitizado
        ↓
Dashboard / mapa / reportes
```

## Componentes

- Frontend: `index.html` + `data/instituciones.js` + assets.
- Hosting recomendado del frontend: GitHub Pages o servidor HTTPS.
- Backend: Google Apps Script.
- Persistencia: Google Sheets.
- Seguridad por sede: `sede_id + PIN`, validado solo en servidor.
- Seguridad administrativa: usuario + contraseña + token temporal de sesión.
- Fotografías: subida opcional desde Apps Script hacia un repositorio GitHub configurado mediante Script Properties.

## Flujo público

`ping`, `sedes` y `publicrecords` pueden consultarse sin credenciales. Los registros públicos son sanitizados y excluyen observador, observaciones internas y cualquier secreto.

## Flujo sensible

`add`, `adminlogin`, `records` y las operaciones de fotografía usan POST. El frontend v9 bloquea el envío de campos sensibles mediante JSONP.

## Agregación territorial

Los datos se normalizan por `sede + fecha`. Los acumulados territoriales se construyen con la suma de medianas diarias de las sedes que reportaron en cada fecha.

## Evolución recomendada

- incorporar latitud/longitud reales de cada sede;
- auditoría de cambios y validación de registros;
- integración comparativa con estaciones oficiales;
- modelo hidrometeorológico validado antes de convertir el índice pedagógico en cualquier clase de sistema de alerta.
