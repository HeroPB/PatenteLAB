# ✅ Checklist Progetto – Sfida Asincrona

## 1. Database & Architettura Dati (MySQL)

- [ ] **Tabella Utenti**
  - Campi: id, user, pass, is_admin

- [ ] **Tabella Amicizie**
  - Campi: id, user_id_1, user_id_2, status (pending / accepted)
  - Sistema richiesta / accettazione amicizia

- [ ] **Tabella Sfide**
  - Campi: id, sfidante_id, sfidato_id, stato (waiting, finished), vincitore_id
  - Salvataggio lista domande
    - json_domande (es. `[12,45,67,...]`) **oppure**
    - tabella di collegamento

- [ ] **Tabella Risultati / Storico**
  - Tempi ed errori di ogni partita (Esame + Sfida)

- [ ] **Tabella Quesiti**
  - Campi: id, testo, img, risposta, categoria


## 2. Pagine e Navigazione (PHP / HTML)

- [ ] **index.php – Login**
  - [ ] Manuale utente (20–25 righe, linguaggio non tecnico)

- [ ] **home.php – Dashboard**
  - Menu principale

- [ ] **profilo.php**
  - Statistiche (grafici o tabelle)
  - Pulsante “Ripasso Errori”

- [ ] **amici.php**
  - Lista amici
  - Form “Cerca utente”
  - Lista “Sfide in arrivo” (accettazione)

- [ ] **gioco.php – Core**
  - File unico e parametrico
  - `mode=esame`
  - `mode=sfida&match_id=ID`

- [ ] **admin.php**
  - Gestione quesiti (aggiungi / modifica)


## 3. Logica Funzionale (Backend PHP & JS)

- [ ] **Motore di Gioco (JS)**
  - [ ] Timer (countdown Esame)
  - [ ] Cronometro (Sfida)
  - [ ] Caricamento domande AJAX
  - [ ] Fine partita → invio dati al PHP

- [ ] **Logica Sfida Asincrona (PHP)**
  - [ ] User A lancia sfida
  - [ ] Estrazione 10 domande random
  - [ ] Creazione record Sfida (waiting_player_2)
  - [ ] User B carica le stesse domande
  - [ ] Confronto errori e tempo
  - [ ] Determinazione vincitore
  - [ ] Aggiornamento record

- [ ] **Ripasso Errori**
  - Query SQL su quesiti presenti in errori_utente
