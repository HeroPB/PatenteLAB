<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$input = readJsonBody();
$username = isset($input["username"]) ? sanitize((string)$input["username"]) : "";

if ($username === "") {
  jsonError("Username avversario obbligatorio");
}

validateUsername($username, "Username avversario non valido");

$userId = currentUserId();
$conn = dbConnect();

$stmtUser = $conn->prepare("SELECT id FROM utenti WHERE username = ?");
$stmtUser->bind_param("s", $username);
$stmtUser->execute();
$rowUser = $stmtUser->get_result()->fetch_assoc();
$stmtUser->close();

if (!$rowUser) {
  $conn->close();
  jsonError("Utente non trovato");
}

$opponentId = (int)$rowUser["id"];
if ($opponentId === $userId) {
  $conn->close();
  jsonError("Non puoi sfidare te stesso");
}

$resQ = $conn->query("SELECT id FROM quesiti ORDER BY RAND() LIMIT 30");
if (!$resQ) {
  $conn->close();
  jsonError("Errore database");
}

$questionIds = [];
while ($row = $resQ->fetch_assoc()) {
  $questionIds[] = (int)$row["id"];
}

if (count($questionIds) === 0) {
  $conn->close();
  jsonError("Nessuna domanda disponibile");
}

$questionsJson = json_encode($questionIds);
$stmtIns = $conn->prepare(
  "INSERT INTO sfide (id_sfidante, id_sfidato, domande_ids, stato) VALUES (?, ?, ?, 'attesa')"
);
$stmtIns->bind_param("iis", $userId, $opponentId, $questionsJson);

if (!$stmtIns->execute()) {
  $stmtIns->close();
  $conn->close();
  jsonError("Impossibile creare la sfida");
}

$challengeId = (int)$stmtIns->insert_id;
$stmtIns->close();
$conn->close();

jsonSuccess([
  "challenge_id" => $challengeId
], "Sfida creata");
