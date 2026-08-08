# Backend oficial · v9.0.1

Esta compilación queda configurada para usar como backend predeterminado:

`https://script.google.com/macros/s/AKfycbyKHQV_3RgOIFlSiGQEbMCCwWQ6J-lKraUX2jSd9nMIvjK2qLA4E_MkMNfuuvXcHXI/exec`

## Migración automática

Al abrir la aplicación por primera vez después de publicar v9.0.1, se reemplaza una sola vez cualquier URL de backend guardada por una versión anterior en `localStorage`. Después de esa migración, el administrador aún puede cambiar manualmente la URL desde la sección Privado si necesita hacer pruebas.

## Caché

El Service Worker usa un nuevo nombre de caché (`v9-0-1-exec-oficial`) para forzar la actualización de los archivos del frontend en equipos que ya habían abierto v9.0.
