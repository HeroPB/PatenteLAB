"use strict";
import { $, $all, show, hide, createCustomP, makeIcon, makeImgThumb } from "./utils.js";

const restrictedViews = ["storico", "amici"];
let isUserLoggedIn = false;

function setActiveMenu(viewName) {
  if (restrictedViews.includes(viewName) && !isUserLoggedIn) {
    const btnLogin = $("#btnShowLogin");
    if (btnLogin) btnLogin.click();
    return;
  }

  const menu = $("#sidebarMenu");
  const title = $("#topbarTitle");
  if (!menu) return;
  
  $all(".menu__item", menu).forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === viewName);
  });

  $all(".view").forEach(hide);
  show($(`#view-${viewName}`));

  const titles = {
    dashboard: "Dashboard",
    impara: "Impara Teoria",
    storico: "Storico",
    ostiche: "Domande Ostiche",
  };
  if (title) title.textContent = titles[viewName] || "PatenteLAB";

  if (viewName === "storico") loadStorico();
  if (viewName === "ostiche") loadOstiche();
}

function setupSidebarToggle() {
  const sidebar = $(".sidebar");
  const btnToggle = $("#btnToggleSidebar");
  const menu = $("#sidebarMenu");
  if (!sidebar || !btnToggle || !menu) return;

  btnToggle.addEventListener("click", () => {
    sidebar.classList.toggle("is-open");
  });

  menu.addEventListener("click", (e) => {
    const btn = e.target.closest(".menu__item");
    if (!btn) return;
    setActiveMenu(btn.dataset.view);
    sidebar.classList.remove("is-open");
  });
}

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

  if (!isLoggedIn) {
    const activeItem = $(".menu__item.is-active");
    if (activeItem && restrictedViews.includes(activeItem.dataset.view)) {
      setActiveMenu("dashboard");
    }
  }

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
    setLoggedIn(false);
  }
}

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
  } catch {}
}

let reviewQuestions = [];

function setupReviewCard() {
  const card = $("#cardReview");
  if (!card) return;

  card.addEventListener("click", async (e) => {
    if (card.classList.contains("is-locked")) return;
    if (e.target.closest(".review-panel")) return;

    const panel = $("#reviewPanel");
    const stats = $("#statsSection");

    // Collapse
    if (card.classList.contains("is-expanded")) {
      card.classList.remove("is-expanded");
      hide(panel);
      if (isUserLoggedIn) show(stats);
      return;
    }

    // Expand
    card.classList.add("is-expanded");
    hide(stats);
    show(panel);

    const list = $("#reviewQuestionsList");
    const desc = $("#reviewDesc");
    list.innerHTML = "<p style='color:#94a3b8'>Caricamento...</p>";

    try {
      const res = await fetch("../php/get_user_errors.php");
      const data = await res.json();
      reviewQuestions = data.questions || [];

      if (reviewQuestions.length === 0) {
        desc.textContent = "Non hai ancora errori da ripassare.";
        list.innerHTML = "";
        return;
      }

      desc.textContent = `Hai ${reviewQuestions.length} domande da ripassare.`;
      renderReviewList(reviewQuestions);
      applyFilter("all");
    } catch {
      list.innerHTML = "<p style='color:#ef4444'>Errore nel caricamento.</p>";
    }
  });

  const panel = $("#reviewPanel");
  if (!panel) return;

  panel.addEventListener("click", (e) => {
    const filterBtn = e.target.closest(".review-filter-btn");
    if (filterBtn) {
      $all(".review-filter-btn").forEach(b => b.classList.remove("is-active"));
      filterBtn.classList.add("is-active");
      applyFilter(filterBtn.dataset.select);
      return;
    }

    if (e.target.id === "btnStartReview" || e.target.closest("#btnStartReview")) {
      startReview();
    }
  });
}

function renderReviewList(questions) {
  const list = $("#reviewQuestionsList");
  list.innerHTML = "";
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "review-q-item";
    const id = `rq-${q.id}`;
    div.innerHTML = `<input type="checkbox" id="${id}" value="${q.id}" checked>
      <label for="${id}">${i + 1}. ${q.testo}</label>`;
    list.appendChild(div);
  });
}

function applyFilter(mode) {
  const checkboxes = $all("#reviewQuestionsList input[type='checkbox']");
  checkboxes.forEach((cb, i) => {
    if (mode === "all") {
      cb.checked = true;
    } else {
      cb.checked = i < parseInt(mode);
    }
  });
}

function startReview() {
  const selected = [];
  $all("#reviewQuestionsList input[type='checkbox']:checked").forEach(cb => {
    selected.push(parseInt(cb.value));
  });

  if (selected.length === 0) {
    alert("Seleziona almeno una domanda.");
    return;
  }

  sessionStorage.setItem("ripassoIds", JSON.stringify(selected));
  location.href = "game.html?mode=ripasso";
}

