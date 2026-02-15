# Spiegazione di `php/session_status.php`

## Scopo
Dice al frontend se esiste una sessione valida.

## Comportamento
- Se in `$_SESSION['user']` ci sono `id` e `username`, ritorna:
  - `logged: true`
  - oggetto `user`
- Altrimenti ritorna `logged: false`

## Utilità pratica
Permette alla UI di mostrare/nascondere funzioni riservate senza chiedere all'utente di fare refresh manuale.
