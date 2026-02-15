<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$data = readJsonBody();
$ids = isset($data["ids"]) ? $data["ids"] : [];

if (!is_array($ids) || count($ids) === 0) {
    jsonError("Nessuna domanda selezionata", 400);
}

$ids = array_map("intval", $ids);
$placeholders = implode(",", array_fill(0, count($ids), "?"));
$types = str_repeat("i", count($ids));

$conn = dbConnect();
$stmt = $conn->prepare("SELECT id, testo, immagine, risposta FROM quesiti WHERE id IN ($placeholders)");
$stmt->bind_param($types, ...$ids);
$stmt->execute();
$res = $stmt->get_result();

$questions = [];
while ($row = $res->fetch_assoc()) {
    $questions[] = [
        "id"      => (int)$row["id"],
        "text"    => $row["testo"],
        "image"   => $row["immagine"] ? "../immagini/quiz/" . $row["immagine"] : null,
        "correct" => ((int)$row["risposta"]) === 1
    ];
}

$stmt->close();
$conn->close();

jsonSuccess(["questions" => $questions]);
