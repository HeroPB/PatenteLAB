CREATE TABLE IF NOT EXISTS cronologia_quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utente INT NOT NULL,
    punteggio INT NOT NULL,
    totale_domande INT NOT NULL,
    errori INT NOT NULL,
    esito ENUM('superato', 'respinto') NOT NULL,
    data_svolgimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utente) REFERENCES utenti(id) ON DELETE CASCADE
) ENGINE = InnoDB;
ALTER TABLE cronologia_quiz
ADD COLUMN IF NOT EXISTS risposte_json JSON DEFAULT NULL;