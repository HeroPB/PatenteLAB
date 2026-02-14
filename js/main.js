"use strict";

const restrictedViews = ["storico", "amici"];
let isUserLoggedIn = false;

/* Helpers DOM */
function $(sel, root = document) {
  return root.querySelector(sel);
}
function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
function show(el) {
  if (el) el.classList.remove("hidden");
}
function hide(el) {
  if (el) el.classList.add("hidden");
}

/* UI: menu + views */
function setActiveMenu(viewName) {
  // Security check
  if (restrictedViews.includes(viewName) && !isUserLoggedIn) {
    // Blocco accesso, apro modal login
    const btnLogin = $("#btnShowLogin");
    if (btnLogin) btnLogin.click();
    return;
  }

  const menu = $("#sidebarMenu");
  const title = $("#topbarTitle");
  if (!menu) return;

  // aggiorna stato "active" nel menu
  $all(".menu__item", menu).forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === viewName);
  });

  // mostra solo la view corretta
  $all(".view").forEach(hide);
  show($(`#view-${viewName}`));

  const titles = {
    dashboard: "Dashboard",
    impara: "Impara Teoria",
    storico: "Storico",
    ostiche: "Domande Ostiche",
  };
  if (title) title.textContent = titles[viewName] || "PatenteLAB";

  // Carica dati dinamici
  if (viewName === "storico") loadStorico();
  if (viewName === "ostiche") loadOstiche();
}

/* Sidebar (mobile) */
function setupSidebarToggle() {
  const sidebar = $(".sidebar");
  const btnToggle = $("#btnToggleSidebar");
  const menu = $("#sidebarMenu");
  if (!sidebar || !btnToggle || !menu) return;

  btnToggle.addEventListener("click", () => {
    sidebar.classList.toggle("is-open");
  });

  // Chiudi sidebar su mobile quando clicchi una voce
  menu.addEventListener("click", (e) => {
    const btn = e.target.closest(".menu__item");
    if (!btn) return;
    setActiveMenu(btn.dataset.view);
    sidebar.classList.remove("is-open");
  });
}

/* Auth state (solo UI) */
function setLoggedIn(isLoggedIn) {
  isUserLoggedIn = isLoggedIn;
  const btnLogin = $("#btnShowLogin");
  const btnRegister = $("#btnShowRegister");
  const btnLogout = $("#btnLogout");

  if (isLoggedIn) {
    hide(btnLogin);
    hide(btnRegister);
    show(btnLogout);
  } else {
    show(btnLogin);
    show(btnRegister);
    hide(btnLogout);
  }

  // Se sono sloggato e mi trovo su una pagina protetta, torno alla dashboard
  if (!isLoggedIn) {
    const activeItem = $(".menu__item.is-active");
    if (activeItem && restrictedViews.includes(activeItem.dataset.view)) {
      setActiveMenu("dashboard");
    }
  }

  /* Gestione Card Bloccate (Dashboard) */
  const lockableCards = $all("[data-lockable='true']");
  lockableCards.forEach(card => {
    if (isLoggedIn) {
      card.classList.remove("is-locked");
    } else {
      card.classList.add("is-locked");
    }
    card.onclick = () => {
      if (card.classList.contains("is-locked")) {
        location.href = "login.html";
      }
    };
  });

  // Stats section: mostra/nascondi e carica dati
  const statsSection = $("#statsSection");
  if (isLoggedIn) {
    show(statsSection);
    loadStats();
  } else {
    hide(statsSection);
  }
}

async function loadSessionStatus() {
  try {
    const res = await fetch("../php/session_status.php", { method: "GET" });
    const data = await res.json();
    setLoggedIn(Boolean(data.logged));
  } catch (err) {
    // se fallisce, resta “non loggato”
    setLoggedIn(false);
  }
}

/* Logout */
function setupLogout() {
  const btnLogout = $("#btnLogout");

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await fetch("../php/logout.php", { method: "POST" });
      } finally {
        setLoggedIn(false);
      }
    });
  }
}

/* Stats Dashboard */
async function loadStats() {
  try {
    const res = await fetch("../php/get_stats.php");
    const data = await res.json();
    if (data.status !== "success") return;
    const el = (id) => document.getElementById(id);
    el("statTotale").textContent = data.totale;
    el("statSuperati").textContent = data.superati;
    el("statPercentuale").textContent = data.percentuale + "%";
    el("statErrori").textContent = data.media_errori;
  } catch { /* silenzioso */ }
}

