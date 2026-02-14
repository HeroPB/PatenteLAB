# Spiegazione di `php/test_security.php`

## Scopo
Script di test automatico (manuale) per provare payload malevoli su login/registrazione.

## Funzione presente: `testEndpoint($url, $data, $testName)`
Questa funzione:
1. Stampa info del test.
2. Invia richiesta POST con cURL.
3. Mantiene cookie sessione (`COOKIEJAR`/`COOKIEFILE`).
4. Stampa status HTTP e body risposta.
5. Fa analisi base “accettato/rifiutato” e controllo presenza `<script>`.

## Test lanciati nello script
1. SQL Injection su login (`' OR '1'='1`).
2. XSS su registrazione (`<script>alert(1)</script>`).
3. XSS su login.
4. SQL Injection stile `DROP TABLE` su registrazione.

## Importante
È un file di diagnostica, non endpoint applicativo per utenti finali.
