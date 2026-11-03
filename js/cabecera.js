(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const btnNotif = $("btnNotif");
  const btnMensajes = $("btnMensajes");
  if (!btnNotif || !btnMensajes || !window.foroCuentas || !window.foroCuentas.sesionActiva()) return;

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function icono(nombre) {
    const i = el("i", "bi bi-" + nombre);
    i.setAttribute("aria-hidden", "true");
    return i;
  }

  function leer(clave, defecto) {
    try {
      const v = JSON.parse(localStorage.getItem(window.foroCuentas.clave(clave)));
      return v === null || v === undefined ? defecto : v;
    } catch (e) {
      return defecto;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(window.foroCuentas.clave(clave), JSON.stringify(valor));
    } catch (e) {
    }
  }

  const MIN = 60 * 1000;
  const HORA = 60 * MIN;
  const aviso = (m) => window.mostrarAviso && window.mostrarAviso(m);

  function ponerContador(insignia, boton, cantidad, etiqueta) {
    insignia.hidden = cantidad === 0;
    insignia.textContent = cantidad > 9 ? "9+" : String(cantidad);
    boton.setAttribute("aria-label", cantidad ? etiqueta + ", " + cantidad + " sin leer" : etiqueta);
  }

  let abierto = null;

  function crearPanel(id, clase) {
    const p = el("div", "panel-flotante " + clase);
    p.id = id;
    p.hidden = true;
    p.tabIndex = -1;
    p.setAttribute("role", "dialog");
    document.body.appendChild(p);
    return p;
  }

  function posicionar(panel, boton) {
    const r = boton.getBoundingClientRect();
    const ancho = panel.offsetWidth;
    const vw = document.documentElement.clientWidth;
    const derecha = Math.max(8, Math.min(vw - r.right, vw - ancho - 8));
    const arriba = Math.round(r.bottom + 8);
    panel.style.top = arriba + "px";
    panel.style.right = Math.round(derecha) + "px";
    panel.style.maxHeight = Math.max(240, window.innerHeight - arriba - 12) + "px";
  }

  function cerrar(devolverFoco) {
    if (!abierto) return;
    const { panel, boton } = abierto;
    panel.hidden = true;
    boton.setAttribute("aria-expanded", "false");
    abierto = null;
    if (devolverFoco) boton.focus();
  }

  function abrir(panel, boton) {
    cerrar(false);
    panel.hidden = false;
    boton.setAttribute("aria-expanded", "true");
    abierto = { panel, boton };
    posicionar(panel, boton);
    panel.focus({ preventScroll: true });
  }

  function alternar(panel, boton, antesDeAbrir) {
    if (abierto && abierto.panel === panel) {
      cerrar(true);
      return;
    }
    if (antesDeAbrir) antesDeAbrir();
    abrir(panel, boton);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && abierto) {
      e.preventDefault();
      cerrar(true);
    }
  });

  document.addEventListener("click", (e) => {
    if (!abierto) return;
    const ruta = e.composedPath();
    if (ruta.includes(abierto.panel) || ruta.includes(abierto.boton)) return;
    cerrar(false);
  });

  window.addEventListener("resize", () => {
    if (abierto) posicionar(abierto.panel, abierto.boton);
  });

  const insigniaNotif = $("notifContador");
  const panelNotif = crearPanel("panelNotif", "panel-notif");
  panelNotif.setAttribute("aria-labelledby", "notifTitulo");

  const perfilActual = window.foroPerfil.leer();

  function notificacionesIniciales() {
    const ahora = Date.now();
    const saludo = perfilActual.nombre ? ", " + perfilActual.nombre : "";
    return [
      {
        id: "n1",
        icono: "person-check",
        texto: "Te damos la bienvenida al foro" + saludo + ". Completa tu perfil para que otros estudiantes te reconozcan.",
        href: "perfil.html#datos",
        t: ahora - 5 * MIN,
        leida: false,
      },
      {
        id: "n2",
        icono: "calendar-event",
        texto: "Nuevo evento: Hackathon universitario, 14 de noviembre. Marca si asistirás.",
        href: "eventos.html",
        t: ahora - 2 * HORA,
        leida: false,
      },
      {
        id: "n3",
        icono: "chat-left-text",
        texto: "Ana López comentó en «Resumen de normas APA para trabajos universitarios».",
        href: "index.html",
        t: ahora - 26 * HORA,
        leida: false,
      },
    ];
  }

  let notifs = leer("foroNotifs", null);
  if (!Array.isArray(notifs)) {
    notifs = notificacionesIniciales();
    guardar("foroNotifs", notifs);
  }

  const cabNotif = el("div", "panel-cab");
  const tituloNotif = el("h2", "", "Notificaciones");
  tituloNotif.id = "notifTitulo";
  cabNotif.appendChild(tituloNotif);

  const accionesNotif = el("div", "panel-acciones");
  const btnLeerTodas = el("button", "panel-accion", "Marcar todas como leídas");
  btnLeerTodas.type = "button";
  const btnBorrarTodas = el("button", "panel-accion", "Borrar todas");
  btnBorrarTodas.type = "button";
  accionesNotif.append(btnLeerTodas, btnBorrarTodas);

  const listaNotif = el("ul", "notif-lista");
  const vacioNotif = el("div", "panel-vacio");
  vacioNotif.append(icono("bell-slash"), el("span", "", "No tienes notificaciones por ahora."));

  panelNotif.append(cabNotif, accionesNotif, listaNotif, vacioNotif);

  function pintarNotifs() {
    const sinLeer = notifs.filter((n) => !n.leida).length;
    ponerContador(insigniaNotif, btnNotif, sinLeer, "Notificaciones");

    listaNotif.textContent = "";
    vacioNotif.hidden = notifs.length > 0;
    listaNotif.hidden = notifs.length === 0;
    accionesNotif.hidden = notifs.length === 0;
    btnLeerTodas.disabled = sinLeer === 0;

    notifs.forEach((n) => {
      const li = el("li", "notif-fila");
      const item = el(n.href ? "a" : "button", "notif-item" + (n.leida ? "" : " no-leida"));
      if (n.href) item.href = n.href;
      else item.type = "button";
      item.dataset.id = n.id;

      const circulo = el("span", "notif-icono");
      circulo.appendChild(icono(n.icono));

      const cuerpo = el("span", "notif-cuerpo");
      cuerpo.append(el("span", "notif-texto", n.texto), el("span", "notif-hora", window.foroTiempo(n.t)));
      if (!n.leida) cuerpo.appendChild(el("span", "sr-only", " (sin leer)"));

      item.append(circulo, cuerpo);
      if (!n.leida) {
        const punto = el("span", "punto-no-leida");
        punto.setAttribute("aria-hidden", "true");
        item.appendChild(punto);
      }

      const quitar = el("button", "notif-quitar");
      quitar.type = "button";
      quitar.dataset.quitar = n.id;
      quitar.setAttribute("aria-label", "Quitar notificación: " + n.texto);
      quitar.appendChild(icono("x-lg"));

      li.append(item, quitar);
      listaNotif.appendChild(li);
    });
  }

  function guardarNotifs() {
    guardar("foroNotifs", notifs);
    pintarNotifs();
  }

  listaNotif.addEventListener("click", (e) => {
    const quitar = e.target.closest("[data-quitar]");
    if (quitar) {
      const filas = [...listaNotif.querySelectorAll(".notif-fila")];
      const indice = filas.indexOf(quitar.closest(".notif-fila"));
      notifs = notifs.filter((n) => n.id !== quitar.dataset.quitar);
      guardarNotifs();
      const nuevas = listaNotif.querySelectorAll(".notif-quitar");
      const destino = nuevas[Math.min(indice, nuevas.length - 1)];
      (destino || panelNotif).focus();
      aviso("Notificación quitada.");
      return;
    }
    const item = e.target.closest(".notif-item");
    if (!item) return;
    const n = notifs.find((x) => x.id === item.dataset.id);
    if (n && !n.leida) {
      n.leida = true;
      guardar("foroNotifs", notifs);
      pintarNotifs();
    }
  });

  btnLeerTodas.addEventListener("click", () => {
    notifs.forEach((n) => (n.leida = true));
    guardarNotifs();
    aviso("Todas las notificaciones están marcadas como leídas.");
    btnBorrarTodas.focus();
  });

  btnBorrarTodas.addEventListener("click", () => {
    notifs = [];
    guardarNotifs();
    aviso("Se borraron todas las notificaciones.");
    panelNotif.focus();
  });

  btnNotif.addEventListener("click", () => alternar(panelNotif, btnNotif, pintarNotifs));

  window.foroAvisos = {
    agregar(datos) {
      notifs.unshift({
        id: "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        icono: datos.icono || "info-circle",
        texto: datos.texto,
        href: datos.href || "",
        t: Date.now(),
        leida: !!datos.leida,
      });
      notifs = notifs.slice(0, 30);
      guardarNotifs();
    },
  };

  const insigniaMensajes = $("mensajesContador");

  function pintarContadorMensajes() {
    const convs = window.foroMensajes.leer();
    ponerContador(insigniaMensajes, btnMensajes, window.foroMensajes.noLeidos(convs), "Mensajes");
  }

  window.addEventListener("foro:mensajes", pintarContadorMensajes);
  window.addEventListener("storage", pintarContadorMensajes);

  panelNotif.addEventListener("focusout", (e) => {
    const destino = e.relatedTarget;
    if (!destino || !abierto || abierto.panel !== panelNotif) return;
    if (panelNotif.contains(destino) || abierto.boton === destino) return;
    cerrar(false);
  });

  pintarNotifs();
  pintarContadorMensajes();
})();
