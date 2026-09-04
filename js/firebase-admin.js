import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const config = window.SCHOOL_REMINDER_FIREBASE_CONFIG;
const missingConfig = !config || Object.values(config).some(v => String(v).startsWith("PEGA_AQUI"));

let app = null;
let auth = null;
let db = null;
if (!missingConfig) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

const $ = (id) => document.getElementById(id);
const login = $("adminLogin");
const shell = $("adminShell");
const loginError = $("loginError");
const setupNotice = $("setupNotice");
const adminEmail = $("adminEmail");
const adminPassword = $("adminPassword");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const content = $("content");
const title = $("title");
const badge = $("ticketBadge");

const titles = {
  dashboard: "Resumen general",
  users: "Usuarios",
  tickets: "Reportes y soporte",
  versions: "Versiones",
  settings: "Configuración"
};

function showShell(show) {
  login.style.display = show ? "none" : "grid";
  shell.style.display = show ? "grid" : "none";
}

function esc(value = "") {
  return String(value).replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
}
function dateValue(v) {
  if (!v) return "—";
  if (typeof v.toDate === "function") return v.toDate().toLocaleString("es-MX");
  return String(v);
}

async function isAdmin(user) {
  const token = await user.getIdTokenResult(true);
  return token.claims?.admin === true;
}

async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map(d => ({id:d.id, ...d.data()}));
  $("content").innerHTML = `<div class="panel"><h3>Usuarios registrados</h3><input class="search" id="userSearch" placeholder="Buscar por nombre, correo o UID..."><table class="table"><thead><tr><th>Usuario</th><th>Proveedor</th><th>Versión</th><th>Dispositivo</th><th>Último acceso</th></tr></thead><tbody id="userRows">${users.map(u => `<tr><td><b>${esc(u.nombre)}</b><br><small>${esc(u.correo)}<br>${esc(u.uid || u.id)}</small></td><td>${esc(u.proveedor)}</td><td>${esc(u.versionApp)}</td><td>${esc(u.dispositivo)}<br><small>Android ${esc(u.android)}</small></td><td>${esc(dateValue(u.ultimoAcceso))}</td></tr>`).join("")}</tbody></table></div>`;
  $("userSearch").oninput = e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#userRows tr").forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none");
  };
  return users;
}

async function loadTickets() {
  const snap = await getDocs(query(collection(db, "supportTickets"), orderBy("creadoEn", "desc")));
  const tickets = snap.docs.map(d => ({id:d.id, ...d.data()}));
  const pendientes = tickets.filter(t => t.estado === "Pendiente").length;
  badge.textContent = pendientes;
  $("content").innerHTML = `<div class="panel"><h3>Soporte y reportes</h3><table class="table"><thead><tr><th>ID</th><th>Usuario</th><th>Tipo</th><th>Asunto</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>${tickets.map(t => `<tr><td><b>#${esc(t.id.slice(0,8))}</b></td><td>${esc(t.nombre)}<br><small>${esc(t.correo)}</small></td><td>${esc(t.tipo)}</td><td>${esc(t.asunto)}</td><td>${esc(dateValue(t.creadoEn))}</td><td><select class="statusSelect" data-id="${esc(t.id)}"><option ${t.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${t.estado==='En revisión'?'selected':''}>En revisión</option><option ${t.estado==='Resuelto'?'selected':''}>Resuelto</option></select></td><td><button class="smallbtn" data-open="${esc(t.id)}">Abrir</button></td></tr>`).join("")}</tbody></table></div>`;
  document.querySelectorAll(".statusSelect").forEach(s => s.onchange = async e => {
    await updateDoc(doc(db,"supportTickets",e.target.dataset.id), {estado:e.target.value, actualizadoEn:serverTimestamp()});
    await loadTickets();
  });
  document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
    const t = tickets.find(x => x.id === b.dataset.open);
    if (!t) return;
    alert(`Reporte #${t.id}\n\n${t.asunto}\n\n${t.mensaje}\n\nUsuario: ${t.nombre}\nCorreo: ${t.correo}\nVersión: ${t.versionApp}\nDispositivo: ${t.dispositivo}`);
  });
  return tickets;
}

