(function () {
  "use strict";

  const CLAVE_USUARIOS = "foroUsuarios";
  const CLAVE_SESION = "foroSesion";
  const CLAVES_POR_CUENTA = ["foroMensajes", "foroNotifs", "foroComentarios"];

  const PERFIL_BASE = {
    nombre: "",
    apellidos: "",
    usuario: "",
    correo: "",
    carrera: "",
    ciclo: "",
    bio: "",
    colorAvatar: "granate",
    foto: "",
    visibilidad: "estudiantes",
    mostrarCarrera: true,
    mostrarActividad: true,
    avisoRespuestas: true,
    avisoMenciones: true,
    resumenSemanal: false,
  };

  function leerUsuarios() {
    try {
      const lista = JSON.parse(localStorage.getItem(CLAVE_USUARIOS));
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function guardarUsuarios(lista) {
    try {
      localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
      return true;
    } catch (e) {
      return false;
    }
  }

  function idSesion() {
    try {
      return sessionStorage.getItem(CLAVE_SESION) || localStorage.getItem(CLAVE_SESION) || "";
    } catch (e) {
      return "";
    }
  }

  function cuentaActual() {
    const id = idSesion();
    if (!id) return null;
    return leerUsuarios().find((u) => u.id === id) || null;
  }

  function limpiarSesion() {
    try {
      sessionStorage.removeItem(CLAVE_SESION);
      localStorage.removeItem(CLAVE_SESION);
    } catch (e) {
    }
  }

  function iniciarSesion(id, recordar) {
    limpiarSesion();
    try {
      (recordar ? localStorage : sessionStorage).setItem(CLAVE_SESION, id);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function hashClave(clave, sal) {
    const texto = sal + "|" + clave;
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    let h = 5381;
    for (const ch of texto) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
    return "d:" + (h >>> 0).toString(16);
  }

  const aleatorio = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  function partirNombre(completo) {
    const p = completo.trim().split(/\s+/).filter(Boolean);
    if (p.length <= 1) return { nombre: p[0] || "", apellidos: "" };
    if (p.length === 2 || p.length === 3) return { nombre: p[0], apellidos: p.slice(1).join(" ") };
    return { nombre: p.slice(0, 2).join(" "), apellidos: p.slice(2).join(" ") };
  }

  function usuarioDisponible(correo, usuarios) {
    let base = correo
      .split("@")[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 16);
    if (base.length < 3) base = (base + "usuario").slice(0, 10);
    let candidato = base;
    let n = 1;
    const ocupado = (u) => usuarios.some((c) => (c.perfil.usuario || "").toLowerCase() === u);
    while (ocupado(candidato)) candidato = base + ++n;
    return candidato;
  }

  const cuentas = {
    sesionActiva: () => !!cuentaActual(),
    idActual: idSesion,

    async registrar(datos) {
      const usuarios = leerUsuarios();
      const correo = datos.correo.trim();
      if (usuarios.some((u) => (u.perfil.correo || "").toLowerCase() === correo.toLowerCase())) {
        return { ok: false, campo: "correo", mensaje: "Ya existe una cuenta con ese correo. Ingresa o usa otro correo." };
      }
      const partes = partirNombre(datos.nombre);
      const perfil = Object.assign({}, PERFIL_BASE, partes, {
        correo: correo,
        usuario: usuarioDisponible(correo, usuarios),
      });
      const sal = aleatorio();
      usuarios.push({ id: aleatorio(), sal: sal, claveHash: await hashClave(datos.clave, sal), perfil: perfil });
      if (!guardarUsuarios(usuarios)) {
        return { ok: false, campo: "", mensaje: "No se pudo crear la cuenta: tu navegador tiene bloqueado el almacenamiento." };
      }
      return { ok: true, perfil: perfil };
    },

    async ingresar(identificador, clave, recordar) {
      const q = identificador.trim().toLowerCase();
      const cuenta = leerUsuarios().find(
        (u) => (u.perfil.correo || "").toLowerCase() === q || (u.perfil.usuario || "").toLowerCase() === q
      );
      if (!cuenta) return false;
      if ((await hashClave(clave, cuenta.sal)) !== cuenta.claveHash) return false;
      return iniciarSesion(cuenta.id, recordar);
    },

    salir() {
      limpiarSesion();
      window.location.href = "login.html";
    },

    enUso(campo, valor) {
      const v = valor.trim().toLowerCase();
      const yo = idSesion();
      return leerUsuarios().some((u) => u.id !== yo && (u.perfil[campo] || "").toLowerCase() === v);
    },

    async cambiarClave(actual, nueva) {
      const usuarios = leerUsuarios();
      const cuenta = usuarios.find((u) => u.id === idSesion());
      if (!cuenta) return { ok: false, mensaje: "Tu sesión terminó. Vuelve a ingresar." };
      if ((await hashClave(actual, cuenta.sal)) !== cuenta.claveHash) {
        return { ok: false, mensaje: "La contraseña actual no es correcta." };
      }
      cuenta.sal = aleatorio();
      cuenta.claveHash = await hashClave(nueva, cuenta.sal);
      return guardarUsuarios(usuarios)
        ? { ok: true }
        : { ok: false, mensaje: "No se pudo guardar: tu navegador tiene bloqueado el almacenamiento." };
    },

    eliminarActual() {
      const id = idSesion();
      guardarUsuarios(leerUsuarios().filter((u) => u.id !== id));
      try {
        CLAVES_POR_CUENTA.forEach((k) => localStorage.removeItem(k + ":" + id));
      } catch (e) {
      }
      limpiarSesion();
    },

    clave: (nombre) => nombre + ":" + idSesion(),
  };

  function leerPerfil() {
    const cuenta = cuentaActual();
    return Object.assign({}, PERFIL_BASE, cuenta ? cuenta.perfil : {});
  }

  function guardarPerfil(perfil) {
    const usuarios = leerUsuarios();
    const i = usuarios.findIndex((u) => u.id === idSesion());
    if (i < 0) return false;
    usuarios[i].perfil = perfil;
    return guardarUsuarios(usuarios);
  }

  function iniciales(p) {
    const a = (p.nombre || "").trim().charAt(0);
    const b = (p.apellidos || "").trim().charAt(0);
    return (a + b).toUpperCase() || "?";
  }

  function pintarCabecera() {
    const p = leerPerfil();
    const boton = document.querySelector(".perfil-btn");
    if (!boton) return;

    const nombre = boton.querySelector(".nombre-perfil");
    if (nombre) nombre.textContent = p.nombre || "Mi perfil";
    boton.setAttribute("aria-label", "Mi perfil (" + (p.nombre || "sin nombre") + ")");

    const avatar = boton.querySelector(".avatar");
    if (avatar) {
      avatar.className = "avatar pequeño avatar-" + p.colorAvatar;
      avatar.textContent = "";
      if (p.foto) {
        const img = document.createElement("img");
        img.src = p.foto;
        img.alt = "";
        img.className = "avatar-img";
        avatar.appendChild(img);
      } else {
        avatar.textContent = iniciales(p);
      }
    }
  }

  function tiempoRelativo(marca) {
    const s = Math.max(0, Math.floor((Date.now() - marca) / 1000));
    if (s < 45) return "ahora";
    const m = Math.round(s / 60);
    if (m < 60) return "hace " + m + " min";
    const h = Math.round(m / 60);
    if (h < 24) return "hace " + h + " h";
    const d = Math.round(h / 24);
    if (d < 7) return "hace " + d + (d === 1 ? " día" : " días");
    return new Date(marca).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  }

  window.foroCuentas = cuentas;
  window.foroTiempo = tiempoRelativo;
  window.foroPerfil = {
    leer: leerPerfil,
    guardar: guardarPerfil,
    iniciales: iniciales,
    base: PERFIL_BASE,
    pintarCabecera: pintarCabecera,
  };

  const MIN = 60 * 1000;
  const HORA = 60 * MIN;
  const CONTACTOS = [
    { id: "carlos", nombre: "Carlos Mendoza", ini: "CM", color: "granate", info: "Ing. Informática" },
    { id: "ana", nombre: "Ana López", ini: "AL", color: "vino", info: "Lic. Administración" },
    { id: "pedro", nombre: "Pedro Ríos", ini: "PR", color: "carbon", info: "Ing. Civil" },
    { id: "mgarcia", nombre: "M. García", ini: "MG", color: "ambar", info: "Usuario activo" },
  ];
  const MAX_MENSAJES_POR_CHAT = 200;

  function conversacionesIniciales() {
    const ahora = Date.now();
    return {
      carlos: {
        m: [{ de: "otro", texto: "Hola, ¿pudiste conseguir material para el examen de Cálculo? Yo sigo buscando.", t: ahora - 25 * MIN }],
        nl: 1,
      },
      ana: { m: [{ de: "otro", texto: "Gracias por pasarte por mi publicación de normas APA.", t: ahora - 3 * HORA }], nl: 0 },
      pedro: { m: [{ de: "otro", texto: "¿Vas a ir a la feria de ciencias? Podemos ir juntos.", t: ahora - 20 * HORA }], nl: 1 },
      mgarcia: { m: [], nl: 0 },
    };
  }

  function guardarMensajes(convs) {
    try {
      localStorage.setItem(cuentas.clave("foroMensajes"), JSON.stringify(convs));
    } catch (e) {
    }
  }

  function leerMensajes() {
    let convs = null;
    try {
      convs = JSON.parse(localStorage.getItem(cuentas.clave("foroMensajes")));
    } catch (e) {
      convs = null;
    }
    if (!convs || typeof convs !== "object") {
      convs = conversacionesIniciales();
      guardarMensajes(convs);
    }
    CONTACTOS.forEach((c) => {
      if (!convs[c.id] || !Array.isArray(convs[c.id].m)) convs[c.id] = { m: [], nl: 0 };
    });
    return convs;
  }

  window.foroMensajes = {
    contactos: CONTACTOS,
    maxPorChat: MAX_MENSAJES_POR_CHAT,
    leer: leerMensajes,
    guardar: guardarMensajes,
    noLeidos: (convs) => CONTACTOS.reduce((suma, c) => suma + ((convs[c.id] && convs[c.id].nl) || 0), 0),
  };

  let temporizador;
  window.mostrarAviso = function (mensaje) {
    const aviso = document.getElementById("toastAviso");
    const texto = document.getElementById("toastMensaje");
    if (!aviso || !texto) return;
    texto.textContent = mensaje;
    aviso.classList.add("show");
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove("show"), 6000);
  };

  const publica = document.body && document.body.hasAttribute("data-publica");
  if (!publica && !cuentaActual()) {
    limpiarSesion();
    window.location.replace("login.html");
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    pintarCabecera();
    const cerrar = document.querySelector("#toastAviso .aviso-cerrar");
    if (cerrar) {
      cerrar.addEventListener("click", () => document.getElementById("toastAviso").classList.remove("show"));
    }
    document.querySelectorAll("[data-salir]").forEach((b) => b.addEventListener("click", cuentas.salir));
  });
})();
