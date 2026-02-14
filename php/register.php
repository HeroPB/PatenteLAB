<?php
session_start();
require_once __DIR__ . "/_utils.php";

$username = post("username");
$password = post("password");

if ($username === "" || $password === "") {
  jsonResponse(["status" => "error", "message" => "Username e password obbligatori"], 400);
}

if (!preg_match('/^[a-z][a-z0-9._]{2,19}$/', $username)) {
  jsonResponse(["status" => "error", "message" => "Username non valido (3-20 car., minuscole, numeri, . e _)"], 400);
}

if (strlen($password) < 6 || strlen($password) > 72) {
  jsonResponse(["status" => "error", "message" => "Password deve essere 6-72 caratteri"], 400);
}

$conn = dbConnect();

// verifica username già esistente
$stmt = $conn->prepare("SELECT id FROM utenti WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
  $stmt->close();
  $conn->close();
  jsonResponse(["status" => "error", "message" => "Username già in uso"], 409);
}
$stmt->close();

// hash password
$hash = password_hash($password, PASSWORD_DEFAULT);

// inserimento
$stmt = $conn->prepare("INSERT INTO utenti (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hash);

if (!$stmt->execute()) {
  $stmt->close();
  $conn->close();
  jsonResponse(["status" => "error", "message" => "Errore durante la registrazione"], 500);
}

$userId = $stmt->insert_id;
$stmt->close();
$conn->close();

// login automatico dopo registrazione
session_regenerate_id(true);
$_SESSION["user"] = ["id" => (int)$userId, "username" => $username];

jsonResponse([
  "status" => "success",
  "message" => "Registrazione completata",
  "user" => ["id" => (int)$userId, "username" => $username]
]);
