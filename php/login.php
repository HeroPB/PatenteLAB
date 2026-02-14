<?php
session_start();
require_once __DIR__ . "/_utils.php";



$username = post("username");
$password = post("password");

if ($username === "" || $password === "") {
  jsonResponse(["status" => "error", "message" => "Username e password obbligatori"], 400);
}

if (!preg_match('/^[a-z][a-z0-9._]{2,19}$/', $username)) {
  jsonResponse(["status" => "error", "message" => "Username non valido"], 400);
}

if (strlen($password) < 6 || strlen($password) > 72) {
  jsonResponse(["status" => "error", "message" => "Password non valida"], 400);
}

$conn = dbConnect();

$stmt = $conn->prepare("SELECT id, username, password FROM utenti WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();

$res = $stmt->get_result();
$row = $res ? $res->fetch_assoc() : null;

$stmt->close();
$conn->close();

if (!$row) {
  jsonResponse(["status" => "error", "message" => "Credenziali non valide"], 401);
}

if (!password_verify($password, $row["password"])) {
  jsonResponse(["status" => "error", "message" => "Credenziali non valide"], 401);
}

// ok: crea sessione
session_regenerate_id(true);
$_SESSION["user"] = ["id" => (int)$row["id"], "username" => (string)$row["username"]];

jsonResponse([
  "status" => "success",
  "message" => "Login effettuato",
  "user" => ["id" => (int)$row["id"], "username" => (string)$row["username"]]
]);
