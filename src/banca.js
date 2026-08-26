import { getSession, setSession, clearSession, money, toast, nameFromDoc } from "./auth.js";

let session = getSession();
if (!session) {
  session = {
    type: "CC",
    doc: "1020304050",
    name: "Camila",
  };
  setSession(session);
}

document.getElementById("bfLoader")?.classList.remove("open");

const name = session?.name || nameFromDoc(session?.doc || "1");
document.getElementById("greeting").textContent = `Hola, ${name}`;
document.getElementById("sessionDoc").textContent = `${session?.type || "CC"} ${session?.doc || ""} · Banca en línea`;

document.getElementById("logout").addEventListener("click", () => {
  clearSession();
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
