# Reportes de usuarios — integración SchoolReminder

Esta versión del panel agrega la colección `userReports` y sus reglas de Firestore.

## Documento esperado

Ruta:

`/userReports/{reportId}`

Campos recomendados desde Android:

- `reporterId`: UID del usuario que reporta. **Debe ser el UID autenticado.**
- `reporterName`: nombre mostrado del usuario que reporta (opcional).
- `reporterEmail`: correo del usuario que reporta (opcional).
- `reportedUserId`: UID del usuario reportado.
- `reportedUserName`: nombre mostrado del usuario reportado (opcional).
- `reportedUserEmail`: correo del usuario reportado (opcional).
- `reason`: motivo del reporte.
- `description`: descripción escrita por el usuario (opcional).
- `status`: inicialmente `Pendiente`.
- `createdAt`: `FieldValue.serverTimestamp()`.
- `updatedAt`: opcional.
- `adminNote`: opcional; puede ser escrito por el administrador en futuras mejoras.

## Seguridad

Las reglas permiten que un usuario autenticado **solo cree su propio reporte** (`reporterId == request.auth.uid`). Los usuarios normales no pueden leer, modificar ni eliminar reportes. Los administradores con custom claim `admin=true` pueden leer y gestionar los reportes desde el panel.

## Panel

Se agregó la sección **🚨 Reportes de usuarios** al menú. El dashboard muestra el número de reportes pendientes y la sección permite cambiar entre:

- Pendiente
- En revisión
- Resuelto
- Descartado

El botón `Ver` muestra el detalle completo del reporte.

> Este ZIP corresponde al panel web y las reglas. Para modificar el botón/formulario de **Reportar amigo dentro de la APK Android**, hace falta el código fuente de la versión Android actual de SchoolReminder (ZIP del proyecto Android). No se debe inventar ni reconstruir esa parte desde el panel web.
