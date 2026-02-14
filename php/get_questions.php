<?php
require_once __DIR__ . "/_utils.php";

$conn = dbConnect();

$sql = "SELECT id, testo, immagine, risposta FROM quesiti ORDER BY RAND() LIMIT 30";
$result = $conn->query($sql);

if (!$result) {
    jsonResponse(["error" => "Database error"], 500);
}

$questions = [];
while ($row = $result->fetch_assoc()) {
    $questions[] = [
        "id" => (int)$row['id'],
        "text" => $row['testo'],
        "image" => $row['immagine'] ? "../immagini/quiz/" . $row['immagine'] : null,
        "correct" => ((int)$row['risposta']) === 1
    ];
}

$conn->close();

jsonResponse($questions);
