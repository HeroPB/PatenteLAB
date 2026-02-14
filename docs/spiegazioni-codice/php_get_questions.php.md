# Spiegazione di `php/get_questions.php`

## Scopo
Fornisce al quiz 30 domande casuali dal database.

## Flusso
1. Connessione DB.
2. Query SQL:
   - prende `id, testo, immagine, risposta` da `quesiti`
   - usa `ORDER BY RAND()`
   - limita a 30 righe.
3. Converte ogni riga in formato frontend:
   - `text`
   - `image` (path completo o `null`)
   - `correct` boolean (`true/false`).
4. Risponde con array JSON.

## Nota
Questo endpoint non richiede login nel codice attuale.
