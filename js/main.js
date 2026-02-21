"use strict";
import {$, $all, $id, show, hide, createCustomP, makeIcon, makeIMG, addClass} from "./utils.js";

const restrictedViews = ["storico", "amici", "sfide"];
let isUserLoggedIn = false;

function setActiveMenu(viewName) {
  if (restrictedViews.includes(viewName) && !isUserLoggedIn) {
    const btnLogin = $id("btnShowLogin");
    if (btnLogin) btnLogin.click();
    return;
  }

  const menu = $id("sidebarMenu");
  const title = $id("topbarTitle");
  if (!menu) return;
  
  $all(".menu__item", menu).forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === viewName);
  });

  $all(".view").forEach(hide);
  show($id(`view-${viewName}`));

  const titles = {
    dashboard: "Dashboard",
    sfide: "Sfida 1v1",
    impara: "Impara Teoria",
    storico: "Storico",
    ostiche: "Domande Ostiche",
  };
  if (title) title.textContent = titles[viewName] || "PatenteLAB";

  if (viewName === "storico") loadStorico();
  if (viewName === "ostiche") loadOstiche();
  if (viewName === "sfide") loadChallenges();
}

function setupSidebarToggle() {
  const sidebar = $(".sidebar");
  const btnToggle = $id("btnToggleSidebar");
  const menu = $id("sidebarMenu");
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

function setLoggedIn(isLoggedIn, username = "") {
  isUserLoggedIn = isLoggedIn;
  const btnLogin = $id("btnShowLogin");
  const btnRegister = $id("btnShowRegister");
  const btnLogout = $id("btnLogout");
  const profileMini = $id("profileMini");
  const profileUsername = $id("profileUsername");

  if (isLoggedIn) {
    hide(btnLogin);
    hide(btnRegister);
    show(btnLogout);
    show(profileMini);
    if (profileUsername) profileUsername.textContent = username || "utente";
  } else {
    show(btnLogin);
    show(btnRegister);
    hide(btnLogout);
    hide(profileMini);
    if (profileUsername) profileUsername.textContent = "utente";
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

  const statsSection = $id("statsSection");
  if (isLoggedIn) {
    show(statsSection);
    loadStats();
    loadChallenges();
  } else {
    hide(statsSection);
    const challengeList = $id("challengeList");
    createCustomP(challengeList, "Accedi per usare le sfide.", "#94a3b8");
  }
}

async function loadSessionStatus() {
  try {
    const res = await fetch("../php/session_status.php", { method: "GET" });
    const data = await res.json();
    const isLogged = Boolean(data.status === "success" && data.data && data.data.logged);
    const username = isLogged && data.data && data.data.user ? data.data.user.username : "";
    setLoggedIn(isLogged, username || "");
  } catch (err) {
    setLoggedIn(false);
  }
}

function setupLogout() {
  const btnLogout = $id("btnLogout");

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
    const stats = data.data || {};
    const el = (id) => document.getElementById(id);
    el("statTotale").textContent = stats.totale;
    el("statSuperati").textContent = stats.superati;
    el("statPercentuale").textContent = stats.percentuale + "%";
    el("statErrori").textContent = stats.media_errori;
  } catch {}
}

const MAX_REVIEW_SELECTION = 50;
let reviewQuestions = [];

function setupReviewCard() {
  const card = $id("cardReview");
  if (!card) return;

  card.addEventListener("click", async (e) => {
    if (card.classList.contains("is-locked")) return;
    if (e.target.closest(".review-panel")) return;

    const panel = $id("reviewPanel");
    const stats = $id("statsSection");

    if (card.classList.contains("is-expanded")) {
      card.classList.remove("is-expanded");
      hide(panel);
      if (isUserLoggedIn) show(stats);
      return;
    }

    card.classList.add("is-expanded");
    hide(stats);
    show(panel);

    const list = $id("reviewQuestionsList");
    const desc = $id("reviewDesc");
    createCustomP(list, "Caricamento...", "#94a3b8")

    try {
      const res = await fetch("../php/get_user_errors.php");
      const data = await res.json();
      reviewQuestions = (data.data && data.data.questions) || [];

      if (reviewQuestions.length === 0) {
        desc.textContent = "Non hai ancora errori da ripassare.";
        list.replaceChildren();
        return;
      }

      desc.textContent = `Hai ${reviewQuestions.length} domande da ripassare. Puoi selezionarne al massimo ${MAX_REVIEW_SELECTION}.`;
      renderReviewList(reviewQuestions);
      applyFilter("50");
    } catch {
      createCustomP(list, "Errore", "#ef4444")
    }
  });

  const panel = $id("reviewPanel");
  if (!panel) return;

  panel.addEventListener("click", (e) => {
    const filterBtn = e.target.closest(".review-filter-btn");
    if (filterBtn) {
      $all(".review-filter-btn").forEach(b => b.classList.remove("is-active"));
      addClass(filterBtn, "is-active");
      applyFilter(filterBtn.dataset.select);
      return;
    }

    if (e.target.id === "btnStartReview" || e.target.closest("#btnStartReview")) {
      startReview();
    }
  });

  panel.addEventListener("change", (e) => {
    const checkbox = e.target.closest("#reviewQuestionsList input[type='checkbox']");
    if (!checkbox || !checkbox.checked) return;

    const selected = $all("#reviewQuestionsList input[type='checkbox']:checked").length;
    if (selected > MAX_REVIEW_SELECTION) {
      checkbox.checked = false;
      alert(`Puoi selezionare al massimo ${MAX_REVIEW_SELECTION} domande.`);
    }
  });
}

function renderReviewList(questions) {
  const list = $id("reviewQuestionsList");
  list.replaceChildren();
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "review-q-item";
    const id = `rq-${q.id}`;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.value = String(q.id);
    input.checked = true;

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = `${i + 1}. ${q.testo ?? ""}`;

    div.append(input, label);
    list.appendChild(div);
  });
}

