# Spiegazione di `php/save_result.php`

## Scopo
Salva il risultato della simulazione e dettaglio risposte dell'utente loggato.

## Prerequisiti
- Sessione attiva.
- Utente autenticato (`requireLogin`).
- Body JSON con `answers`.

## Flusso dettagliato
1. Legge utente da sessione (`currentUserId`).
2. Legge e valida JSON input.
3. Estrae id domande risposte.
4. Deduplica e filtra id validi.
5. Se nessun id valido: ritorna risultato vuoto.
6. Recupera dal DB le domande corrispondenti.
7. Confronta risposta utente con risposta corretta:
   - incrementa `score` o `errors`.
   - salva dettagli in `risposteDettaglio`.
   - registra id domande errate in `wrongQuestions`.
8. Determina esito:
   - `superato` se errori <= 3
   - `respinto` altrimenti.
9. Inserisce una riga in `cronologia_quiz`.
10. Inserisce errori in `errori_ripasso` (una riga per domanda errata).
11. Ritorna JSON finale con score/errori/esito.

## Funzioni/tecniche chiave usate
- `readJsonBody()` per input JSON sicuro.
- Confronto booleano stretto con `===`.
- Prepared statement per insert principali.
