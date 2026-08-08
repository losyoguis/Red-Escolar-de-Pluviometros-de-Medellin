# Control de calidad · v9.0

Fecha de revisión: 2026-08-08

## Validaciones realizadas

- Sintaxis JavaScript del frontend: OK (`node --check`).
- Sintaxis del backend `Code.gs`: OK al validarlo como JavaScript V8.
- IDs HTML duplicados: 0.
- Referencias locales faltantes en `script`, `link` e `img`: 0.
- Directorio territorial: 422 sedes.
- IDs de sede duplicados: 0.
- Sedes sin `sede_id`, nombre, núcleo, territorio o barrio/vereda: 0.
- Territorios distintos detectados: 20.
- Archivos `app.js` y `styles.css` obsoletos: eliminados porque no eran cargados por `index.html`.
- ZIP anidado: eliminado.
- Placeholders llamados `1`: eliminados.
- Contraseña administrativa visible: eliminada.
- Fallback de guardado sin PIN: eliminado.

## Pruebas de agregación

Caso 1:

- 10 sedes.
- Cada sede registra 20 mm el mismo día.
- Resultado v9.0: **20 mm representativos**, no 200 mm.

Caso 2:

- Las mismas sedes registran 10 mm un día y 20 mm al día siguiente.
- Resultado de 2 días: **30 mm representativos**.

Caso 3:

- Dos registros para la misma sede y fecha, a las 06:00 y 08:00.
- La normalización sede/día conserva la lectura más reciente para evitar duplicar el peso de una estación.

## Alcance de la prueba

La validación cubre estructura, sintaxis, referencias de archivos y lógica matemática del frontend. La comunicación con un Apps Script desplegado requiere conectividad externa y que la implementación `/exec` tenga el código compatible incluido en `backend_apps_script/`.
