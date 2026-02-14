# Spiegazione di `php/_utils.php`

## Scopo generale
File centrale di utility backend, usato da quasi tutte le API PHP.

## Funzioni spiegate

### `jsonResponse($data, $httpCode = 200)`
- Imposta codice HTTP.
- Imposta header JSON UTF-8.
- Stampa JSON e chiude script.

### `startJson()`
- Imposta solo header JSON.

### `startJsonSession()`
- Imposta header JSON.
- Avvia sessione PHP se non già attiva.

### `dbConnect()`
- Crea connessione mysqli usando costanti DB.
- In caso errore ritorna JSON di errore 500.
- Imposta charset `utf8mb4`.

### `sanitize($input)`
- `strip_tags` + `trim`.
- Riduce rischio XSS base e rimuove spazi inutili.

### `post($key)`
- Legge parametro da `$_POST` e lo sanitizza.

### `readJsonBody()`
- Legge body raw (`php://input`).
- Esegue `json_decode`.
- Valida che sia un array.
- Sanitizza ricorsivamente tutte le stringhe interne.

### `requireLogin($msg = "Utente non loggato")`
- Verifica presenza utente in sessione.
- Se manca: errore JSON 401.

### `currentUserId()`
- Restituisce id utente corrente dalla sessione.

### `validateUsername($username, $msg)`
- Regex: inizia con lettera minuscola, poi lettere/numeri/`.`/`_`, lunghezza 3-20.

### `validatePassword($password, $msg)`
- Lunghezza minima 6, massima 72.

## Perché è fondamentale
Centralizza sicurezza e comportamento standard delle API.
