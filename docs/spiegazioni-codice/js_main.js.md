# Spiegazione di `js/main.js`

## Scopo generale
Controlla la pagina dashboard/app principale:
- menu laterale,
- sezioni visualizzate,
- stato login/logout,
- caricamento statistiche,
- storico partite,
- domande più sbagliate.

## Stato globale
- `restrictedViews`: viste protette (`storico`, `amici`).
- `isUserLoggedIn`: booleano aggiornato dopo controllo sessione.

## Funzioni principali

### `setActiveMenu(viewName)`
- Se la vista è protetta e utente non loggato: forza apertura login.
- Aggiorna bottone menu attivo (`is-active`).
- Nasconde tutte le `.view` e mostra solo `#view-<nome>`.
- Cambia titolo topbar in base alla vista.
- Se necessario richiama `loadStorico()` o `loadOstiche()`.

### `setupSidebarToggle()`
- Apre/chiude sidebar col pulsante hamburger.
- Gestisce click sui bottoni menu usando event delegation.

### `setLoggedIn(isLoggedIn)`
- Aggiorna stato login in memoria.
- Mostra/nasconde pulsanti Login/Register/Logout.
- Se utente esce da sessione e sta su vista protetta, torna a dashboard.
- Blocca/sblocca card con `data-lockable='true'`.
- Mostra/nasconde blocco statistiche e carica stats quando loggato.

### `loadSessionStatus()`
- GET `session_status.php`, interpreta `data.logged`, aggiorna UI.
- In caso errore rete: assume non loggato.

### `setupLogout()`
- Al click su logout chiama API `logout.php` e resetta UI.

### `loadStats()`
- Legge JSON da `get_stats.php` e aggiorna numeri dashboard.

### `loadOstiche()`
- Mostra stato caricamento.
- Chiede `get_most_wrong.php`.
- Renderizza lista domande più sbagliate con ranking, testo, categoria, errori e immagine.

### `loadStorico()`
- Chiede `get_history.php`.
- Renderizza elenco partite usando `renderStoricoItemElement`.

### `renderStoricoItemElement(item)`
- Costruisce card partita (esito, punteggio, errori, data).
- Se esistono risposte dettagliate, rende espandibile la card.
- Per ogni risposta mostra:
  - testo domanda,
  - risposta utente,
  - risposta corretta,
  - icona corretto/errato,
  - eventuale miniatura immagine.

### `init()`
- Entry point all'evento `DOMContentLoaded`.
- Imposta vista dashboard, prepara sidebar/logout e carica stato sessione.

## Concetti JS fondamentali usati
- **Manipolazione DOM dinamica** (`createElement`, `append`, classi CSS).
- **Fetch API** per chiamate server.
- **Programmazione asincrona** con `async/await`.
- **Rendering condizionale** in base allo stato utente.
