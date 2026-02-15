# Spiegazione di `php/get_history.php`

## Scopo
Restituisce lo storico delle ultime 50 partite dell'utente loggato.

## Flusso
1. Sessione JSON e controllo login.
2. Query su `cronologia_quiz` ordinata per data decrescente.
3. Per ogni record:
   - decodifica `risposte_json` (se presente),
   - crea struttura più leggibile per frontend.
4. Aggiunge campo `numero` (indice partita in ordine cronologico inverso).
5. Restituisce `history` in JSON.

## Perché utile
Il frontend può mostrare non solo risultato sintetico ma anche dettaglio domanda per domanda.
