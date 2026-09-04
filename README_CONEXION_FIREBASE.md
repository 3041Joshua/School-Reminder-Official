# Conexión Firebase — School Reminder

## 1. Firebase Authentication

En Firebase Console, habilita **Email/Password** para poder usar la cuenta administrativa.
La app Android ya usa Firebase Authentication para Google/correo/teléfono.

## 2. Firestore

Crea Cloud Firestore en el proyecto `schoolreminder-5f25b`.
Publica las reglas de `firestore.rules`.

Colecciones que usa la app:

- `users/{uid}`: datos mínimos de administración del usuario.
- `supportTickets/{ticketId}`: dudas, sugerencias y errores enviados desde la app.

## 3. Registrar la app Web

En Firebase Console > Configuración del proyecto > Tus apps > agrega una **app Web**.
Copia el objeto de configuración en `js/firebase-config.js`.

No inventes `apiKey`, `appId` ni los demás valores: usa exactamente el objeto que entregue Firebase.

## 4. Crear administrador

Descarga una credencial de cuenta de servicio de Firebase Admin SDK y guárdala localmente como `service-account.json`.
**NO la subas al repositorio.**

Instala la dependencia:

    npm i firebase-admin

Luego ejecuta:

    node set-admin.mjs tu-correo-admin@ejemplo.com

Esto asigna `admin=true` al usuario. El panel verifica ese claim y las reglas de Firestore también lo exigen.

## 5. Datos enviados por Android

Al iniciar sesión, Android crea/actualiza `users/{uid}` con nombre, correo, proveedor, versión, Android, dispositivo y último acceso.

Al enviar soporte, Android crea `supportTickets/{id}` con usuario, correo, tipo, asunto, mensaje, versión, Android, dispositivo, fecha y estado.

## 6. Eliminación de cuenta

La app intenta eliminar primero el documento `users/{uid}` y sus tickets y después elimina la cuenta de Firebase Authentication. Si quieres una política distinta de conservación de tickets, cambia esa lógica antes de producción.