async function loadOstiche() {
  const container = $("#ostiche-list");
  if (!container) return;

  createCustomP(container, "Caricamento...", "#64748b");

  try {
    const res = await fetch("../php/get_most_wrong.php");
    const data = await res.json();

    if (data.status !== "success" || !data.questions || !data.questions.length) {
        container.replaceChildren();
        createCustomP(container, "Nessuna domanda ostica trovata.", "#64748b");
      return;
    }

    container.replaceChildren();
    const frag = document.createDocumentFragment();

    data.questions.forEach((q, i) => {
      const item = document.createElement("div");
      item.className = "storico-item";

      const header = document.createElement("div");
      header.className = "storico-header";

      const rank = document.createElement("span");
      rank.className = "ostica-rank";
      rank.textContent = "#" + (i + 1);

      const text = document.createElement("span");
      text.className = "storico-q__text";
      text.textContent = q.testo ?? "";

      const meta = document.createElement("span");
      meta.className = "storico-meta";
      const errori = (q.errori ?? 0);
      const categoria = (q.categoria ?? "");
      meta.textContent = `${errori} errori — ${categoria}`;

      header.append(rank, text, meta);
      item.appendChild(header);

      if (q.immagine) {
        const imgWrap = document.createElement("div");
        imgWrap.className = "storico-q__img";

        const img = document.createElement("img");
        img.src = "../immagini/quiz/" + q.immagine;
        img.className = "storico-thumb";
        img.alt = "";

        imgWrap.appendChild(img);
        item.appendChild(imgWrap);
      }

      frag.appendChild(item);
    });

    container.appendChild(frag);
  } catch {
    createCustomP(container, "Errore nel caricamento.", "#dc2626");
  }
}

async function loadStorico() {
  const container = $("#storico-list");
  if (!container) return;
  
    createCustomP(container, "Caricamento...", "#64748b");

    try {
    const res = await fetch("../php/get_history.php");
    const data = await res.json();

    if (data.status !== "success" || !data.history || !data.history.length) {
      createCustomP(container, "Nessuna partita trovata.", "#64748b");
      return;
    }

    container.replaceChildren();
    const frag = document.createDocumentFragment();

    data.history.forEach((item) => {
      frag.appendChild(renderStoricoItemElement(item));
    });

    container.appendChild(frag);
  } catch {
    createCustomP(container, "Errore nel caricamento.", "#dc2626");
  }
}

function renderStoricoItemElement(item) {
  const hasDetail = item.risposte && item.risposte.length;

  const root = document.createElement("div");
  root.className = "storico-item" + (hasDetail ? " has-detail" : "");

  const header = document.createElement("div");
  header.className = "storico-header";

  const ok = item.esito === "superato";
  const icon = ok
    ? makeIcon("check_circle", "#22c55e")
    : makeIcon("cancel", "#ef4444");

  const title = document.createElement("span");
  title.className = "storico-title";
  title.textContent = "Partita " + (item.numero ?? "");

  const meta = document.createElement("span");
  meta.className = "storico-meta";

  const dt = new Date(item.data);
  const when = isNaN(dt.getTime())
    ? ""
    : dt.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const punteggio = item.punteggio ?? 0;
  const totale = item.totale ?? 0;
  const errori = item.errori ?? 0;

  meta.textContent = `${punteggio}/${totale} — ${errori} errori — ${when}`;

  header.append(icon, title, meta);

  let detail = null;

  if (hasDetail) {
    const exp = makeIcon("expand_more", "#64748b");
    exp.classList.add("storico-espandi");
    header.appendChild(exp);

    detail = document.createElement("div");
    detail.className = "storico-detail hidden";

    item.risposte.forEach((r) => {
      const q = document.createElement("div");
      q.className = "storico-q";

      const body = document.createElement("div");
      body.className = "storico-q__body";

      const rOk = Boolean(r.corretto);
      const rIcon = rOk
        ? makeIcon("check", "#22c55e", 18)
        : makeIcon("close", "#ef4444", 18);

      const qText = document.createElement("span");
      qText.className = "storico-q__text";
      qText.textContent = r.testo ?? "";

      body.append(rIcon, qText);

      const ans = document.createElement("div");
      ans.className = "storico-q__ans";

      const u = document.createElement("span");
      const uAns =
        r.risposta_utente === null ? "Nessuna" : (r.risposta_utente ? "Vero" : "Falso");
      u.textContent = "Tua: ";
      const uB = document.createElement("b");
      uB.textContent = uAns;
      u.appendChild(uB);

      const c = document.createElement("span");
      const cAns = r.risposta_corretta ? "Vero" : "Falso";
      c.textContent = "Corretta: ";
      const cB = document.createElement("b");
      cB.textContent = cAns;
      c.appendChild(cB);

      ans.append(u, c);

      q.append(body, ans);

      if (r.immagine) {
        const imgWrap = document.createElement("div");
        imgWrap.className = "storico-q__img";
        imgWrap.appendChild(makeImgThumb(r.immagine));
        q.appendChild(imgWrap);
      }

      detail.appendChild(q);
    });

    root.addEventListener("click", (e) => {
      if (!detail) return;
      detail.classList.toggle("hidden");
    });

    root.append(header, detail);
  } else {
    root.appendChild(header);
  }

  return root;
}

async function init() {
  setActiveMenu("dashboard");
  setupSidebarToggle();
  setupLogout();
  setupReviewCard();
  await loadSessionStatus();
}

document.addEventListener("DOMContentLoaded", init);
