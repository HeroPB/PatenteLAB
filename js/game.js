import { $id, show, hide, addClass, removeClass } from "./utils.js";

const params = new URLSearchParams(location.search);
const isRipasso = params.get("mode") === "ripasso";

let TOTAL_QUESTIONS = 30;
const TIME_LIMIT_MINUTES = 1;

let questions = [];
let currentQuestionIndex = 0;
let userAnswers = new Array(TOTAL_QUESTIONS).fill(null);
let flags = new Array(TOTAL_QUESTIONS).fill(false);
let timerInterval;
let timeRemaining = TIME_LIMIT_MINUTES * 60;
let isGameOver = false;

const elQuestionsGrid = $id("questionsGrid");
const elAnsweredCount = $id("answeredCount");
const elTimerValue = $id("timerValue");
const elTimerFill = $id("timerFill");
const elCurrentQNum = $id("currentQNum");
const elQuestionText = $id("questionText");
const elQuestionImg = $id("questionImg");
const elBtnFlag = $id("btnFlag");

document.addEventListener("DOMContentLoaded", () => {
  initGame();
});

async function initGame() {
  try {
    await fetchQuestions();
    renderSidebar();
    startTimer();
    loadQuestion(0);
    setupEvents();
  } catch (err) {
    alert("Errore caricamento domande: " + err.message);
  }
}

async function fetchQuestions() {
  elQuestionText.textContent = "Caricamento...";

  if (isRipasso) {
    const ids = JSON.parse(sessionStorage.getItem("ripassoIds") || "[]");
    if (ids.length === 0) throw new Error("Nessuna domanda selezionata");

    const res = await fetch("../php/get_review_questions.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();
    if (data.status !== "success") throw new Error(data.message || "API Error");
    questions = data.data && Array.isArray(data.data.questions) ? data.data.questions : [];
  } else {
    const res = await fetch("../php/get_questions.php");
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();
    if (data.status !== "success") throw new Error(data.message || "API Error");
    questions = data.data && Array.isArray(data.data.questions) ? data.data.questions : [];
  }

  if (questions.length === 0) {
    elQuestionText.textContent = "Nessuna domanda trovata.";
    throw new Error("No questions");
  }

  TOTAL_QUESTIONS = questions.length;
  userAnswers = new Array(TOTAL_QUESTIONS).fill(null);
  flags = new Array(TOTAL_QUESTIONS).fill(false);

  const elTotal = $id("totalQuestions");
  if (elTotal) elTotal.textContent = TOTAL_QUESTIONS;
  
  const badges = document.querySelectorAll(".totalQBadge");
  badges.forEach(b => b.textContent = TOTAL_QUESTIONS);
  
  console.log("Total Questions updated to:", TOTAL_QUESTIONS);
}

function renderSidebar() {
  elQuestionsGrid.innerHTML = "";
  questions.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.className = "q-btn";
    btn.textContent = index + 1;
    btn.onclick = () => {
      isTransitioning = false;
      loadQuestion(index);
    };
    

    if (index === currentQuestionIndex) addClass(btn, "is-active");
    if (userAnswers[index] !== null) addClass(btn, "is-answered");
    if (flags[index]) addClass(btn, "is-flagged");

    if (isGameOver) {
      const isCorrect = userAnswers[index] === questions[index].correct;
      addClass(btn, isCorrect ? "is-correct" : "is-wrong");
    }

    elQuestionsGrid.appendChild(btn);
  });

  const answered = userAnswers.filter(a => a !== null).length;
  elAnsweredCount.textContent = answered;
}

function loadQuestion(index) {
  if (index < 0 || index >= questions.length) return;

  currentQuestionIndex = index;
  const q = questions[index];

  elCurrentQNum.textContent = index + 1;
  elQuestionText.textContent = q.text;
  
  const elQuestionImgContainer = $id("questionImageContainer");
  if (q.image) {
    elQuestionImg.src = q.image;
    show(elQuestionImgContainer);
  } else {
    hide(elQuestionImgContainer);
  }

  if (flags[index]) {
    addClass(elBtnFlag, "is-active");
  } else {
    removeClass(elBtnFlag, "is-active");
  }

  updateAnswerButtons();
  renderSidebar();
}

function updateAnswerButtons() {
  const ans = userAnswers[currentQuestionIndex];
  const btnTrue = $id("btnTrue");
  const btnFalse = $id("btnFalse");
  const correct = questions[currentQuestionIndex].correct;

  btnTrue.className = "ans-btn ans-btn--true";
  btnFalse.className = "ans-btn ans-btn--false";

  if (!isGameOver) {
    if (ans === true) {
      addClass(btnTrue, "is-selected");
      addClass(btnFalse, "is-faded");
    } else if (ans === false) {
      addClass(btnFalse, "is-selected");
      addClass(btnTrue, "is-faded");
    }
    return;
  }


  if (correct === true) addClass(btnTrue, "show-correct");
  else addClass(btnFalse, "show-correct");

  if (ans === true) {
    addClass(btnTrue, "user-picked");
    if (correct !== true) addClass(btnTrue, "show-wrong");
  } else if (ans === false) {
    addClass(btnFalse, "user-picked");
    if (correct !== false) addClass(btnFalse, "show-wrong");
  }

  if (correct !== true && ans !== true) addClass(btnTrue, "is-faded-review");
  if (correct !== false && ans !== false) addClass(btnFalse, "is-faded-review");
}

