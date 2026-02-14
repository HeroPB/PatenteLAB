# Spiegazione di `php/get_most_wrong.php`

## Scopo
Elenca le domande sbagliate più spesso, basandosi sulla tabella `errori_ripasso`.

## Come funziona
1. Connessione DB.
2. Query con JOIN tra `errori_ripasso` e `quesiti`.
3. `COUNT(e.id)` per contare errori per ogni quesito.
4. Ordinamento decrescente per errori.
5. Limite a 20 record.
6. Conversione in array JSON con campi utili (`testo`, `immagine`, `categoria`, `errori`).

## Nota
Nel codice attuale la classifica è globale, non filtrata per utente specifico.
