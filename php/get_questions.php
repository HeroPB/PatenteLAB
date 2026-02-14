<?php
require_once __DIR__ . "/_utils.php";

header('Content-Type: application/json');

$conn = dbConnect();

// Fetch 30 random questions
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
        // Handle image path (if null, return null)
        "image" => $row['immagine'] ? "../immagini/quiz/" . $row['immagine'] : null,
        // Convert boolean/tinyint to actual boolean for JS
        "correct" => ((int)$row['risposta']) === 1
    ];
}

$conn->close();

jsonResponse($questions);
