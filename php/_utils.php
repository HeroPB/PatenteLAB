<?php
require_once __DIR__ . "/database.php";

function jsonResponse($data): void
{
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode($data);
  exit;
}

function jsonSuccess($data = null, $message = null): void
{
  $payload = ["status" => "success"];
  if ($message !== null && $message !== "") {
    $payload["message"] = $message;
  }
  if ($data !== null) {
    $payload["data"] = $data;
  }
  jsonResponse($payload);
}

function jsonError($message, $data = null): void
{
  $payload = ["status" => "error", "message" => $message];
  if ($data !== null) {
    $payload["data"] = $data;
  }
  jsonResponse($payload);
}

function startJsonSession(): void
{
    header("Content-Type: application/json; charset=utf-8");
    if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
  }
}

function dbConnect(): mysqli
{
  $conn = new mysqli(DBHOST, DBUSER, DBPASS, DBNAME);
  if ($conn->connect_error) {
    jsonError("DB connection failed");
  }
  $conn->set_charset("utf8mb4");
  return $conn;
}

function sanitize(string $input): string
{
  return trim(strip_tags($input));
}

function post(string $key): string
{
  return isset($_POST[$key]) ? sanitize((string)$_POST[$key]) : "";
}

function readJsonBody(): array
{
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    jsonError("JSON non valido");
  }

  array_walk_recursive($data, function (&$item) {
    if (is_string($item)) {
      $item = sanitize($item);
    }
  });

    return $data;
}

function requireLogin(string $msg = "Utente non loggato"): void
{
  if (!isset($_SESSION["user"]) || !isset($_SESSION["user"]["id"])) {
    jsonError($msg);
  }
}

function currentUserId(): int
{
  return (int)$_SESSION["user"]["id"];
}

function validateUsername(string $username, string $msg = "Username non valido"): void
{
  if (!preg_match('/^[a-z][a-z0-9._]{2,19}$/', $username)) {
    jsonError($msg);
  }
}

function validateEmail(string $email, string $msg = "Email non valida"): void
{
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError($msg);
  }
}

function validatePassword(string $password, string $msg = "Password non valida"): void
{
  if (strlen($password) < 6 || strlen($password) > 72) {
    jsonError($msg);
  }
}

function sqlInPlaceholders(array $values): string
{
  return implode(",", array_fill(0, count($values), "?"));
}
