<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

if (isset($_SESSION["user"]) && isset($_SESSION["user"]["id"]) && isset($_SESSION["user"]["username"])) {
  echo json_encode([
    "logged" => true,
    "user" => [
      "id" => (int)$_SESSION["user"]["id"],
      "username" => (string)$_SESSION["user"]["username"]
    ]
  ]);
  exit;
}

echo json_encode([
  "logged" => false
]);
