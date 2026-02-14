
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
const elQuestionsGrid = document.getElementById("questionsGrid");
const elAnsweredCount = document.getElementById("answeredCount");
const elTimerValue = document.getElementById("timerValue");
const elTimerFill = document.getElementById("timerFill");
const elCurrentQNum = document.getElementById("currentQNum");
const elQuestionText = document.getElementById("questionText");
const elQuestionImg = document.getElementById("questionImg");
const elBtnFlag = document.getElementById("btnFlag");

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
  // Show loading state if needed
  elQuestionText.textContent = "Caricamento...";
  
  const res = await fetch("../php/get_questions.php");
  if (!res.ok) throw new Error("API Error");
  
  questions = await res.json();
  
  // If we have fewer than 30 questions in DB, adjust logic or duplications
  // For now assume DB has enough.
  if (questions.length === 0) {
    elQuestionText.textContent = "Nessuna domanda trovata nel database.";
    throw new Error("No questions");
  }
}

function renderSidebar() {
  elQuestionsGrid.innerHTML = "";
  questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.className = "q-btn";
    btn.textContent = index + 1;
    btn.onclick = () => {
      isTransitioning = false; // Allow manual override
      loadQuestion(index);
    };
    
    // States
    if (index === currentQuestionIndex) btn.classList.add("is-active");
    if (userAnswers[index] !== null) btn.classList.add("is-answered");
    if (flags[index]) btn.classList.add("is-flagged");

    // Result Coloring
    if (isGameOver) {
      const isCorrect = userAnswers[index] === questions[index].correct;
      btn.classList.add(isCorrect ? "is-correct" : "is-wrong");
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
  
  const elQuestionImgContainer = document.getElementById("questionImageContainer");
  if (q.image) {
    elQuestionImg.src = q.image;
    elQuestionImgContainer.style.display = "block";
  } else {
    elQuestionImgContainer.style.display = "none";
  }

  // Update Flag Button State
  if (flags[index]) {
    elBtnFlag.classList.add("is-active");
  } else {
    elBtnFlag.classList.remove("is-active");
  }

  updateAnswerButtons(); // Visual feedback
  renderSidebar(); // Refresh active state
}

function updateAnswerButtons() {
  const ans = userAnswers[currentQuestionIndex];
  const btnTrue = document.getElementById("btnTrue");
  const btnFalse = document.getElementById("btnFalse");
  const correct = questions[currentQuestionIndex].correct;

  // Reset base classes
  btnTrue.className = "ans-btn ans-btn--true";
  btnFalse.className = "ans-btn ans-btn--false";

  // Mode: Gameplay (Selecting answers)
  if (!isGameOver) {
    if (ans === true) {
      btnTrue.classList.add("is-selected");
      btnFalse.classList.add("is-faded");
    } else if (ans === false) {
      btnFalse.classList.add("is-selected");
      btnTrue.classList.add("is-faded");
    }
    return;
  }

  // Mode: Review (Game Over)
  // 1. Show correct answer
  if (correct === true) btnTrue.classList.add("show-correct");
  else btnFalse.classList.add("show-correct");

  // 2. Show user selection (if valid and wrong)
  if (ans === true) {
    btnTrue.classList.add("user-picked");
    if (correct !== true) btnTrue.classList.add("show-wrong");
  } else if (ans === false) {
    btnFalse.classList.add("user-picked");
    if (correct !== false) btnFalse.classList.add("show-wrong");
  }

  // 3. Fade unselected/irrelevant
  if (correct !== true && ans !== true) btnTrue.classList.add("is-faded-review");
  if (correct !== false && ans !== false) btnFalse.classList.add("is-faded-review");
}

let isTransitioning = false;

function handleAnswer(answer) {
  if (isTransitioning) return; // Prevent spamming

  userAnswers[currentQuestionIndex] = answer;
  updateAnswerButtons(); // Update UI immediately
  renderSidebar();
  
  // Auto-advance to next question if not last
  if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
    isTransitioning = true;
    const nextIndex = currentQuestionIndex + 1; // Capture index NOW
    setTimeout(() => {
      loadQuestion(nextIndex);
      isTransitioning = false;
    }, 200);
  }
  
  checkCompletion();
}

function checkCompletion() {
  const allAnswered = userAnswers.every(a => a !== null);
  const btnSubmit = document.getElementById("btnSubmit");
  if (allAnswered) {
    btnSubmit.classList.remove("hidden");
  } else {
    btnSubmit.classList.add("hidden");
  }
}

function toggleFlag() {
  flags[currentQuestionIndex] = !flags[currentQuestionIndex];
  
  // Toggle visual state immediately
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
  
  if (percentage < 10) elTimerFill.style.background = "#ef4444"; // Red when running out
}

function setupEvents() {
  document.getElementById("btnTrue").onclick = () => handleAnswer(true);
  document.getElementById("btnFalse").onclick = () => handleAnswer(false);
  elBtnFlag.onclick = toggleFlag;
  
  document.getElementById("btnSubmit").onclick = () => {
    if(confirm("Confermi di voler terminare l'esame?")) {
      finishGame();
    }
  };

  document.getElementById("btnExit").onclick = () => {
    if (isGameOver) {
      // Already saved, just exit
      window.location.href = "index.html";
    } else if (confirm("Vuoi davvero uscire dalla simulazione? I progressi non saranno salvati.")) {
      window.location.href = "index.html";
    }
  };
  
  // Modal Buttons
  document.getElementById("btnHome").onclick = () => window.location.href = "index.html";
  document.getElementById("btnReview").onclick = () => {
    document.getElementById("resultModal").classList.add("hidden");
    // Stay in game, but in review mode
  };

  // Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (isGameOver) return; // Disable keyboard answering in review
    if (e.key === "ArrowLeft") handleAnswer(true); // Vero
    if (e.key === "ArrowRight") handleAnswer(false); // Falso
    if (e.key === "f" || e.key === "F") toggleFlag();
  });
}

async function finishGame() {
  clearInterval(timerInterval);
  isGameOver = true; // Review Mode ON
  
  // Disable/hide game controls
  document.getElementById("btnTrue").disabled = true;
  document.getElementById("btnFalse").disabled = true;
  document.getElementById("btnSubmit").classList.add("hidden");
  document.getElementById("btnFlag").classList.add("hidden");

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
    
    // Handle not-logged-in case or API error: calculate locally
    if (!res.ok) {
      // Calculate errors locally
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
    
    // Ensure errors is a number
    const errCount = typeof data.errors === 'number' ? data.errors : 0;
    
    // Populate Modal
    const modal = document.getElementById("resultModal");
    const title = document.getElementById("resultTitle");
    const scoreVal = document.getElementById("scoreValue");
    const circle = document.getElementById("scoreCircle");
    const msg = document.getElementById("resultMessage");

    modal.classList.remove("hidden");
    scoreVal.textContent = errCount;

    if (data.esito === 'superato') {
      title.textContent = "Esame Superato! 🎉";
      circle.className = "score-circle is-success";
      msg.textContent = `Hai fatto solo ${errCount} errori. Ottimo lavoro!`;
    } else {
      title.textContent = "Non Superato 😔";
      circle.className = "score-circle is-fail";
      msg.textContent = `Hai commesso ${errCount} errori (max 3). Ripassa gli errori e riprova.`;
    }

    renderSidebar(); // Update colors
    loadQuestion(currentQuestionIndex); // Refresh current view

  } catch (err) {
    alert("Errore salvataggio: " + err.message);
  }
}
