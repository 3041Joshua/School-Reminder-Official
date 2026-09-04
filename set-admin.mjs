// Ejecutar SOLO en tu computadora. Nunca subas service-account.json a GitHub.
// npm i firebase-admin
// node set-admin.mjs admin@tucorreo.com
import admin from 'firebase-admin';
import fs from 'node:fs';

const email = process.argv[2];
if (!email) throw new Error('Uso: node set-admin.mjs correo@ejemplo.com');
const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { admin: true });
console.log(`admin=true asignado a ${email}. Cierra/abre sesión en el panel para refrescar el token.`);
