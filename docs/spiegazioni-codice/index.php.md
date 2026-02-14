# Spiegazione di `index.php`

## Cosa fa questo file
Questo file è una **porta di ingresso**: quando il browser apre `index.php`, il server non mostra contenuto PHP ma invia subito un **redirect HTTP** verso `./html/index.html`.

## Istruzioni presenti
- `header("Location: ./html/index.html");` dice al browser: "vai a questa pagina".
- `exit;` interrompe immediatamente l'esecuzione, così non viene inviato altro output.

## Perché è utile
- Permette di mantenere una root semplice (`/`) che porta sempre alla pagina principale HTML.
- Evita che il browser resti su un endpoint PHP tecnico.
