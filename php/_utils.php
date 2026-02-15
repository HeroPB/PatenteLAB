<?php
require_once __DIR__ . "/database.php";

function jsonResponse($data, int $httpCode = 200): void
{
  http_response_code($httpCode);
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode($data);
  exit;
}

function startJson(): void
{
  header("Content-Type: application/json; charset=utf-8");
}

function startJsonSession(): void
{
  startJson();
  if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
  }
}

function dbConnect(): mysqli
{
  $conn = new mysqli(DBHOST, DBUSER, DBPASS, DBNAME);
  if ($conn->connect_error) {
    jsonResponse(["status" => "error", "message" => "DB connection failed"], 500);
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
    jsonResponse(["status" => "error", "message" => "JSON non valido"], 400);
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
    jsonResponse(["status" => "error", "message" => $msg], 401);
  }
}

function currentUserId(): int
{
  return (int)$_SESSION["user"]["id"];
}

function validateUsername(string $username, string $msg = "Username non valido"): void
{
  if (!preg_match('/^[a-z][a-z0-9._]{2,19}$/', $username)) {
    jsonResponse(["status" => "error", "message" => $msg], 400);
  }
}

function validateEmail(string $email, string $msg = "Email non valida"): void
{
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(["status" => "error", "message" => $msg], 400);
  }
}

function validatePassword(string $password, string $msg = "Password non valida"): void
{
  if (strlen($password) < 6 || strlen($password) > 72) {
    jsonResponse(["status" => "error", "message" => $msg], 400);
  }
}
