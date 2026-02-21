<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$userId = currentUserId();
$conn = dbConnect();

$stmt = $conn->prepare("
  SELECT
    s.id,
    s.id_sfidante,
    s.id_sfidato,
    s.punteggio_sfidante,
    s.punteggio_sfidato,
    s.stato,
    s.data_creazione,
    u1.username AS sfidante_username,
    u2.username AS sfidato_username
  FROM sfide s
  JOIN utenti u1 ON u1.id = s.id_sfidante
  LEFT JOIN utenti u2 ON u2.id = s.id_sfidato
  WHERE s.id_sfidante = ? OR s.id_sfidato = ?
  ORDER BY s.data_creazione DESC
  LIMIT 30
");
$stmt->bind_param("ii", $userId, $userId);
$stmt->execute();
$res = $stmt->get_result();

$challenges = [];
while ($row = $res->fetch_assoc()) {
  $isChallenger = ((int)$row["id_sfidante"] === $userId);

  $myScoreRaw = $isChallenger ? $row["punteggio_sfidante"] : $row["punteggio_sfidato"];
  $oppScoreRaw = $isChallenger ? $row["punteggio_sfidato"] : $row["punteggio_sfidante"];

  $myScore = $myScoreRaw === null ? null : (int)$myScoreRaw;
  $oppScore = $oppScoreRaw === null ? null : (int)$oppScoreRaw;

  $status = (string)$row["stato"];
  $canPlay = ($myScore === null) && ($status !== "conclusa");

  $result = "in_attesa";
  if ($myScore !== null && $oppScore !== null) {
    if ($myScore > $oppScore) {
      $result = "vinta";
    } elseif ($myScore < $oppScore) {
      $result = "persa";
    } else {
      $result = "pareggio";
    }
  }

  $challenges[] = [
    "id" => (int)$row["id"],
    "opponent" => $isChallenger ? (string)$row["sfidato_username"] : (string)$row["sfidante_username"],
    "role" => $isChallenger ? "sfidante" : "sfidato",
    "status" => $status,
    "my_score" => $myScore,
    "opponent_score" => $oppScore,
    "can_play" => $canPlay,
    "result" => $result,
    "created_at" => (string)$row["data_creazione"]
  ];
}

$stmt->close();
$conn->close();

jsonSuccess([
  "challenges" => $challenges
]);
