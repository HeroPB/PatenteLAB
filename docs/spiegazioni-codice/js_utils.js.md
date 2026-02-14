# Spiegazione di `js/utils.js`

## Scopo del file
È una libreria di funzioni riutilizzabili per il frontend (query DOM, classi CSS, helper UI).

## Funzioni una per una
- `$(sel, root = document)`
  - Restituisce il **primo elemento** che corrisponde al selettore CSS.
- `$all(sel, root = document)`
  - Restituisce **tutti gli elementi** trovati, convertiti in array.
- `$id(id)`
  - Shortcut di `document.getElementById`.
- `show(el)`
  - Rimuove classe `hidden` (mostra elemento).
- `hide(el)`
  - Aggiunge classe `hidden` (nasconde elemento).
- `addClass(el, className)` / `removeClass(el, className)`
  - Utility per manipolare classi CSS in sicurezza.
- `createCustomP(container, msg, color)`
  - Svuota container, crea `<p>` con colore personalizzato e testo.
- `makeIcon(name, color, sizePx)`
  - Crea uno `<span>` compatibile con Material Symbols.
- `makeImgThumb(src)`
  - Crea `<img>` miniatura puntando a `../immagini/quiz/<src>`.

## Perché è importante
Riduce duplicazione: invece di riscrivere sempre query/select/classList, i file principali chiamano queste helper.
