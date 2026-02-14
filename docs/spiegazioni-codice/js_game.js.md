# Spiegazione di `js/game.js`

## Scopo generale
Gestisce tutta la logica della simulazione quiz:
- caricamento domande,
- timer,
- risposte Vero/Falso,
- flag delle domande,
- invio risultato al backend,
- mostra esito finale.

## Costanti e stato
- `TOTAL_QUESTIONS = 30`
- `TIME_LIMIT_MINUTES = 20`
- Stato runtime: `questions`, indice corrente, risposte utente, flag, timer, stato fine partita.

## Funzioni principali

### `initGame()`
Flusso iniziale:
1. `fetchQuestions()`
2. `renderSidebar()`
3. `startTimer()`
4. `loadQuestion(0)`
5. `setupEvents()`

### `fetchQuestions()`
- Mostra “Caricamento...”.
- Chiama `../php/get_questions.php`.
- Salva array domande.
- Se vuoto, segnala errore.

### `renderSidebar()`
- Ricostruisce griglia bottoni domanda.
- Applica classi visuali (`is-active`, `is-answered`, `is-flagged`, `is-correct/is-wrong`).
- Aggiorna contatore risposte date.

### `loadQuestion(index)`
- Sicurezza su indice valido.
- Aggiorna testo domanda, numero corrente, immagine (se presente).
- Aggiorna stato pulsante flag.
- Ricalcola bottoni risposta e sidebar.

### `updateAnswerButtons()`
- Prima della fine: evidenzia scelta utente.
- Dopo la fine: mostra corretta/sbagliata con classi dedicate.

### `handleAnswer(answer)`
- Salva risposta corrente.
- Aggiorna UI.
- Passa automaticamente alla domanda successiva con piccolo delay.
- Richiama `checkCompletion()`.

### `checkCompletion()`
- Se tutte le domande hanno risposta, mostra pulsante invio esame.

### `toggleFlag()`
- Marca/smarca domanda corrente come da rivedere.

### `startTimer()` + `updateTimerDisplay()`
- Countdown a 1 secondo.
- Aggiorna testo `mm:ss` e barra progresso.
- Se tempo finisce, chiama `finishGame()`.

### `setupEvents()`
Aggancia interazioni UI:
- click su Vero/Falso,
- invio esame,
- uscita,
- tasto Home,
- chiusura modale risultato,
- scorciatoie tastiera (`ArrowLeft`, `ArrowRight`, `F`).

### `finishGame()`
- Ferma timer, blocca pulsanti quiz.
- Costruisce payload con array `{id, answer}`.
- POST a `save_result.php`.
- Se API fallisce, calcola errori localmente come fallback.
- Mostra modale con esito (superato/respinto) e numero errori.
- Rerenderizza sidebar in modalità review.

## Cosa imparare da questo file
- Gestione stato applicativo lato client.
- Distinzione tra logica e rendering.
- Robustezza: fallback locale se backend non risponde correttamente.
