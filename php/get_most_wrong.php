<?php
require_once __DIR__ . "/_utils.php";

$conn = dbConnect();

$sql = "SELECT q.id, q.testo, q.immagine, q.categoria, COUNT(e.id) as num_errori
        FROM errori_ripasso e
        JOIN quesiti q ON e.id_quesito = q.id
        GROUP BY q.id
        ORDER BY num_errori DESC
        LIMIT 20";

$result = $conn->query($sql);
if (!$result) {
    jsonResponse(["status" => "error", "message" => "Errore DB"], 500);
}

$questions = [];
while ($row = $result->fetch_assoc()) {
    $questions[] = [
        "id" => (int)$row['id'],
        "testo" => $row['testo'],
        "immagine" => $row['immagine'],
        "categoria" => $row['categoria'],
        "errori" => (int)$row['num_errori']
    ];
}

$conn->close();
jsonResponse(["status" => "success", "questions" => $questions]);
