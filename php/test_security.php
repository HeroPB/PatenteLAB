<?php

/**
 * TEST AUTOMATICO DI SICUREZZA (SQLi & XSS)
 * Esegui questo script da riga di comando o browser.
 */

$baseUrl = "http://localhost/PatenteLAB/php"; // Adatta se necessario

function testEndpoint($url, $data, $testName)
{
    echo "--------------------------------------------------\n";
    echo "TEST: $testName\n";
    echo "URL: $url\n";
    echo "PAYLOAD: " . print_r($data, true);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));

    // Per gestire i cookie di sessione
    curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookie.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookie.txt');

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "STATUS: $httpCode\n";
    echo "RESPONSE: $response\n";

    // Analisi base
    if ($httpCode === 200 && strpos($response, "success") !== false) {
        echo "[!] ESITO: Il server ha accettato la richiesta (POTENZIALE SUCCESSO/FALLIMENTO DIFF, CONTROLLA).\n";
        if (strpos($response, "<script>") !== false) {
            echo "[!!!] CRITICO: Trovato tag script nella risposta (XSS Possibile).\n";
        }
    } else {
        echo "[*] ESITO: Richiesta respinta o errore (Comportamento atteso per attacchi).\n";
    }
    echo "\n";
}

// 1. TEST SQL INJECTION SU LOGIN (Bypass Auth)
// Tenta di entrare senza password valida
testEndpoint(
    "$baseUrl/login.php",
    ["username" => "admin' OR '1'='1", "password" => "qualsiasi"],
    "SQL Injection Login Bypass (' OR '1'='1)"
);

// 2. TEST XSS SU REGISTRAZIONE
// Tenta di registrare un utente con script nel nome
testEndpoint(
    "$baseUrl/register.php",
    ["username" => "<script>alert(1)</script>", "password" => "password123"],
    "Stored XSS su Registrazione"
);

// 3. TEST XSS SU LOGIN (Reflected/Stored)
testEndpoint(
    "$baseUrl/login.php",
    ["username" => "<script>alert(1)</script>", "password" => "password123"],
    "XSS Payload su Login"
);

// 4. TEST SQL INJECTION SU REGISTRAZIONE
testEndpoint(
    "$baseUrl/register.php",
    ["username" => "testuser'; DROP TABLE utenti; --", "password" => "password123"],
    "SQL Injection (DROP TABLE)"
);
