# Spiegazione di `php/get_stats.php`

## Scopo
Calcola statistiche aggregate dell'utente loggato.

## Cosa calcola
- Numero totale quiz fatti (`totale`).
- Numero quiz superati (`superati`).
- Media errori (`media_errori`).
- Percentuale superamento (`percentuale`).

## Flusso
1. Sessione JSON + `requireLogin`.
2. Query SQL aggregata su `cronologia_quiz` filtrata per `id_utente`.
3. Cast dei valori a tipi numerici corretti.
4. Calcolo percentuale lato PHP.
5. JSON di risposta `status: success`.
