<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();

$_SESSION = [];
session_destroy();

jsonResponse(["status" => "success", "message" => "Logout ok"]);
