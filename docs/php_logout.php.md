# Spiegazione di `php/logout.php`

## Scopo
Termina la sessione utente corrente.

## Passi
1. Avvia sessione JSON.
2. Svuota `$_SESSION`.
3. Chiama `session_destroy()`.
4. Restituisce JSON di conferma.
