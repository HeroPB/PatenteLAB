<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();

$username = post("username");
$email    = post("email");
$password = post("password");

if ($username === "" || $email === "" || $password === "") {
  jsonError("Username, email e password obbligatori");
}

validateUsername($username, "Username non valido (Solo lettere minuscole, 3-20 caratteri, '_' e '.' inclusi)");
validateEmail($email);
validatePassword($password, "La Password deve essere 6-72 caratteri");

$conn = dbConnect();

$stmt = $conn->prepare("SELECT id FROM utenti WHERE username = ? OR email = ?");

$stmt->bind_param("ss", $username, $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
  $stmt->close();
  $conn->close();
  jsonError("Username o email già in uso");
}
$stmt->close();

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO utenti (username, email, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $email, $hash);


if (!$stmt->execute()) {
  $stmt->close();
  $conn->close();
  jsonError("Errore durante la registrazione");
}

$userId = $stmt->insert_id;
$stmt->close();
$conn->close();


session_regenerate_id(true);
$_SESSION["user"] = ["id" => (int)$userId, "username" => $username];

jsonSuccess(
  ["user" => ["id" => (int)$userId, "username" => $username]],
  "Registrazione completata"
);
