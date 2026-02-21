<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();

$email    = post("email");
$password = post("password");

if ($email === "" || $password === "") {
  jsonError("Email e password obbligatorie");
}

validateEmail($email);
validatePassword($password);

$conn = dbConnect();

$stmt = $conn->prepare("SELECT id, username, email, password FROM utenti WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();

$res = $stmt->get_result();
$row = $res ? $res->fetch_assoc() : null;

$stmt->close();
$conn->close();

if (!$row || !password_verify($password, $row["password"])) {
  jsonError("Credenziali non valide");
}

session_regenerate_id(true);
$_SESSION["user"] = ["id" => (int)$row["id"], "username" => (string)$row["username"]];

jsonSuccess(
  ["user" => ["id" => (int)$row["id"], "username" => (string)$row["username"]]],
  "Login effettuato"
);