let isTransitioning = false;

function handleAnswer(answer) {
  if (isTransitioning) return;

  userAnswers[currentQuestionIndex] = answer;
  updateAnswerButtons();
  renderSidebar();
  
  if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
    isTransitioning = true;
    const nextIndex = currentQuestionIndex + 1;
    setTimeout(() => {
      loadQuestion(nextIndex);
      isTransitioning = false;
    }, 200);
  }
  
  checkCompletion();
}

function checkCompletion() {
  const allAnswered = userAnswers.every(a => a !== null);
  const btnSubmit = $id("btnSubmit");
  if (allAnswered) {
    removeClass(btnSubmit, "hidden");
  } else {
    addClass(btnSubmit, "hidden");
  }
}

function toggleFlag() {
  flags[currentQuestionIndex] = !flags[currentQuestionIndex];
  
  elBtnFlag.classList.toggle("is-active");
  renderSidebar();
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert("Tempo scaduto! L'esame verrà terminato.");
      finishGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  elTimerValue.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  const percentage = (timeRemaining / (TIME_LIMIT_MINUTES * 60)) * 100;
  elTimerFill.style.width = `${percentage}%`;
  
  if (percentage < 10) elTimerFill.style.background = "#ef4444";
}

function setupEvents() {
  $id("btnTrue").onclick = () => handleAnswer(true);
  $id("btnFalse").onclick = () => handleAnswer(false);
  elBtnFlag.onclick = toggleFlag;
  
  $id("btnSubmit").onclick = () => {
    if(confirm("Confermi di voler terminare l'esame?")) {
      finishGame();
    }
  };

  $id("btnExit").onclick = () => {
    if (isGameOver) {
      window.location.href = "index.html";
    } else if (confirm("Vuoi davvero uscire dalla simulazione? I progressi non saranno salvati.")) {
      window.location.href = "index.html";
    }
  };
  
  $id("btnHome").onclick = () => window.location.href = "index.html";
  $id("btnReview").onclick = () => {
    $id("resultModal").classList.add("hidden");
  };

  document.addEventListener("keydown", (e) => {
    if (isGameOver) return;
    if (e.key === "ArrowLeft") handleAnswer(true);
    if (e.key === "ArrowRight") handleAnswer(false);
    if (e.key === "f" || e.key === "F") toggleFlag();
  });
}

async function finishGame() {
  clearInterval(timerInterval);
  isGameOver = true;
  
  $id("btnTrue").disabled = true;
  $id("btnFalse").disabled = true;
  $id("btnSubmit").classList.add("hidden");
  $id("btnFlag").classList.add("hidden");

  const payload = {
    answers: questions.map((q, index) => ({
      id: q.id,
      answer: userAnswers[index]
    }))
  };

  try {
    let data;

    const canSave = !isRipasso;
    let saved = false;

    if (canSave) {
      const sessionRes = await fetch("../php/session_status.php");
      const session = await sessionRes.json();

      if (session.status === "success" && session.data && session.data.logged) {
        const res = await fetch("../php/save_result.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (data.status !== "success") {
          throw new Error(data.message || "API Error");
        }
        saved = true;
      }
    }

    if (!saved) {
      let localErrors = 0;
      questions.forEach((q, i) => {
        if (userAnswers[i] !== q.correct) localErrors++;
      });
      data = {
        status: "success",
        data: {
          errors: localErrors,
          total: questions.length,
          esito: localErrors <= 3 ? 'superato' : 'respinto',
          notSaved: true
        }
      };
    }

    const resultData = data.data || {};
    const errCount = typeof resultData.errors === 'number' ? resultData.errors : 0;
    
    const modal = $id("resultModal");
    const title = $id("resultTitle");
    const scoreVal = $id("scoreValue");
    const circle = $id("scoreCircle");
    const msg = $id("resultMessage");

    removeClass(modal, "hidden");
    scoreVal.textContent = errCount;

    if (resultData.esito === 'superato') {
      title.textContent = "Esame Superato!";
      circle.className = "score-circle is-success";
      msg.textContent = `Hai fatto solo ${errCount} errori. Ottimo lavoro!`;
    } else {
      title.textContent = "Non Superato";
      circle.className = "score-circle is-fail";
      msg.textContent = `Hai commesso ${errCount} errori (max 3). Ripassa gli errori e riprova.`;
    }

    if (resultData.notSaved) {
      msg.textContent += "\n⚠️ Accedi per salvare i risultati nello storico.";
    }

    renderSidebar();
    loadQuestion(currentQuestionIndex);

  } catch (err) {
    alert("Errore salvataggio: " + err.message);
  }
}
