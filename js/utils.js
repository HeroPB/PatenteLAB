"use strict";

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function $id(id) {
  return document.getElementById(id);
}

export function show(el) {
  if (el) el.classList.remove("hidden");
}

export function hide(el) {
  if (el) el.classList.add("hidden");
}

export function addClass(el, className) {
  if (el) el.classList.add(className);
}

export function removeClass(el, className) {
  if (el) el.classList.remove(className);
}


export function createCustomP(container, msg, color) {
  if (!container) return;
  container.replaceChildren();
  const p = document.createElement("p");
  p.style.color = color;
  p.textContent = msg;
  container.appendChild(p);
}

export function makeIcon(name, color, sizePx) {
  const s = document.createElement("span");
  s.className = "material-symbols-outlined";
  s.style.color = color;
  if (sizePx) s.style.fontSize = sizePx + "px";
  s.textContent = name;
  return s;
}

export function makeImgThumb(src) {
  const img = document.createElement("img");
  img.src = "../immagini/quiz/" + src;
  img.className = "storico-thumb";
  img.alt = "";
  return img;
}
