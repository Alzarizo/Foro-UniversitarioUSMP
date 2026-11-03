(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CLAVE_PUBS = "foroMisPubs";

  let perfil = window.foroPerfil.leer();
  let borrador = { colorAvatar: perfil.colorAvatar, foto: perfil.foto };

  function ponerError(campo, mensaje) {
    const caja = $(campo.id + "Error");
    if (caja) caja.textContent = mensaje;
    campo.setAttribute("aria-invalid", "true");
  }

  function quitarError(campo) {
    const caja = $(campo.id + "Error");
    if (caja) caja.textContent = "";
    campo.removeAttribute("aria-invalid");
  }

  function limpiarAlEscribir(campos) {
    campos.forEach((c) =>
      c.addEventListener("input", () => {
        if (c.hasAttribute("aria-invalid")) quitarError(c);
      })
    );
  }

  function guardarPerfil(mensaje) {
    const ok = window.foroPerfil.guardar(perfil);
    window.foroPerfil.pintarCabecera();
    pintarResumen();
    window.mostrarAviso(
      ok ? mensaje : "No se pudo guardar: tu navegador tiene bloqueado el almacenamiento."
    );
  }

  function pintarAvatar(el, color, foto, texto) {
    el.className = el.className.replace(/avatar-(granate|vino|carbon|ambar)/g, "").trim() + " avatar-" + color;
    el.textContent = "";
    if (foto) {
      const img = document.createElement("img");
      img.src = foto;
      img.alt = "";
      img.className = "avatar-img";
      el.appendChild(img);
    } else {
      el.textContent = texto;
    }
  }

  function pintarResumen() {
    const ini = window.foroPerfil.iniciales(perfil);
    $("vistaNombre").textContent = (perfil.nombre + " " + perfil.apellidos).trim() || "Tu nombre";
    $("vistaUsuario").textContent = "@" + perfil.usuario;
    const academico = [perfil.carrera, perfil.ciclo ? "Ciclo " + perfil.ciclo : ""].filter(Boolean).join(" · ");
    $("vistaCarrera").textContent = !perfil.mostrarCarrera
      ? "Carrera oculta"
      : academico || "Completa tu carrera y ciclo en «Datos personales».";
    $("vistaBio").textContent = perfil.bio;
    pintarAvatar($("avatarVista"), borrador.colorAvatar, borrador.foto, ini);
    document.querySelectorAll(".selector-color .avatar").forEach((a) => (a.textContent = ini));
  }

  const f = {
    nombre: $("pNombre"),
    apellidos: $("pApellidos"),
    usuario: $("pUsuario"),
    correo: $("pCorreo"),
    carrera: $("pCarrera"),
    ciclo: $("pCiclo"),
    bio: $("pBio"),
  };

  function contarBio() {
    $("pBioContador").textContent = f.bio.value.length + " de 240 caracteres";
  }

  function rellenarDatos() {
    Object.keys(f).forEach((k) => (f[k].value = perfil[k]));
    contarBio();
  }

  f.bio.addEventListener("input", contarBio);
  limpiarAlEscribir([f.nombre, f.apellidos, f.usuario, f.correo]);

  $("descartarDatos").addEventListener("click", () => {
    rellenarDatos();
    [f.nombre, f.apellidos, f.usuario, f.correo].forEach(quitarError);
    window.mostrarAviso("Se descartaron los cambios.");
  });

  $("formDatos").addEventListener("submit", (e) => {
    e.preventDefault();
    let primero = null;
    const fallo = (campo, msg) => {
      ponerError(campo, msg);
      if (!primero) primero = campo;
    };
    [f.nombre, f.apellidos, f.usuario, f.correo].forEach(quitarError);

    if (!f.nombre.value.trim()) fallo(f.nombre, "Escribe tu nombre.");
    if (!f.apellidos.value.trim()) fallo(f.apellidos, "Escribe tus apellidos.");

    const usuario = f.usuario.value.trim();
    if (!usuario) fallo(f.usuario, "Escribe un nombre de usuario.");
    else if (!/^[a-z0-9._]{3,20}$/.test(usuario))
      fallo(f.usuario, "Usa de 3 a 20 caracteres: letras minúsculas sin tilde, números, punto o guion bajo.");
    else if (window.foroCuentas.enUso("usuario", usuario)) fallo(f.usuario, "Ese nombre de usuario ya está en uso. Prueba con otro.");

    const correo = f.correo.value.trim();
    if (!correo) fallo(f.correo, "Escribe tu correo electrónico.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      fallo(f.correo, "Escribe un correo válido, por ejemplo nombre@usmp.pe.");
    else if (window.foroCuentas.enUso("correo", correo)) fallo(f.correo, "Ya existe una cuenta con ese correo.");

    if (primero) {
      primero.focus();
      return;
    }

    perfil.nombre = f.nombre.value.trim();
    perfil.apellidos = f.apellidos.value.trim();
    perfil.usuario = usuario;
    perfil.correo = correo;
    perfil.carrera = f.carrera.value;
    perfil.ciclo = f.ciclo.value;
    perfil.bio = f.bio.value.trim();
    guardarPerfil("Datos personales guardados.");
  });

  document.querySelectorAll('input[name="colorAvatar"]').forEach((r) => {
    r.checked = r.value === perfil.colorAvatar;
    r.addEventListener("change", () => {
      borrador.colorAvatar = r.value;
      pintarResumen();
    });
  });

  function redimensionar(archivo) {
    return new Promise((resolver, rechazar) => {
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => {
        const lado = 256;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = lado;
        const ctx = canvas.getContext("2d");
        const recorte = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - recorte) / 2, (img.height - recorte) / 2, recorte, recorte, 0, 0, lado, lado);
        URL.revokeObjectURL(url);
        resolver(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        rechazar(new Error("imagen"));
      };
      img.src = url;
    });
  }

  $("pFoto").addEventListener("change", async (e) => {
    const campo = e.target;
    const archivo = campo.files[0];
    quitarError(campo);
    if (!archivo) return;
    if (!/^image\/(png|jpeg|webp)$/.test(archivo.type)) {
      ponerError(campo, "Ese archivo no es una imagen PNG, JPG o WebP.");
      campo.value = "";
      return;
    }
    if (archivo.size > 3 * 1024 * 1024) {
      ponerError(campo, "La imagen pesa más de 3 MB. Elige una más ligera.");
      campo.value = "";
      return;
    }
    try {
      borrador.foto = await redimensionar(archivo);
      pintarResumen();
      window.mostrarAviso("Foto cargada. Pulsa «Guardar avatar» para conservarla.");
    } catch (err) {
      ponerError(campo, "No se pudo leer la imagen. Prueba con otra.");
    }
    campo.value = "";
  });

  $("quitarFoto").addEventListener("click", () => {
    borrador.foto = "";
    pintarResumen();
    window.mostrarAviso("Foto quitada. Pulsa «Guardar avatar» para confirmar.");
  });

  $("formAvatar").addEventListener("submit", (e) => {
    e.preventDefault();
    perfil.colorAvatar = borrador.colorAvatar;
    perfil.foto = borrador.foto;
    guardarPerfil("Avatar guardado.");
  });

  const priv = {
    visibilidad: $("pVisibilidad"),
    mostrarCarrera: $("pMostrarCarrera"),
    mostrarActividad: $("pMostrarActividad"),
    avisoRespuestas: $("pAvisoRespuestas"),
    avisoMenciones: $("pAvisoMenciones"),
    resumenSemanal: $("pResumenSemanal"),
  };

  function rellenarPrivacidad() {
    priv.visibilidad.value = perfil.visibilidad;
    ["mostrarCarrera", "mostrarActividad", "avisoRespuestas", "avisoMenciones", "resumenSemanal"].forEach(
      (k) => (priv[k].checked = !!perfil[k])
    );
  }

  $("formPrivacidad").addEventListener("submit", (e) => {
    e.preventDefault();
    perfil.visibilidad = priv.visibilidad.value;
    ["mostrarCarrera", "mostrarActividad", "avisoRespuestas", "avisoMenciones", "resumenSemanal"].forEach(
      (k) => (perfil[k] = priv[k].checked)
    );
    guardarPerfil("Preferencias de privacidad guardadas.");
  });

  $("abrirA11y").addEventListener("click", () => {
    const boton = document.getElementById("a11yBtn");
    if (boton) boton.click();
  });

  const c = { actual: $("cActual"), nueva: $("cNueva"), repetir: $("cRepetir") };

  document.querySelectorAll(".mostrar-clave").forEach((b) => {
    b.addEventListener("click", () => {
      const campo = $(b.dataset.destino);
      const visible = campo.type === "password";
      campo.type = visible ? "text" : "password";
      b.setAttribute("aria-pressed", String(visible));
      b.firstChild.textContent = visible ? "Ocultar" : "Mostrar";
    });
  });

  function requisitos(valor) {
    return {
      largo: valor.length >= 8,
      numero: /\d/.test(valor),
      letra: /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(valor),
    };
  }

  c.nueva.addEventListener("input", () => {
    const r = requisitos(c.nueva.value);
    document.querySelectorAll("#cNuevaReq li").forEach((li) => {
      const cumple = r[li.dataset.req];
      li.classList.toggle("cumple", cumple);
      li.setAttribute("aria-label", li.textContent + (cumple ? ": cumplido" : ": pendiente"));
    });
  });

  limpiarAlEscribir([c.actual, c.nueva, c.repetir]);

  $("formClave").addEventListener("submit", (e) => {
    e.preventDefault();
    let primero = null;
    const fallo = (campo, msg) => {
      ponerError(campo, msg);
      if (!primero) primero = campo;
    };
    [c.actual, c.nueva, c.repetir].forEach(quitarError);

    if (!c.actual.value) fallo(c.actual, "Escribe tu contraseña actual.");

    const r = requisitos(c.nueva.value);
    if (!c.nueva.value) fallo(c.nueva, "Escribe una contraseña nueva.");
    else if (!(r.largo && r.numero && r.letra))
      fallo(c.nueva, "La contraseña nueva debe tener al menos 8 caracteres, una letra y un número.");
    else if (c.nueva.value === c.actual.value) fallo(c.nueva, "La contraseña nueva debe ser distinta de la actual.");

    if (!c.repetir.value) fallo(c.repetir, "Repite la contraseña nueva.");
    else if (c.repetir.value !== c.nueva.value) fallo(c.repetir, "Las contraseñas no coinciden.");

    if (primero) {
      primero.focus();
      return;
    }
    const formulario = e.target;
    window.foroCuentas.cambiarClave(c.actual.value, c.nueva.value).then((res) => {
      if (!res.ok) {
        fallo(c.actual, res.mensaje);
        c.actual.focus();
        return;
      }
      formulario.reset();
      document.querySelectorAll("#cNuevaReq li").forEach((li) => li.classList.remove("cumple"));
      window.mostrarAviso("Contraseña actualizada.");
    });
  });

  const dlg = $("dialogo");

  function confirmar(opts) {
    return new Promise((resolver) => {
      const previo = document.activeElement;
      $("dialogoTitulo").textContent = opts.titulo;
      $("dialogoTexto").textContent = opts.texto;
      $("dialogoAceptar").textContent = opts.aceptar;
      const campo = $("dialogoCampo");
      const input = $("dialogoInput");
      campo.hidden = !opts.palabra;
      input.value = "";
      if (opts.palabra) {
        $("dialogoEtiqueta").textContent = "Escribe " + opts.palabra + " para confirmar";
        $("dialogoAceptar").disabled = true;
      } else {
        $("dialogoAceptar").disabled = false;
      }

      const alEscribir = () => {
        $("dialogoAceptar").disabled = input.value.trim() !== opts.palabra;
      };
      const alEnviar = (e) => {
        e.preventDefault();
        if ($("dialogoAceptar").disabled) return;
        terminar(true);
      };
      const alCancelar = () => terminar(false);
      const alEsc = (e) => {
        e.preventDefault();
        terminar(false);
      };

      function terminar(valor) {
        input.removeEventListener("input", alEscribir);
        $("dialogoForm").removeEventListener("submit", alEnviar);
        $("dialogoCancelar").removeEventListener("click", alCancelar);
        dlg.removeEventListener("cancel", alEsc);
        dlg.close();
        if (previo && document.contains(previo)) previo.focus();
        resolver(valor);
      }

      input.addEventListener("input", alEscribir);
      $("dialogoForm").addEventListener("submit", alEnviar);
      $("dialogoCancelar").addEventListener("click", alCancelar);
      dlg.addEventListener("cancel", alEsc);
      dlg.showModal();
      (opts.palabra ? input : $("dialogoCancelar")).focus();
    });
  }

  const PUBS_BASE = [
    { id: 1, titulo: "¿Alguien tiene los apuntes de Estructuras de Datos?", categoria: "Cursos", fecha: "hace 3 días", likes: 14, comentarios: 6, oculta: false },
    { id: 2, titulo: "Busco grupo para el proyecto final de Base de Datos", categoria: "Tareas y trabajos", fecha: "hace 1 semana", likes: 9, comentarios: 11, oculta: false },
    { id: 3, titulo: "Recomendaciones de libros para Sistemas Operativos", categoria: "Tecnología", fecha: "hace 3 semanas", likes: 27, comentarios: 8, oculta: false },
  ];

  function leerPubs() {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_PUBS));
      if (Array.isArray(g)) return g;
    } catch (e) {
    }
    return PUBS_BASE.map((p) => Object.assign({}, p));
  }

  function guardarPubs() {
    try {
      localStorage.setItem(CLAVE_PUBS, JSON.stringify(pubs));
    } catch (e) {
    }
  }

  let pubs = leerPubs();
  const lista = $("listaPubs");

  function pintarPubs() {
    lista.textContent = "";
    $("pubsVacio").hidden = pubs.length > 0;

    pubs.forEach((p) => {
      const li = document.createElement("li");
      li.dataset.id = p.id;

      const info = document.createElement("div");
      info.className = "info";
      const h3 = document.createElement("h3");
      h3.textContent = p.titulo;
      if (p.oculta) {
        const marca = document.createElement("span");
        marca.className = "estado-oculta";
        marca.textContent = "Oculta";
        h3.append(" ", marca);
      }
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = `${p.categoria} · ${p.fecha} · ${p.likes} me gusta · ${p.comentarios} comentarios`;
      info.append(h3, meta);

      const botones = document.createElement("div");
      botones.className = "botones";

      const bOcultar = document.createElement("button");
      bOcultar.type = "button";
      bOcultar.className = "btn-secundario";
      bOcultar.dataset.accion = "ocultar";
      bOcultar.textContent = p.oculta ? "Volver a mostrar" : "Ocultar";
      bOcultar.setAttribute("aria-label", (p.oculta ? "Volver a mostrar: " : "Ocultar: ") + p.titulo);

      const bBorrar = document.createElement("button");
      bBorrar.type = "button";
      bBorrar.className = "btn-peligro";
      bBorrar.dataset.accion = "eliminar";
      bBorrar.textContent = "Eliminar";
      bBorrar.setAttribute("aria-label", "Eliminar: " + p.titulo);

      botones.append(bOcultar, bBorrar);
      li.append(info, botones);
      lista.appendChild(li);
    });

    $("pubsEstado").textContent = pubs.length === 1 ? "1 publicación." : pubs.length + " publicaciones.";
  }

  lista.addEventListener("click", async (e) => {
    const boton = e.target.closest("button[data-accion]");
    if (!boton) return;
    const id = Number(boton.closest("li").dataset.id);
    const pub = pubs.find((p) => p.id === id);
    if (!pub) return;

    if (boton.dataset.accion === "ocultar") {
      pub.oculta = !pub.oculta;
      guardarPubs();
      pintarPubs();
      const nuevo = lista.querySelector(`li[data-id="${id}"] button[data-accion="ocultar"]`);
      if (nuevo) nuevo.focus();
      window.mostrarAviso(pub.oculta ? "Publicación oculta." : "Publicación visible de nuevo.");
      return;
    }

    const ok = await confirmar({
      titulo: "¿Eliminar esta publicación?",
      texto: "«" + pub.titulo + "» se borrará junto con sus comentarios. No se puede deshacer.",
      aceptar: "Eliminar",
    });
    if (!ok) return;
    const indice = pubs.findIndex((p) => p.id === id);
    pubs.splice(indice, 1);
    guardarPubs();
    pintarPubs();
    const siguiente = lista.querySelectorAll("li")[Math.min(indice, pubs.length - 1)];
    if (siguiente) siguiente.querySelector("button").focus();
    else {
      const t = $("t-pubs");
      t.tabIndex = -1;
      t.focus();
    }
    window.mostrarAviso("Publicación eliminada.");
  });

  $("btnEliminarCuenta").addEventListener("click", async () => {
    const ok = await confirmar({
      titulo: "¿Eliminar tu cuenta?",
      texto: "Se borrarán tu perfil, tus preferencias y tus publicaciones. Esta acción no se puede deshacer.",
      aceptar: "Eliminar cuenta",
      palabra: "ELIMINAR",
    });
    if (!ok) return;
    window.foroCuentas.eliminarActual();
    try {
      localStorage.removeItem(CLAVE_PUBS);
      localStorage.removeItem("foroEventos");
    } catch (e) {
    }
    window.location.href = "login.html";
  });

  rellenarDatos();
  rellenarPrivacidad();
  pintarPubs();
  pintarResumen();
})();