/* Domande Ostiche */
async function loadOstiche() {
  const container = $("#ostiche-list");
  if (!container) return;
  container.innerHTML = '<p style="color:#64748b">Caricamento...</p>';

  try {
    const res = await fetch("../php/get_most_wrong.php");
    const data = await res.json();
    if (data.status !== "success" || !data.questions.length) {
      container.innerHTML = '<p style="color:#64748b">Nessun dato disponibile ancora.</p>';
      return;
    }
    container.innerHTML = data.questions.map((q, i) => {
      const img = q.immagine ? `<img src="../immagini/quiz/${q.immagine}" class="storico-thumb" alt="">` : "";
      return `<div class="storico-item">
        <div class="storico-header">
          <span class="ostica-rank">#${i + 1}</span>
          <span class="storico-q__text">${q.testo}</span>
          <span class="storico-meta">${q.errori} errori — ${q.categoria}</span>
        </div>
        ${img ? `<div class="storico-q__img">${img}</div>` : ""}
      </div>`;
    }).join("");
  } catch {
    container.innerHTML = '<p style="color:#dc2626">Errore nel caricamento.</p>';
  }
}

/* Storico */
async function loadStorico() {
  const container = $("#storico-list");
  if (!container) return;
  container.innerHTML = '<p style="color:#64748b">Caricamento...</p>';

  try {
    const res = await fetch("../php/get_history.php");
    const data = await res.json();
    if (data.status !== "success" || !data.history.length) {
      container.innerHTML = '<p style="color:#64748b">Nessuna partita trovata.</p>';
      return;
    }
    container.innerHTML = data.history.map(renderStoricoItem).join("");
  } catch {
    container.innerHTML = '<p style="color:#dc2626">Errore nel caricamento.</p>';
  }
}

function renderStoricoItem(item) {
  const icon = item.esito === "superato"
    ? '<span class="material-symbols-outlined" style="color:#22c55e">check_circle</span>'
    : '<span class="material-symbols-outlined" style="color:#ef4444">cancel</span>';
  const data = new Date(item.data).toLocaleDateString("it-IT", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  const hasDetail = item.risposte && item.risposte.length;

  let detailHtml = "";
  if (hasDetail) {
    detailHtml = '<div class="storico-detail hidden">' +
      item.risposte.map(r => {
        const rIcon = r.corretto
          ? '<span class="material-symbols-outlined" style="color:#22c55e;font-size:18px">check</span>'
          : '<span class="material-symbols-outlined" style="color:#ef4444;font-size:18px">close</span>';
        const uAns = r.risposta_utente === null ? "Nessuna" : (r.risposta_utente ? "Vero" : "Falso");
        const cAns = r.risposta_corretta ? "Vero" : "Falso";
        const img = r.immagine ? `<img src="../immagini/quiz/${r.immagine}" class="storico-thumb" alt="">` : "";
        return `<div class="storico-q">
          <div class="storico-q__body">
            ${rIcon}
            <span class="storico-q__text">${r.testo}</span>
          </div>
          <div class="storico-q__ans">
            <span>Tua: <b>${uAns}</b></span>
            <span>Corretta: <b>${cAns}</b></span>
          </div>
          ${img ? `<div class="storico-q__img">${img}</div>` : ""}
        </div>`;
      }).join("") +
      "</div>";
  }

  return `<div class="storico-item${hasDetail ? ' has-detail' : ''}" onclick="this.querySelector('.storico-detail')?.classList.toggle('hidden')">
    <div class="storico-header">
      ${icon}
      <span class="storico-title">Partita ${item.numero}</span>
      <span class="storico-meta">${item.punteggio}/${item.totale} — ${item.errori} errori — ${data}</span>
      ${hasDetail ? '<span class="material-symbols-outlined storico-chevron">expand_more</span>' : ''}
    </div>
    ${detailHtml}
  </div>`;
}

/* Init */
async function init() {
  setActiveMenu("dashboard");
  setupSidebarToggle();
  setupLogout();
  await loadSessionStatus();
}

document.addEventListener("DOMContentLoaded", init);
