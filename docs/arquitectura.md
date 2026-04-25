# Arquitectura del sistema

```text
Pluviómetro de la sede
        ↓
QR o enlace único
        ↓
Formulario web con código de sede
        ↓
PIN privado de sede
        ↓
Apps Script valida y guarda
        ↓
Google Sheets central
        ↓
Dashboard público sanitizado
        ↓
Zona privada administradora
```

## Componentes

- Frontend: HTML, CSS y JavaScript en GitHub Pages.
- Backend: Google Apps Script.
- Base central inicial: Google Sheets.
- Seguridad de sede: código + PIN.
- Seguridad administrativa: usuario + contraseña + token temporal.

## Escalamiento futuro

Para una operación municipal más robusta se recomienda migrar a:

- Firebase Authentication o Supabase Auth.
- Firestore o PostgreSQL.
- Mapa georreferenciado con coordenadas reales.
- Módulo de auditoría de registros.
- Historial de cambios y validación científica de datos.
