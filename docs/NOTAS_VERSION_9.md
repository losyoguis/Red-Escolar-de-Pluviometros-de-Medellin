# Notas de actualización · v9.0

## Correcciones metodológicas

1. **Agregación territorial normalizada**: una lectura por sede/día y mediana diaria antes del acumulado territorial.
2. **Seguimiento de 24 h / 3 días / 7 días**: usa acumulados representativos, no suma todas las estaciones.
3. **Dashboard**: el KPI principal ahora es “Acumulado representativo”.
4. **Patrones horarios**: ahora informa horarios con más mediciones, no atribuye la precipitación acumulada a la hora de lectura.
5. **Terminología**: “nivel de precipitación” reemplaza “intensidad” en la interfaz cuando no se conoce duración del evento.

## Seguridad

1. Eliminada la contraseña administrativa visible en HTML.
2. Eliminado el fallback `addnopin/addflex/addsafe/guardar_revision`.
3. Acciones sensibles migradas a POST en el frontend.
4. JSONP bloquea campos `pin`, `password`, `token`, `observador`, `observaciones`, `chunk` y `foto_base64`.
5. Backend de referencia incluido en el ZIP.

## Mantenibilidad

- eliminados restos de SiMeCO₂ que no eran cargados por la aplicación;
- eliminado ZIP duplicado dentro del proyecto;
- eliminados archivos placeholder `1`;
- documentación actualizada al proyecto de pluviómetros.
