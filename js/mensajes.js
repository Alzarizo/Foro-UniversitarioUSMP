(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const layout = $("mensajesLayout");
  if (!layout || !window.foroMensajes || !window.foroCuentas || !window.foroCuentas.sesionActiva()) return;

  const datos = window.foroMensajes;
  const CONTACTOS = datos.contactos;
  const convs = datos.leer();

  const listaConv = $("listaConv");
  const panelChat = $("panelChat");
  const placeholder = $("chatPlaceholder");
  const chatActivo = $("chatActivo");
  const chatAvatar = $("chatAvatar");
  const chatTitulo = $("chatTitulo");
  const chatInfo = $("chatInfo");
  const registro = $("chatLog");
  const formChat = $("chatForm");
  const campoChat = $("chatInput");
  const btnVolver = $("btnVolver");

  let abierto = null;

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  const contacto = (id) => CONTACTOS.find((c) => c.id === id);

  function avatar(c) {
    const a = el("span", "avatar pequeño avatar-" + c.color, c.ini);
    a.setAttribute("aria-hidden", "true");
    return a;
  }

  function guardar() {
    datos.guardar(convs);
    window.dispatchEvent(new Event("foro:mensajes"));
  }

  function ultimoMensaje(id) {
    const m = convs[id].m;
    return m.length ? m[m.length - 1] : null;
  }

  function pintarLista() {
    listaConv.textContent = "";
    const ordenados = [...CONTACTOS].sort((a, b) => {
      const ua = ultimoMensaje(a.id);
      const ub = ultimoMensaje(b.id);
      return (ub ? ub.t : 0) - (ua ? ua.t : 0);
    });

    ordenados.forEach((c) => {
      const conv = convs[c.id];
      const ultimo = ultimoMensaje(c.id);
      const li = el("li");
      const boton = el("button", "conv-item" + (conv.nl ? " no-leida" : "") + (abierto === c.id ? " activa" : ""));
      boton.type = "button";
      boton.dataset.id = c.id;
      if (abierto === c.id) boton.setAttribute("aria-current", "true");

      const cuerpo = el("span", "conv-cuerpo");
      const fila = el("span", "conv-fila");
      fila.append(el("strong", "", c.nombre), el("span", "conv-hora", ultimo ? window.foroTiempo(ultimo.t) : ""));
      const previo = el(
        "span",
        "conv-previo",
        ultimo ? (ultimo.de === "yo" ? "Tú: " : "") + ultimo.texto : "Escribe el primer mensaje"
      );
      cuerpo.append(fila, previo);
      if (conv.nl) {
        cuerpo.appendChild(el("span", "sr-only", conv.nl + (conv.nl === 1 ? " mensaje sin leer" : " mensajes sin leer")));
      }

      boton.append(avatar(c), cuerpo);
      if (conv.nl) {
        const punto = el("span", "punto-no-leida");
        punto.setAttribute("aria-hidden", "true");
        boton.appendChild(punto);
      }
      li.appendChild(boton);
      listaConv.appendChild(li);
    });
  }

  function crearBurbuja(c, m) {
    const b = el("div", "burbuja " + (m.de === "yo" ? "mia" : "otra"));
    b.append(
      el("span", "sr-only", m.de === "yo" ? "Tú: " : c.nombre + ": "),
      el("span", "burbuja-texto", m.texto),
      el("span", "burbuja-hora", window.foroTiempo(m.t))
    );
    return b;
  }

  function pintarChat() {
    const c = contacto(abierto);
    registro.textContent = "";
    registro.setAttribute("aria-label", "Conversación con " + c.nombre);
    const conv = convs[c.id];
    if (!conv.m.length) {
      registro.appendChild(el("div", "chat-vacio", "Aún no hay mensajes. Escribe el primero."));
    }
    conv.m.forEach((m) => registro.appendChild(crearBurbuja(c, m)));
    registro.scrollTop = registro.scrollHeight;
  }

  function mostrarVista(cual) {
    layout.dataset.vista = cual;
  }

  function abrirChat(id, enfocarCampo) {
    const c = contacto(id);
    if (!c) return;
    abierto = id;

    if (convs[id].nl) {
      convs[id].nl = 0;
      guardar();
    }

    chatAvatar.textContent = "";
    chatAvatar.appendChild(avatar(c));
    chatTitulo.textContent = c.nombre;
    chatInfo.textContent = c.info;
    panelChat.setAttribute("aria-label", "Conversación con " + c.nombre);

    placeholder.hidden = true;
    chatActivo.hidden = false;
    mostrarVista("chat");
    pintarLista();
    pintarChat();
    campoChat.value = "";
    if (enfocarCampo) campoChat.focus();

    try {
      history.replaceState(null, "", "#" + id);
    } catch (e) {
    }
  }

  function cerrarChat() {
    const id = abierto;
    abierto = null;
    chatActivo.hidden = true;
    placeholder.hidden = false;
    mostrarVista("lista");
    pintarLista();
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {
    }
    const boton = listaConv.querySelector('.conv-item[data-id="' + id + '"]');
    (boton || panelChat).focus();
  }

  listaConv.addEventListener("click", (e) => {
    const boton = e.target.closest(".conv-item");
    if (boton) abrirChat(boton.dataset.id, true);
  });

  btnVolver.addEventListener("click", cerrarChat);

  formChat.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = campoChat.value.trim();
    if (!texto || !abierto) {
      campoChat.focus();
      return;
    }
    const c = contacto(abierto);
    const conv = convs[abierto];
    const mensaje = { de: "yo", texto: texto, t: Date.now() };
    conv.m.push(mensaje);
    if (conv.m.length > datos.maxPorChat) conv.m = conv.m.slice(-datos.maxPorChat);
    guardar();

    const vacio = registro.querySelector(".chat-vacio");
    if (vacio) vacio.remove();
    registro.appendChild(crearBurbuja(c, mensaje));
    registro.scrollTop = registro.scrollHeight;

    campoChat.value = "";
    campoChat.focus();
    pintarLista();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !abierto) return;
    if (getComputedStyle(btnVolver).display === "none") return;
    e.preventDefault();
    cerrarChat();
  });

  function abrirDesdeHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && contacto(id) && id !== abierto) abrirChat(id, false);
  }
  window.addEventListener("hashchange", abrirDesdeHash);

  pintarLista();
  abrirDesdeHash();
})();