function applyFilter(mode) {
  const checkboxes = $all("#reviewQuestionsList input[type='checkbox']");
  const parsedMode = Number.parseInt(mode, 10);
  const limit = Number.isNaN(parsedMode)
    ? MAX_REVIEW_SELECTION
    : Math.min(Math.max(parsedMode, 0), MAX_REVIEW_SELECTION);

  checkboxes.forEach((cb, i) => {
    cb.checked = i < limit;
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
  if (selected.length > MAX_REVIEW_SELECTION) {
    alert(`Puoi selezionare al massimo ${MAX_REVIEW_SELECTION} domande.`);
    return;
  }

  sessionStorage.setItem("ripassoIds", JSON.stringify(selected));
  location.href = "game.html?mode=ripasso";
}

function mapChallengeStatus(challenge) {
  if (challenge.status === "conclusa") return "Conclusa";
  if (challenge.can_play) return "Da giocare";
  return "In attesa avversario";
}

function mapChallengeResult(challenge) {
  if (challenge.result === "vinta") return "Hai vinto";
  if (challenge.result === "persa") return "Hai perso";
  if (challenge.result === "pareggio") return "Pareggio";
  return "";
}

function renderChallenges(challenges) {
  const list = $id("challengeList");
  if (!list) return;

  if (!challenges.length) {
    createCustomP(list, "Nessuna sfida disponibile.", "#94a3b8");
    return;
  }

  list.replaceChildren();
  challenges.forEach((challenge) => {
    const item = document.createElement("div");
    item.className = "challenge-item";

    const head = document.createElement("div");
    head.className = "challenge-item__head";

    const who = document.createElement("span");
    who.textContent = "vs " + (challenge.opponent ?? "");

    const state = document.createElement("span");
    state.className = "challenge-item__state";
    state.textContent = mapChallengeStatus(challenge);

    head.append(who, state);

    const meta = document.createElement("div");
    meta.className = "challenge-item__meta";

    const score = document.createElement("span");
    const myScore = challenge.my_score === null ? "-" : challenge.my_score;
    const oppScore = challenge.opponent_score === null ? "-" : challenge.opponent_score;
    let text = `Punteggio: ${myScore} - ${oppScore}`;
    const result = mapChallengeResult(challenge);
    if (result) text += ` • ${result}`;
    score.textContent = text;

    meta.appendChild(score);

    if (challenge.can_play) {
      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "challenge-play";
      playBtn.textContent = "Gioca";
      playBtn.addEventListener("click", () => {
        location.href = `game.html?mode=sfida&challenge_id=${challenge.id}`;
      });
      meta.appendChild(playBtn);
    }

    item.append(head, meta);
    list.appendChild(item);
  });
}

async function loadChallenges() {
  const list = $id("challengeList");
  if (!list || !isUserLoggedIn) return;

  createCustomP(list, "Caricamento...", "#94a3b8");

  try {
    const res = await fetch("../php/list_challenges.php");
    const data = await res.json();
    const challenges = data.data && data.data.challenges ? data.data.challenges : [];

    if (data.status !== "success") {
      createCustomP(list, data.message || "Errore nel caricamento sfide.", "#ef4444");
      return;
    }

    renderChallenges(challenges);
  } catch {
    createCustomP(list, "Errore nel caricamento sfide.", "#ef4444");
  }
}

function setupChallengeCard() {
  const input = $id("challengeOpponent");
  const btnCreate = $id("btnCreateChallenge");
  const list = $id("challengeList");
  if (!input || !btnCreate || !list) return;

  createCustomP(list, "Accedi per usare le sfide.", "#94a3b8");

  btnCreate.addEventListener("click", async () => {
    if (!isUserLoggedIn) {
      location.href = "login.html";
      return;
    }

    const username = (input.value || "").trim().toLowerCase();
    if (!username) {
      alert("Inserisci username avversario.");
      return;
    }

    btnCreate.disabled = true;
    try {
      const res = await fetch("../php/create_challenge.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.status !== "success") {
        alert(data.message || "Impossibile creare la sfida.");
        return;
      }

      input.value = "";
      await loadChallenges();
    } catch {
      alert("Errore nella creazione della sfida.");
    } finally {
      btnCreate.disabled = false;
    }
  });
}

async function loadOstiche() {
  const container = $id("ostiche-list");
  if (!container) return;

  createCustomP(container, "Caricamento...", "#64748b");

  try {
    const res = await fetch("../php/get_most_wrong.php");
    const data = await res.json();
    const questions = data.data && data.data.questions ? data.data.questions : [];

    if (data.status !== "success" || !questions.length) {
        container.replaceChildren();
        createCustomP(container, "Nessuna domanda ostica trovata.", "#64748b");
      return;
    }

    container.replaceChildren();
    const frag = document.createDocumentFragment();

    questions.forEach((q, i) => {
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
      meta.textContent = q.errori <= 1 ? `${q.errori} errore` : `${q.errori} errori`;

      header.append(rank, text, meta);
      item.appendChild(header);

      if (q.immagine) {
        const imgWrap = document.createElement("div");
        imgWrap.className = "storico-q__img";

        imgWrap.appendChild(makeIMG(q.immagine));
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
  const container = $id("storico-list");
  if (!container) return;
  
    createCustomP(container, "Caricamento...", "#64748b");

    try {
    const res = await fetch("../php/get_history.php");
    const data = await res.json();
    const history = data.data && data.data.history ? data.data.history : [];

    if (data.status !== "success" || !history.length) {
      createCustomP(container, "Nessuna partita trovata.", "#64748b");
      return;
    }

    container.replaceChildren();
    const frag = document.createDocumentFragment();

    history.forEach((item) => {
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
        imgWrap.appendChild(makeIMG(r.immagine));
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
  setupChallengeCard();
  await loadSessionStatus();
}

document.addEventListener("DOMContentLoaded", init);
