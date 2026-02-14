<?php
require_once __DIR__ . "/_utils.php";

header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user'])) {
    jsonResponse(["success" => false, "message" => "Utente non loggato"], 401);
}

$userId = $_SESSION['user']['id'];
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['answers'])) {
    jsonResponse(["error" => "Dati mancanti"], 400);
}

$userAnswers = $input['answers']; // Array of {id: int, answer: bool|null}
$conn = dbConnect();

// Fetch correct answers + testo + immagine for all questions
$questionIds = array_map(function ($a) {
    return (int)$a['id'];
}, $userAnswers);
if (empty($questionIds)) {
    jsonResponse(["success" => true, "score" => 0, "total" => 0]);
}

$idsStr = implode(',', $questionIds);
$sql = "SELECT id, testo, immagine, risposta FROM quesiti WHERE id IN ($idsStr)";
$result = $conn->query($sql);

$dbData = [];
while ($row = $result->fetch_assoc()) {
    $dbData[$row['id']] = $row;
}

$score = 0;
$errors = 0;
$total = count($userAnswers);
$wrongQuestions = [];
$risposteDettaglio = [];

foreach ($userAnswers as $ans) {
    $qid = (int)$ans['id'];
    $uAns = $ans['answer']; // true, false, or null

    if (!isset($dbData[$qid])) continue;

    $row = $dbData[$qid];
    $correct = ((int)$row['risposta']) === 1;
    $isCorrect = ($uAns === $correct);

    if ($isCorrect) {
        $score++;
    } else {
        $errors++;
        $wrongQuestions[] = $qid;
    }

    $risposteDettaglio[] = [
        "id" => $qid,
        "testo" => $row['testo'],
        "immagine" => $row['immagine'],
        "risposta_utente" => $uAns,
        "risposta_corretta" => $correct,
        "corretto" => $isCorrect
    ];
}

$esito = ($errors <= 3) ? 'superato' : 'respinto';
$risposteJson = json_encode($risposteDettaglio);

// Save to Cronologia (with detailed answers)
$stmt = $conn->prepare("INSERT INTO cronologia_quiz (id_utente, punteggio, totale_domande, errori, esito, risposte_json) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("iiiiss", $userId, $score, $total, $errors, $esito, $risposteJson);
$stmt->execute();

// Save Errors to Errori Ripasso
if (!empty($wrongQuestions)) {
    $stmtErr = $conn->prepare("INSERT INTO errori_ripasso (id_utente, id_quesito, data_errore) VALUES (?, ?, NOW())");
    foreach ($wrongQuestions as $qid) {
        $stmtErr->bind_param("ii", $userId, $qid);
        $stmtErr->execute();
    }
}

$conn->close();

jsonResponse([
    "success" => true,
    "score" => $score,
    "errors" => $errors,
    "total" => $total,
    "esito" => $esito
]);
