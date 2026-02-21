<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$userId = currentUserId();
$input = readJsonBody();

if (!isset($input["answers"]) || !is_array($input["answers"])) {
    jsonError("Dati mancanti");
}

$userAnswers = $input['answers'];
$conn = dbConnect();

$questionIds = [];
foreach ($userAnswers as $a) {
    if (!is_array($a) || !isset($a["id"])) continue;
    $questionIds[] = (int)$a["id"];
}
$questionIds = array_values(array_unique(array_filter($questionIds, fn($x) => $x > 0)));

if (empty($questionIds)) {
    jsonSuccess(["score" => 0, "errors" => 0, "total" => 0, "esito" => "respinto"]);
}

$placeholders = sqlInPlaceholders($questionIds);
$types = str_repeat("i", count($questionIds));
$stmtQuestions = $conn->prepare("SELECT id, testo, immagine, risposta FROM quesiti WHERE id IN ($placeholders)");
$stmtQuestions->bind_param($types, ...$questionIds);
$stmtQuestions->execute();
$result = $stmtQuestions->get_result();

$dbData = [];
while ($row = $result->fetch_assoc()) {
    $dbData[$row['id']] = $row;
}
$stmtQuestions->close();

$score = 0;
$errors = 0;
$total = count($userAnswers);
$wrongQuestions = [];
$risposteDettaglio = [];

foreach ($userAnswers as $ans) {
    $qid = (int)$ans['id'];
    $uAns = $ans['answer'];

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

$stmt = $conn->prepare("INSERT INTO cronologia_quiz (id_utente, punteggio, totale_domande, errori, esito, risposte_json) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("iiiiss", $userId, $score, $total, $errors, $esito, $risposteJson);
$stmt->execute();
if (!empty($wrongQuestions)) {
    $stmtErr = $conn->prepare("INSERT INTO errori_ripasso (id_utente, id_quesito, data_errore) VALUES (?, ?, NOW())");
    foreach ($wrongQuestions as $qid) {
        $stmtErr->bind_param("ii", $userId, $qid);
        $stmtErr->execute();
    }
}

$conn->close();

jsonSuccess([
    "score" => $score,
    "errors" => $errors,
    "total" => $total,
    "esito" => $esito
]);
