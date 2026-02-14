-- Database Creation
CREATE DATABASE IF NOT EXISTS patente_db;
USE patente_db;

-- Tables
CREATE TABLE IF NOT EXISTS utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    data_registrazione DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quesiti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    testo TEXT NOT NULL,
    immagine VARCHAR(255) DEFAULT NULL,
    risposta TINYINT(1) NOT NULL, -- 1 = Vero, 0 = Falso
    categoria VARCHAR(50) NOT NULL,
    spiegazione TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sfide (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_sfidante INT NOT NULL,
    id_sfidato INT DEFAULT NULL,
    domande_ids JSON NOT NULL, -- Requires MySQL 5.7+
    punteggio_sfidante INT DEFAULT NULL,
    punteggio_sfidato INT DEFAULT NULL,
    stato ENUM('attesa', 'in_corso', 'conclusa') DEFAULT 'attesa',
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sfidante) REFERENCES utenti(id) ON DELETE CASCADE,
    FOREIGN KEY (id_sfidato) REFERENCES utenti(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS errori_ripasso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utente INT NOT NULL,
    id_quesito INT NOT NULL,
    data_errore DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utente) REFERENCES utenti(id) ON DELETE CASCADE,
    FOREIGN KEY (id_quesito) REFERENCES quesiti(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sample Data for Quesiti
INSERT INTO quesiti (testo, risposta, categoria, spiegazione) VALUES
('Il segnale raffigurato preannuncia un tratto di strada deformata', 1, 'Pericolo', 'Il segnale indica una strada deformata o dissestata.'),
('La patente di categoria B permette di guidare tutti i motocicli', 0, 'Patente', 'La patente B permette di guidare motocicli solo fino a 125cc e 11kW.'),
('In presenza del segnale raffigurato è consentito il sorpasso', 0, 'Divieti', 'Se c''è il divieto di sorpasso, non è consentito.'),
('L''uso delle luci di posizione è obbligatorio durante la sosta notturna fuori dai centri abitati', 1, 'Luci', 'Necessario per rendere visibile il veicolo.'),
('Il limite massimo di velocità sulle autostrade è di 150 km/h', 0, 'Velocità', 'Il limite ordinario è 130 km/h, salvo diversa segnalazione (in rari casi 150).'),
('L''assicurazione RCA copre i danni subiti dal conducente colpevole del sinistro', 0, 'Assicurazione', 'Copre i danni a terzi, non al conducente responsabile.'),
('Il segnale raffigurato indica l''inizio di un''autostrada', 1, 'Indicazione', 'Segnale verde con simbolo autostrada.'),
('Lo spazio di frenatura diminuisce se l''asfalto è bagnato', 0, 'Fisica', 'Aumenta perché diminuisce l''aderenza.'),
('È consentito trasportare bambini sui sedili anteriori se muniti di idonei sistemi di ritenuta', 1, 'Sicurezza', 'Sì, se disattivato airbag (se contro senso di marcia) e con seggiolino adatto.'),
('Il conducente deve dare la precedenza ai pedoni che hanno iniziato l''attraversamento sulle strisce', 1, 'Precedenza', 'Obbligo assoluto di precedenza ai pedoni sulle strisce.');