async function render(page = "dashboard") {
  title.textContent = titles[page];
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  try {
    if (page === "users") {
      const users = await loadUsers();
      return;
    }
    if (page === "tickets") {
      await loadTickets();
      return;
    }
    if (page === "dashboard") {
      const [usersSnap, ticketsSnap] = await Promise.all([
        getDocs(collection(db,"users")),
        getDocs(collection(db,"supportTickets"))
      ]);
      const users = usersSnap.docs.map(d=>d.data());
      const tickets = ticketsSnap.docs.map(d=>d.data());
      const pending = tickets.filter(t=>t.estado === "Pendiente").length;
      const versions = {};
      users.forEach(u => versions[u.versionApp || "Desconocida"] = (versions[u.versionApp || "Desconocida"] || 0)+1);
      const topVersion = Object.entries(versions).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
      content.innerHTML = `<div class="stats"><div class="stat"><div class="label">Usuarios registrados</div><div class="num">${users.length}</div><span class="tag">Firebase</span></div><div class="stat"><div class="label">Reportes totales</div><div class="num">${tickets.length}</div><span class="tag">Soporte</span></div><div class="stat"><div class="label">Reportes pendientes</div><div class="num">${pending}</div><span class="tag red">Requieren atención</span></div><div class="stat"><div class="label">Versión más usada</div><div class="num">${esc(topVersion)}</div><span class="tag">Actual</span></div></div><div class="grid2"><div class="panel"><h3>Estado del sistema</h3><div class="row"><span>Firebase Auth</span><span class="tag">Conectado</span></div><div class="row"><span>Cloud Firestore</span><span class="tag">Conectado</span></div><div class="row"><span>Usuarios sincronizados</span><b>${users.length}</b></div></div><div class="panel"><h3>Reportes recientes</h3>${tickets.slice().sort((a,b)=>(b.creadoEn?.seconds||0)-(a.creadoEn?.seconds||0)).slice(0,5).map(t=>`<div class="row"><div><b>${esc(t.asunto)}</b><br><small>${esc(t.nombre)} · ${esc(t.tipo)}</small></div><span class="tag ${t.estado==='Pendiente'?'red':t.estado==='En revisión'?'orange':''}">${esc(t.estado)}</span></div>`).join("") || '<p class="muted">Todavía no hay reportes.</p>'}</div></div>`;
      return;
    }
    if (page === "versions") {
      content.innerHTML = `<div class="panel"><h3>Versiones</h3><p class="muted">Esta sección queda preparada para publicar notas de versión y recomendaciones de actualización.</p></div>`;
      return;
    }
    if (page === "settings") {
      content.innerHTML = `<div class="panel"><h3>Configuración</h3><div class="row"><span>Administrador autenticado</span><b>${esc(auth.currentUser?.email)}</b></div><div class="row"><span>Rol</span><span class="tag">admin</span></div><p class="muted">El acceso administrativo se controla mediante un custom claim <b>admin=true</b> en Firebase Authentication. No se confía solamente en la interfaz web.</p></div>`;
    }
  } catch (e) {
    content.innerHTML = `<div class="panel"><h3>No se pudo cargar</h3><p>${esc(e.message || e)}</p><p class="muted">Revisa que Firestore esté creado y que las reglas permitan el acceso de un administrador.</p></div>`;
  }
}

if (missingConfig) {
  setupNotice.style.display = "block";
  loginBtn.disabled = true;
} else {
  onAuthStateChanged(auth, async user => {
    if (!user) {
      showShell(false);
      return;
    }
    try {
      if (!(await isAdmin(user))) {
        loginError.textContent = "Esta cuenta no tiene permisos de administrador.";
        await signOut(auth);
        return;
      }
      adminEmail.value = user.email || "";
      showShell(true);
      await render("dashboard");
    } catch (e) {
      loginError.textContent = e.message || "No se pudo validar el administrador.";
      await signOut(auth);
    }
  });
}

loginBtn.onclick = async () => {
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, adminEmail.value.trim(), adminPassword.value);
  } catch (e) {
    loginError.textContent = "No se pudo iniciar sesión. Verifica correo, contraseña y que la cuenta tenga admin=true.";
  }
};
logoutBtn.onclick = () => signOut(auth);
document.querySelectorAll("nav button").forEach(b => b.onclick = () => render(b.dataset.page));
