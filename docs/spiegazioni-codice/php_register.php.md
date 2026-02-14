# Spiegazione di `php/register.php`

## Scopo
Registra un nuovo utente e lo logga automaticamente.

## Flusso
1. Importa utility e sessione JSON.
2. Legge username/password da POST.
3. Controlla campi obbligatori.
4. Valida formato username e lunghezza password.
5. Query preparata per verificare se username esiste.
6. Se già usato: errore 409 (conflitto).
7. Genera hash password con `password_hash`.
8. Inserisce nuovo record in `utenti`.
9. Rigenera sessione e salva user in `$_SESSION`.
10. Risponde con JSON `status: success`.

## Nota didattica
Non salva mai password in chiaro, solo hash.
