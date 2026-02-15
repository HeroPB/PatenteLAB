# Spiegazione di `js/auth.js`

## Scopo del file
Gestisce i due form di autenticazione lato browser:
1. **Login** (`loginForm`)
2. **Registrazione** (`registerForm`)

Usa `fetch` per inviare i dati ai file PHP API.

## Import
- `import { $id } from "./utils.js";`
  - `$id("...")` recupera un elemento tramite `id`.

## Flusso login
1. Cerca il form con id `loginForm`.
2. Se esiste, aggancia listener `submit`.
3. Usa `checkValidity()` (validazione HTML5 del browser).
4. Se valido, blocca submit classico con `e.preventDefault()`.
5. Crea `FormData(loginForm)`.
6. Fa POST su `../php/login.php`.
7. Legge JSON risposta.
8. Se `status === "success"` reindirizza a `index.html`, altrimenti mostra `alert`.

## Flusso registrazione
Uguale al login ma invia a `../php/register.php` e mostra messaggio specifico in caso di errore.

## Cosa imparare qui (base JS)
- **Event listener**: codice eseguito quando succede un evento.
- **async/await**: modo leggibile per aspettare risposte HTTP.
- **FormData**: oggetto per serializzare campi form senza farlo manualmente.
