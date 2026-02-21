<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$input = readJsonBody();
$challengeId = isset($input["challenge_id"]) ? (int)$input["challenge_id"] : 0;
$answersInput = isset($input["answers"]) && is_array($input["answers"]) ? $input["answers"] : null;

if ($challengeId <= 0 || $answersInput === null) {
  jsonError("Dati mancanti");
}

$userId = currentUserId();
$conn = dbConnect();

$stmt = $conn->prepare("
  SELECT
    s.id,
    s.id_sfidante,
    s.id_sfidato,
    s.domande_ids,
    s.stato,
    s.punteggio_sfidante,
    s.punteggio_sfidato,
    u1.username AS sfidante_username,
    u2.username AS sfidato_username
  FROM sfide s
  JOIN utenti u1 ON u1.id = s.id_sfidante
  LEFT JOIN utenti u2 ON u2.id = s.id_sfidato
  WHERE s.id = ?
  LIMIT 1
");
$stmt->bind_param("i", $challengeId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) {
  $conn->close();
  jsonError("Sfida non trovata");
}

$challengerId = (int)$row["id_sfidante"];
$challengedId = (int)$row["id_sfidato"];

if ($userId !== $challengerId && $userId !== $challengedId) {
  $conn->close();
  jsonError("Non autorizzato");
}

$isChallenger = ($userId === $challengerId);
$myScoreRaw = $isChallenger ? $row["punteggio_sfidante"] : $row["punteggio_sfidato"];
if ((string)$row["stato"] === "conclusa") {
  $conn->close();
  jsonError("Sfida gia conclusa");
}
if ($myScoreRaw !== null) {
  $conn->close();
  jsonError("Hai gia inviato il risultato");
}

$questionIds = json_decode((string)$row["domande_ids"], true);
if (!is_array($questionIds) || count($questionIds) === 0) {
  $conn->close();
  jsonError("Domande sfida non valide");
}
$questionIds = array_values(array_unique(array_filter(array_map("intval", $questionIds), fn($id) => $id > 0)));
if (count($questionIds) === 0) {
  $conn->close();
  jsonError("Domande sfida non valide");
}

$answersById = [];
foreach ($answersInput as $a) {
  if (!is_array($a) || !isset($a["id"])) continue;
  $qid = (int)$a["id"];
  if ($qid <= 0) continue;
  $val = $a["answer"] ?? null;
  if ($val === true || $val === false) {
    $answersById[$qid] = $val;
  } else {
    $answersById[$qid] = null;
  }
}

$placeholders = sqlInPlaceholders($questionIds);
$types = str_repeat("i", count($questionIds));
$stmtQ = $conn->prepare("SELECT id, risposta FROM quesiti WHERE id IN ($placeholders)");
$stmtQ->bind_param($types, ...$questionIds);
$stmtQ->execute();
$resQ = $stmtQ->get_result();

$correctById = [];
while ($q = $resQ->fetch_assoc()) {
  $correctById[(int)$q["id"]] = ((int)$q["risposta"]) === 1;
}
$stmtQ->close();

$score = 0;
$errors = 0;
$total = count($questionIds);
foreach ($questionIds as $qid) {
  $uAns = array_key_exists($qid, $answersById) ? $answersById[$qid] : null;
  $correct = array_key_exists($qid, $correctById) ? $correctById[$qid] : false;
  $isCorrect = ($uAns === $correct);
  if ($isCorrect) {
    $score++;
  } else {
    $errors++;
  }
}

if ($isChallenger) {
  $stmtUp = $conn->prepare("
    UPDATE sfide
    SET punteggio_sfidante = ?, stato = IF(stato = 'attesa', 'in_corso', stato)
    WHERE id = ? AND punteggio_sfidante IS NULL
  ");
} else {
  $stmtUp = $conn->prepare("
    UPDATE sfide
    SET punteggio_sfidato = ?, stato = IF(stato = 'attesa', 'in_corso', stato)
    WHERE id = ? AND punteggio_sfidato IS NULL
  ");
}
$stmtUp->bind_param("ii", $score, $challengeId);
$stmtUp->execute();
$affected = $stmtUp->affected_rows;
$stmtUp->close();

if ($affected <= 0) {
  $conn->close();
  jsonError("Risultato gia inviato");
}

$stmtAfter = $conn->prepare("
  SELECT
    stato,
    punteggio_sfidante,
    punteggio_sfidato
  FROM sfide
  WHERE id = ?
  LIMIT 1
");
$stmtAfter->bind_param("i", $challengeId);
$stmtAfter->execute();
$after = $stmtAfter->get_result()->fetch_assoc();
$stmtAfter->close();

$scoreA = $after["punteggio_sfidante"] === null ? null : (int)$after["punteggio_sfidante"];
$scoreB = $after["punteggio_sfidato"] === null ? null : (int)$after["punteggio_sfidato"];

if ($scoreA !== null && $scoreB !== null && (string)$after["stato"] !== "conclusa") {
  $stmtEnd = $conn->prepare("UPDATE sfide SET stato = 'conclusa' WHERE id = ?");
  $stmtEnd->bind_param("i", $challengeId);
  $stmtEnd->execute();
  $stmtEnd->close();
  $after["stato"] = "conclusa";
}

$myFinalScore = $isChallenger ? $scoreA : $scoreB;
$oppFinalScore = $isChallenger ? $scoreB : $scoreA;

$result = "in_attesa";
if ($myFinalScore !== null && $oppFinalScore !== null) {
  if ($myFinalScore > $oppFinalScore) {
    $result = "vinta";
  } elseif ($myFinalScore < $oppFinalScore) {
    $result = "persa";
  } else {
    $result = "pareggio";
  }
}

$conn->close();

jsonSuccess([
  "errors" => $errors,
  "total" => $total,
  "esito" => $errors <= 3 ? "superato" : "respinto",
  "challenge_status" => (string)$after["stato"],
  "challenge_result" => $result,
  "my_score" => $myFinalScore,
  "opponent_score" => $oppFinalScore,
  "opponent" => $isChallenger ? (string)$row["sfidato_username"] : (string)$row["sfidante_username"]
]);
