<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$userId = currentUserId();
$conn = dbConnect();

$stmt = $conn->prepare("
  SELECT
    COUNT(*) as totale,
    COALESCE(SUM(CASE WHEN esito='superato' THEN 1 ELSE 0 END),0) as superati,
    COALESCE(ROUND(AVG(errori),1),0) as media_errori
  FROM cronologia_quiz
  WHERE id_utente = ?
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

$totale = (int)$row["totale"];
$superati = (int)$row["superati"];
$mediaErrori = floatval($row["media_errori"]);
$percentuale = $totale > 0 ? round(($superati / $totale) * 100) : 0;

$stmt->close();
$conn->close();

jsonSuccess([
  "totale" => $totale,
  "superati" => $superati,
  "percentuale" => $percentuale,
  "media_errori" => $mediaErrori
]);
