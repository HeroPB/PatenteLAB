<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$challengeId = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
if ($challengeId <= 0) {
  jsonError("Sfida non valida");
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
  jsonError("Hai gia completato questa sfida");
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

$placeholders = sqlInPlaceholders($questionIds);
$types = str_repeat("i", count($questionIds));
$stmtQ = $conn->prepare("SELECT id, testo, immagine, risposta FROM quesiti WHERE id IN ($placeholders)");
$stmtQ->bind_param($types, ...$questionIds);
$stmtQ->execute();
$resQ = $stmtQ->get_result();

$rowsById = [];
while ($q = $resQ->fetch_assoc()) {
  $rowsById[(int)$q["id"]] = $q;
}
$stmtQ->close();

$questions = [];
foreach ($questionIds as $qid) {
  if (!isset($rowsById[$qid])) continue;
  $q = $rowsById[$qid];
  $questions[] = [
    "id" => (int)$q["id"],
    "text" => $q["testo"],
    "image" => $q["immagine"] ? "../immagini/quiz/" . $q["immagine"] : null,
    "correct" => ((int)$q["risposta"]) === 1
  ];
}

if (count($questions) === 0) {
  $conn->close();
  jsonError("Nessuna domanda disponibile");
}

if ((string)$row["stato"] === "attesa") {
  $stmtUp = $conn->prepare("UPDATE sfide SET stato = 'in_corso' WHERE id = ? AND stato = 'attesa'");
  $stmtUp->bind_param("i", $challengeId);
  $stmtUp->execute();
  $stmtUp->close();
}

$conn->close();

jsonSuccess([
  "challenge_id" => $challengeId,
  "opponent" => $isChallenger ? (string)$row["sfidato_username"] : (string)$row["sfidante_username"],
  "questions" => $questions
]);
