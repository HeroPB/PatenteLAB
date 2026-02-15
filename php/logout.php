<?php
require_once __DIR__ . "/_utils.php";
startJsonSession();

$_SESSION = [];
session_destroy();

jsonSuccess(null, "Logout ok");
