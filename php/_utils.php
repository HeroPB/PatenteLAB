<?php
require_once __DIR__ . "/database.php";

/**
 * Invia una risposta JSON e termina lo script.
 */
function jsonResponse($data, int $httpCode = 200): void
{
  http_response_code($httpCode);
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode($data);
  exit;
}

/**
 * Header JSON (senza sessione).
 */
function startJson(): void
{
  header("Content-Type: application/json; charset=utf-8");
}

/**
 * Avvia sessione + header JSON.
 */
function startJsonSession(): void
{
  startJson();
  if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
  }
}

/**
 * Connessione DB (mysqli) con charset utf8mb4.
 */
function dbConnect(): mysqli
{
  $conn = new mysqli(DBHOST, DBUSER, DBPASS, DBNAME);
  if ($conn->connect_error) {
    jsonResponse(["status" => "error", "message" => "DB connection failed"], 500);
  }
  $conn->set_charset("utf8mb4");
  return $conn;
}

/**
 * Sanitizza una stringa (rimuove tag HTML e spazi extra).
 * Protezione base contro XSS.
 */
function sanitize(string $input): string
{
  return trim(strip_tags($input));
}

/**
 * Legge un valore da POST, lo sanitizza e fa trim.
 */
function post(string $key): string
{
  return isset($_POST[$key]) ? sanitize((string)$_POST[$key]) : "";
}

/**
 * Legge e decodifica JSON dal body.
 * (fetch con Content-Type: application/json)
 */
function readJsonBody(): array
{
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    jsonResponse(["status" => "error", "message" => "JSON non valido"], 400);
  }

  // Sanitizzazione ricorsiva
  array_walk_recursive($data, function (&$item) {
    if (is_string($item)) {
      $item = sanitize($item);
    }
  });

  return $data;
}

/**
 * Richiede utente loggato.
 */
function requireLogin(string $msg = "Utente non loggato"): void
{
  if (!isset($_SESSION["user"]) || !isset($_SESSION["user"]["id"])) {
    jsonResponse(["status" => "error", "message" => $msg], 401);
  }
}

/**
 * Ritorna l'id dell'utente loggato.
 */
function currentUserId(): int
{
  return (int)$_SESSION["user"]["id"];
}

/**
 * Validazioni base (coerenti con i tuoi endpoint).
 */
function validateUsername(string $username, string $msg = "Username non valido"): void
{
  if (!preg_match('/^[a-z][a-z0-9._]{2,19}$/', $username)) {
    jsonResponse(["status" => "error", "message" => $msg], 400);
  }
}

function validatePassword(string $password, string $msg = "Password non valida"): void
{
  if (strlen($password) < 6 || strlen($password) > 72) {
    jsonResponse(["status" => "error", "message" => $msg], 400);
  }
}
