<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();
$username = post("username");
$password = post("password");

if ($username === "" || $password === "") {
  jsonResponse(["status" => "error", "message" => "Username e password obbligatori"], 400);
}

validateUsername($username);
validatePassword($password);

$conn = dbConnect();

$stmt = $conn->prepare("SELECT id, username, password FROM utenti WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();

$res = $stmt->get_result();
$row = $res ? $res->fetch_assoc() : null;

$stmt->close();
$conn->close();

if (!$row || !password_verify($password, $row["password"])) {
  jsonResponse(["status" => "error", "message" => "Credenziali non valide"], 401);
}

session_regenerate_id(true);
$_SESSION["user"] = ["id" => (int)$row["id"], "username" => (string)$row["username"]];

jsonResponse([
  "status" => "success",
  "message" => "Login effettuato",
  "user" => ["id" => (int)$row["id"], "username" => (string)$row["username"]]
]);
