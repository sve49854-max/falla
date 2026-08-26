import { getSession, clearSession, money, toast, nameFromDoc } from "./auth.js";

const session = getSession();
if (!session) {
  window.location.href = "/";
}

const bootLoader = document.getElementById("bfLoader");
const smsScreen = document.getElementById("smsScreen");
const needsSms = sessionStorage.getItem("bf_sms") === "1";

if (sessionStorage.getItem("bf_booting") === "1") {
  bootLoader?.classList.add("open");
  sessionStorage.removeItem("bf_booting");
  setTimeout(() => bootLoader?.classList.remove("open"), 900);
} else {
  bootLoader?.classList.remove("open");
}

if (needsSms) {
  smsScreen.hidden = false;
  const last = String(session?.doc || "0000").slice(-4);
  document.getElementById("smsPhone").textContent = `+57 3** *** ${last}`;
}

const name = session?.name || nameFromDoc(session?.doc || "1");
document.getElementById("greeting").textContent = `Hola, ${name}`;
document.getElementById("sessionDoc").textContent = `${session?.type || "CC"} ${session?.doc || ""} · Banca en línea`;

document.getElementById("logout").addEventListener("click", () => {
  clearSession();
  sessionStorage.removeItem("bf_booting");
  sessionStorage.removeItem("bf_sms");
  window.location.href = "/";
});

function showView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${id}`).classList.add("active");
  document.querySelectorAll(".side-link[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === id);
  });
}

document.querySelectorAll("[data-view]").forEach((el) => {
  el.addEventListener("click", () => showView(el.dataset.view));
});

let hidden = false;
document.getElementById("toggleHide").addEventListener("click", () => {
  hidden = !hidden;
  document.getElementById("toggleHide").textContent = hidden ? "Mostrar saldos" : "Ocultar saldos";
  document.querySelectorAll("[data-money]").forEach((el) => {
    el.textContent = hidden ? "$ ••••••" : money(Number(el.dataset.money));
  });
});

document.getElementById("extractos").addEventListener("click", () => {
  toast("Extracto de agosto generado (demo).");
});

document.getElementById("transferForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  toast(`Transferencia a ${data.get("nombre")} enviada.`);
  e.target.reset();
  showView("inicio");
});

document.getElementById("pagoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("Pago aplicado a tu producto.");
  e.target.reset();
  showView("inicio");
});

document.getElementById("avanceForm").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("Avance desembolsado a tu cuenta de ahorros.");
  e.target.reset();
});

document.getElementById("alcanciaForm").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("Abono a Alcancía Digital listo.");
  e.target.reset();
});

const smsInputs = [...document.querySelectorAll("#smsOtp input")];
const smsSubmit = document.getElementById("smsSubmit");

function smsCode() {
  return smsInputs.map((el) => el.value).join("");
}

function validateSms() {
  const ok = smsCode().length === 6;
  smsSubmit.disabled = !ok;
  smsSubmit.classList.toggle("btn-disabled", !ok);
  smsSubmit.classList.toggle("btn-primary", ok);
}

smsInputs.forEach((input, i) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 1);
    if (input.value && smsInputs[i + 1]) smsInputs[i + 1].focus();
    validateSms();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && smsInputs[i - 1]) {
      smsInputs[i - 1].focus();
    }
  });
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    text.split("").forEach((ch, idx) => {
      if (smsInputs[idx]) smsInputs[idx].value = ch;
    });
    smsInputs[Math.min(text.length, 5)]?.focus();
    validateSms();
  });
});

document.getElementById("smsForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (smsSubmit.disabled) return;
  sessionStorage.removeItem("bf_sms");
  bootLoader?.classList.add("open");
  setTimeout(() => {
    smsScreen.hidden = true;
    bootLoader?.classList.remove("open");
  }, 900);
});

document.getElementById("smsResend")?.addEventListener("click", () => {
  smsInputs.forEach((el) => (el.value = ""));
  smsInputs[0]?.focus();
  validateSms();
  toast("Reenviamos un código de 6 dígitos a tu celular.");
});

