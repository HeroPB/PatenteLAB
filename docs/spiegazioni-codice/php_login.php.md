# Spiegazione di `php/login.php`

## Scopo
Autentica un utente tramite username/password.

## Flusso completo
1. Include `_utils.php`.
2. Avvia sessione + risposta JSON.
3. Legge e sanitizza `username` e `password` da POST.
4. Valida campi obbligatori.
5. Applica validazione formato username/password.
6. Connette al DB.
7. Query preparata: cerca utente per username.
8. Verifica password con `password_verify`.
9. Se ok:
   - rigenera ID sessione,
   - salva `$_SESSION['user']`.
10. Ritorna JSON success con dati base utente.

## Sicurezza importante
- Usa **prepared statement** (anti SQL injection).
- Password confrontata con hash (`password_verify`).
- Rigenerazione sessione riduce rischio session fixation.
