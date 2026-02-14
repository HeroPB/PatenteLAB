<?php
require_once __DIR__ . "/_utils.php";

header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user'])) {
    jsonResponse(["status" => "error", "message" => "Utente non loggato"], 401);
}

$userId = $_SESSION['user']['id'];
$conn = dbConnect();

$stmt = $conn->prepare("SELECT id, punteggio, totale_domande, errori, esito, data_svolgimento, risposte_json FROM cronologia_quiz WHERE id_utente = ? ORDER BY data_svolgimento DESC LIMIT 50");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
$index = 0;
// We collect all rows first, then number them in reverse so "Partita 1" is the oldest
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

$totalRows = count($rows);
foreach ($rows as $i => $row) {
    $risposte = $row['risposte_json'] ? json_decode($row['risposte_json'], true) : null;
    $history[] = [
        "numero" => $totalRows - $i,
        "punteggio" => (int)$row['punteggio'],
        "totale" => (int)$row['totale_domande'],
        "errori" => (int)$row['errori'],
        "esito" => $row['esito'],
        "data" => $row['data_svolgimento'],
        "risposte" => $risposte
    ];
}

$stmt->close();
$conn->close();

jsonResponse(["status" => "success", "history" => $history]);
