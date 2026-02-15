<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
requireLogin();

$userId = currentUserId();
$conn = dbConnect();

$stmt = $conn->prepare(
    "SELECT DISTINCT q.id, q.testo, q.immagine, MAX(e.data_errore) AS ultimo_errore
   FROM errori_ripasso e
   JOIN quesiti q ON e.id_quesito = q.id
   WHERE e.id_utente = ?
   GROUP BY q.id
   ORDER BY ultimo_errore DESC"
);
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

$questions = [];
while ($row = $res->fetch_assoc()) {
    $questions[] = [
        "id"       => (int)$row["id"],
        "testo"    => $row["testo"],
        "immagine" => $row["immagine"],
        "data"     => $row["ultimo_errore"]
    ];
}

$stmt->close();
$conn->close();

jsonSuccess(["questions" => $questions]);
