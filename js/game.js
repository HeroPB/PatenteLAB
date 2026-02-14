import { $id, show, hide, addClass, removeClass } from "./utils.js";

const TOTAL_QUESTIONS = 30;
const TIME_LIMIT_MINUTES = 20;

// State
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = new Array(TOTAL_QUESTIONS).fill(null); // null, true, false
let flags = new Array(TOTAL_QUESTIONS).fill(false);
let timerInterval;
let timeRemaining = TIME_LIMIT_MINUTES * 60;
let isGameOver = false;

// DOM Elements
const elQuestionsGrid = $id("questionsGrid");
const elAnsweredCount = $id("answeredCount");
const elTimerValue = $id("timerValue");
const elTimerFill = $id("timerFill");
const elCurrentQNum = $id("currentQNum");
const elQuestionText = $id("questionText");
const elQuestionImg = $id("questionImg");
const elBtnFlag = $id("btnFlag");

// Init
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
  
  const res = await fetch("../php/get_questions.php");
  if (!res.ok) throw new Error("API Error");
  
  questions = await res.json();
  
  if (questions.length === 0) {
    elQuestionText.textContent = "Nessuna domanda trovata nel database.";
    throw new Error("No questions");
  }
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

  // Update Progress Text
  const answered = userAnswers.filter(a => a !== null).length;
  elAnsweredCount.textContent = answered;
}

function loadQuestion(index) {
  if (index < 0 || index >= questions.length) return; // Safety check

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

  // Prepare payload
  const payload = {
    answers: questions.map((q, index) => ({
      id: q.id,
      answer: userAnswers[index]
    }))
  };

  try {
    const res = await fetch("../php/save_result.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let data;
    
    if (!res.ok) {
      let localErrors = 0;
      questions.forEach((q, i) => {
        if (userAnswers[i] !== q.correct) localErrors++;
      });
      data = {
        errors: localErrors,
        total: questions.length,
        esito: localErrors <= 3 ? 'superato' : 'respinto',
        success: false
      };
    } else {
      data = await res.json();
    }
    
    const errCount = typeof data.errors === 'number' ? data.errors : 0;
    
    const modal = $id("resultModal");
    const title = $id("resultTitle");
    const scoreVal = $id("scoreValue");
    const circle = $id("scoreCircle");
    const msg = $id("resultMessage");

    removeClass(modal, "hidden");
    scoreVal.textContent = errCount;

    if (data.esito === 'superato') {
      title.textContent = "Esame Superato!";
      circle.className = "score-circle is-success";
      msg.textContent = `Hai fatto solo ${errCount} errori. Ottimo lavoro!`;
    } else {
      title.textContent = "Non Superato";
      circle.className = "score-circle is-fail";
      msg.textContent = `Hai commesso ${errCount} errori (max 3). Ripassa gli errori e riprova.`;
    }

    renderSidebar();
    loadQuestion(currentQuestionIndex);

  } catch (err) {
    alert("Errore salvataggio: " + err.message);
  }
}
