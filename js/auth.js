"use strict";
import { $id } from "./utils.js";

const loginForm = $id("loginForm");

if (loginForm){
  loginForm.addEventListener("submit", async (e) => {
    /* HTML5 decides validity */
    if (!loginForm.checkValidity()) {
      return;
    }

    e.preventDefault();

    const fd = new FormData(loginForm);
    const res = await fetch("../php/login.php", {
      method: "POST",
      body: fd
    });

    const data = await res.json();

    if (data.status === "success") {
      location.href = "index.html";
    } else {
      alert(data.message || "Credenziali non valide");
    }
  });
}

const registerForm = $id("registerForm");

if (registerForm){
  registerForm.addEventListener("submit", async (e) => {
    if (!registerForm.checkValidity()) {
      return;
    }

    e.preventDefault();

    const fd = new FormData(registerForm);
    const res = await fetch("../php/register.php", {
      method: "POST",
      body: fd
    });

    const data = await res.json();

    if (data.status === "success") {
      location.href = "index.html";
    } else {
      alert(data.message || "Registrazione non riuscita");
    }
  });
}
