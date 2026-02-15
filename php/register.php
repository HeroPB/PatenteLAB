<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();

$username = post("username");
$email    = post("email");
$password = post("password");

if ($username === "" || $email === "" || $password === "") {
  jsonResponse(["status" => "error", "message" => "Username, email e password obbligatori"], 400);
}

validateUsername($username, "Username non valido (3-20 car., minuscole, numeri, . e _)");
validateEmail($email);
validatePassword($password, "Password deve essere 6-72 caratteri");

$conn = dbConnect();

// Controlla se username o email sono già in uso
$stmt = $conn->prepare("SELECT id FROM utenti WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $username, $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
  $stmt->close();
  $conn->close();
  jsonResponse(["status" => "error", "message" => "Username o email già in uso"], 409);
}
$stmt->close();

// hash password
$hash = password_hash($password, PASSWORD_DEFAULT);

// inserimento
$stmt = $conn->prepare("INSERT INTO utenti (username, email, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $email, $hash);

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
