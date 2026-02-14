<?php
require_once __DIR__ . "/database.php";

function jsonResponse(array $data, int $httpCode = 200): void {
  http_response_code($httpCode);
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode($data);
  exit;
}

function dbConnect(): mysqli {
  $conn = new mysqli(DBHOST, DBUSER, DBPASS, DBNAME);
  if ($conn->connect_error) {
    jsonResponse(["status" => "error", "message" => "DB connection failed"], 500);
  }
  $conn->set_charset("utf8mb4");
  return $conn;
}

function post(string $key): string {
  return isset($_POST[$key]) ? trim((string)$_POST[$key]) : "";
}
