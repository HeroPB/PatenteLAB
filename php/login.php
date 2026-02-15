<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();

$username = post("username");
$email    = post("email");
$password = post("password");

if ($username === "" || $email === "" || $password === "") {
  jsonError("Username, email e password obbligatori", 400);
}

validateUsername($username);
validateEmail($email);
validatePassword($password);

$conn = dbConnect();

$stmt = $conn->prepare("SELECT id, username, email, password FROM utenti WHERE username = ? AND email = ?");
$stmt->bind_param("ss", $username, $email);
$stmt->execute();

$res = $stmt->get_result();
$row = $res ? $res->fetch_assoc() : null;

$stmt->close();
$conn->close();

if (!$row || !password_verify($password, $row["password"])) {
  jsonError("Credenziali non valide", 401);
}

session_regenerate_id(true);
$_SESSION["user"] = ["id" => (int)$row["id"], "username" => (string)$row["username"]];

jsonSuccess(
  ["user" => ["id" => (int)$row["id"], "username" => (string)$row["username"]]],
  "Login effettuato"
);
