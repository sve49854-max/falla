import { setSession, nameFromDoc, toast } from "./auth.js";

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

function openPanel() {
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

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (loginSubmit.disabled) return;
  loginError.textContent = "";
  const name = nameFromDoc(docNumber.value);
  setSession({
    name,
    doc: docNumber.value,
    type: docType.value,
    at: Date.now(),
  });
  sessionStorage.setItem("bf_booting", "1");
  document.getElementById("bfLoader").classList.add("open");
  loginSubmit.disabled = true;
  setTimeout(() => {
    window.location.href = "/banca.html";
  }, 1400);
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
