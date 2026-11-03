(function () {
  const escena = document.getElementById("flipScene");
  const caraLogin = document.getElementById("caraLogin");
  const caraRegistro = document.getElementById("caraRegistro");
  const estadoLogin = document.getElementById("estadoLogin");
  const formLogin = document.getElementById("formLogin");
  const formRegistro = document.getElementById("formRegistro");

  function mostrarCara(cual) {
    const registro = cual === "registro";
    escena.classList.toggle("flipped", registro);
    caraLogin.toggleAttribute("inert", registro);
    caraRegistro.toggleAttribute("inert", !registro);
    document
      .getElementById(registro ? "regNombre" : "loginUsuario")
      .focus({ preventScroll: true });
  }

  document.getElementById("toSignup").addEventListener("click", () => mostrarCara("registro"));
  document.getElementById("toLogin").addEventListener("click", () => mostrarCara("login"));

  document.querySelectorAll(".mostrar-pass").forEach((boton) => {
    boton.addEventListener("click", () => {
      const campo = document.getElementById(boton.dataset.destino);
      const visible = campo.type === "password";
      campo.type = visible ? "text" : "password";
      boton.setAttribute("aria-pressed", String(visible));
      boton.querySelector("i").className = visible ? "bi bi-eye-slash-fill" : "bi bi-eye-fill";
    });
  });

  function mensajeDe(campo) {
    const valor = campo.value.trim();
    if (!valor) return campo.dataset.vacio;
    if (campo.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      return "Escribe un correo válido, por ejemplo nombre@correo.com.";
    }
    if (campo.minLength > 0 && campo.value.length < campo.minLength) {
      return `La contraseña necesita al menos ${campo.minLength} caracteres; ahora tiene ${campo.value.length}.`;
    }
    return "";
  }

  function pintar(campo) {
    const mensaje = mensajeDe(campo);
    document.getElementById(campo.id + "Error").textContent = mensaje;
    if (mensaje) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
    return mensaje === "";
  }

  function validar(form) {
    let primero = null;
    form.querySelectorAll("input[required]").forEach((campo) => {
      if (!pintar(campo) && !primero) primero = campo;
    });
    if (primero) primero.focus();
    return !primero;
  }

  document.querySelectorAll("input[required]").forEach((campo) => {
    campo.addEventListener("input", () => {
      if (campo.hasAttribute("aria-invalid")) pintar(campo);
    });
  });

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    estadoLogin.textContent = "";
    if (!validar(formLogin)) return;

    const usuario = document.getElementById("loginUsuario");
    const pass = document.getElementById("loginPass");
    const errorPass = document.getElementById("loginPassError");

    estadoLogin.textContent = "Comprobando tus datos…";
    const ok = await window.foroCuentas.ingresar(
      usuario.value,
      pass.value,
      document.getElementById("rememberSwitch").checked
    );

    if (ok) {
      estadoLogin.textContent = "Ingresando…";
      window.location.href = "index.html";
      return;
    }

    estadoLogin.textContent = "";
    errorPass.textContent =
      "Usuario o contraseña incorrectos. Revisa los datos o crea una cuenta con «Regístrate».";
    pass.setAttribute("aria-invalid", "true");
    pass.focus();
  });

  formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validar(formRegistro)) return;

    const nombre = document.getElementById("regNombre");
    const correo = document.getElementById("regCorreo");
    const pass = document.getElementById("regPass");

    const resultado = await window.foroCuentas.registrar({
      nombre: nombre.value,
      correo: correo.value,
      clave: pass.value,
    });

    if (!resultado.ok) {
      const destino = resultado.campo === "correo" ? correo : pass;
      document.getElementById(destino.id + "Error").textContent = resultado.mensaje;
      destino.setAttribute("aria-invalid", "true");
      destino.focus();
      return;
    }

    const correoRegistrado = correo.value.trim();
    formRegistro.reset();
    mostrarCara("login");
    document.getElementById("loginUsuario").value = correoRegistrado;
    document.getElementById("loginPass").focus();
    setTimeout(() => {
      estadoLogin.textContent = "Cuenta creada correctamente. Ahora puedes iniciar sesión.";
    }, 300);
  });
})();
