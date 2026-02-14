<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();

if (isset($_SESSION["user"]) && isset($_SESSION["user"]["id"]) && isset($_SESSION["user"]["username"])) {
  jsonResponse([
    "logged" => true,
    "user" => [
      "id" => (int)$_SESSION["user"]["id"],
      "username" => (string)$_SESSION["user"]["username"]
    ]
  ]);
}

jsonResponse(["logged" => false]);
