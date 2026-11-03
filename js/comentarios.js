(function () {
  "use strict";

  const lista = document.getElementById("listaPublicaciones");
  if (!lista || !window.foroCuentas || !window.foroCuentas.sesionActiva()) return;

  const SEMILLAS = {
    "pub-1": [
      { autor: "Ana López", ini: "AL", color: "vino", cuando: "hace 1 h", texto: "Yo tengo los exámenes de 2023. Te los paso por mensaje." },
      { autor: "Pedro Ríos", ini: "PR", color: "carbon", cuando: "hace 45 min", texto: "En la biblioteca hay una guía de ejercicios resueltos de Cálculo III, revísala." },
    ],
    "pub-2": [
      { autor: "Carlos Mendoza", ini: "CM", color: "granate", cuando: "hace 3 h", texto: "Muy útil, gracias por compartirlo. ¿Incluye el formato para citar tesis?" },
    ],
    "pub-3": [
      { autor: "M. García", ini: "MG", color: "ambar", cuando: "hace 20 h", texto: "En el aviso del portal dice que abren el próximo lunes, pero no es oficial." },
      { autor: "Ana López", ini: "AL", color: "vino", cuando: "hace 18 h", texto: "Confírmalo en la oficina de Bienestar; ellos publican el cronograma." },
    ],
    "pub-4": [
      { autor: "Luis Torres", ini: "LT", color: "vino", cuando: "hace 2 días", texto: "Yo las tengo escaneadas, te las paso por mensaje esta noche." },
      { autor: "Karen Salinas", ini: "KS", color: "ambar", cuando: "hace 2 días", texto: "El profesor subió las diapositivas de Gauss al aula virtual, en la carpeta «Semana 6»." },
      { autor: "Pedro Ríos", ini: "PR", color: "carbon", cuando: "hace 1 día", texto: "Si te falta la parte de ejercicios, en la biblioteca hay una guía resuelta." },
      { autor: "Rosa Vega", ini: "RV", color: "carbon", cuando: "hace 1 día", texto: "Gracias por preguntar, yo también estaba buscando lo mismo." },
      { autor: "Diego Paredes", ini: "DP", color: "carbon", cuando: "hace 20 h", texto: "¡Ya las conseguí! Gracias a todos por la ayuda." },
    ],
    "pub-5": [
      { autor: "Carlos Mendoza", ini: "CM", color: "granate", cuando: "hace 3 días", texto: "Agrego el Álgebra lineal de Grossman, me salvó en el segundo ciclo." },
      { autor: "M. García", ini: "MG", color: "ambar", cuando: "hace 2 días", texto: "Para programación recomiendo «Clean Code», aunque es más para ciclos avanzados." },
      { autor: "Ana López", ini: "AL", color: "vino", cuando: "hace 2 días", texto: "¿Alguno de estos está en la biblioteca de la facultad?" },
      { autor: "Valeria Campos", ini: "VC", color: "vino", cuando: "hace 1 día", texto: "@Ana López sí, el de Stewart y el de Eco están disponibles en préstamo." },
    ],
    "pub-6": [
      { autor: "Luis Torres", ini: "LT", color: "vino", cuando: "hace 4 días", texto: "Yo hago diseño de interfaces, cuenta conmigo." },
      { autor: "Karen Salinas", ini: "KS", color: "ambar", cuando: "hace 3 días", texto: "Ya tenemos a alguien de bases de datos, nos falta solo el cuarto integrante." },
      { autor: "M. García", ini: "MG", color: "ambar", cuando: "hace 3 días", texto: "¿Hay que llevar laptop propia o prestan equipos en el laboratorio?" },
      { autor: "Sofía Ramírez", ini: "SR", color: "granate", cuando: "hace 2 días", texto: "@M. García lleva tu laptop; el laboratorio solo da internet y enchufes." },
    ],
  };

  const MAX = 500;

  function leerTodo() {
    try {
      const v = JSON.parse(localStorage.getItem(window.foroCuentas.clave("foroComentarios")));
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  }

  function guardarTodo(datos) {
    try {
      localStorage.setItem(window.foroCuentas.clave("foroComentarios"), JSON.stringify(datos));
    } catch (e) {
    }
  }

  let propios = leerTodo();

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

  const idPub = (art) => (art.getAttribute("aria-labelledby") || "").replace(/-titulo$/, "");
  const tituloPub = (art) => {
    const h = art.querySelector("h3");
    return h ? h.textContent : "la publicación";
  };

  const seleccionados = (id) => (SEMILLAS[id] || []).concat(propios[id] || []);

  function avatarPropio() {
    const yo = window.foroPerfil.leer();
    const a = el("span", "avatar pequeño avatar-" + yo.colorAvatar);
    a.setAttribute("aria-hidden", "true");
    if (yo.foto) {
      const img = el("img", "avatar-img");
      img.src = yo.foto;
      img.alt = "";
      a.appendChild(img);
    } else {
      a.textContent = window.foroPerfil.iniciales(yo);
    }
    return a;
  }

  function nombreCompletoPropio() {
    const yo = window.foroPerfil.leer();
    return (yo.nombre + " " + yo.apellidos).trim() || "Tú";
  }

  function actualizarContador(art) {
    const n = seleccionados(idPub(art)).length;
    const texto = art.querySelector(".comentarios span:last-child");
    if (texto) texto.textContent = n + (n === 1 ? " comentario" : " comentarios");
  }

  function pintarComentarios(art) {
    const id = idPub(art);
    const seccion = art.querySelector(".comentarios-seccion");
    const ul = seccion.querySelector(".comentarios-lista");
    const vacio = seccion.querySelector(".comentarios-vacio");
    ul.textContent = "";

    const todos = seleccionados(id);
    vacio.hidden = todos.length > 0;
    ul.hidden = todos.length === 0;

    todos.forEach((c) => {
      const propio = !!c.id;
      const li = el("li", "comentario" + (propio ? " propio" : ""));

      let avatar;
      if (propio) avatar = avatarPropio();
      else {
        avatar = el("span", "avatar pequeño avatar-" + c.color, c.ini);
        avatar.setAttribute("aria-hidden", "true");
      }

      const cuerpo = el("div", "comentario-cuerpo");
      const cabecera = el("div", "comentario-cabecera");
      cabecera.append(
        el("strong", "", propio ? nombreCompletoPropio() : c.autor),
        el("span", "comentario-hora", propio ? window.foroTiempo(c.t) : c.cuando)
      );
      cuerpo.append(cabecera, el("div", "comentario-texto", c.texto));
      li.append(avatar, cuerpo);

      if (propio) {
        const borrar = el("button", "comentario-borrar");
        borrar.type = "button";
        borrar.dataset.borrar = c.id;
        borrar.setAttribute("aria-label", "Eliminar tu comentario: " + c.texto.slice(0, 60));
        borrar.title = "Eliminar comentario";
        borrar.appendChild(icono("trash"));
        li.appendChild(borrar);
      }
      ul.appendChild(li);
    });
    actualizarContador(art);
  }

  function crearSeccion(art) {
    const id = idPub(art);
    const seccion = el("section", "comentarios-seccion");
    seccion.id = "com-" + id;
    seccion.hidden = true;
    seccion.setAttribute("aria-label", "Comentarios de: " + tituloPub(art));

    const ul = el("ul", "comentarios-lista");
    const vacio = el("div", "comentarios-vacio", "Aún no hay comentarios. Sé el primero en responder.");

    const form = el("form", "comentario-form");
    form.noValidate = true;
    const etiqueta = el("label", "sr-only", "Escribe tu comentario");
    const campoId = "ta-" + id;
    etiqueta.htmlFor = campoId;
    const area = el("textarea");
    area.id = campoId;
    area.rows = 2;
    area.maxLength = MAX;
    area.placeholder = "Escribe un comentario…";
    area.setAttribute("aria-describedby", campoId + "-error");

    const fila = el("div", "comentario-form-fila");
    const contador = el("span", "comentario-contador", "0 de " + MAX);
    const enviar = el("button", "btn-publicar");
    enviar.type = "submit";
    enviar.append(icono("send-fill"), " Publicar");
    fila.append(contador, enviar);

    const error = el("div", "mensaje-error");
    error.id = campoId + "-error";
    error.setAttribute("role", "alert");

    const cuerpoForm = el("div", "comentario-form-cuerpo");
    cuerpoForm.append(etiqueta, area, error, fila);
    form.append(avatarPropio(), cuerpoForm);

    seccion.append(ul, vacio, form);
    art.appendChild(seccion);

    area.addEventListener("input", () => {
      contador.textContent = area.value.length + " de " + MAX;
      if (area.value.trim()) {
        error.textContent = "";
        area.removeAttribute("aria-invalid");
      }
    });

    area.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const texto = area.value.trim();
      if (!texto) {
        error.textContent = "Escribe algo antes de publicar tu comentario.";
        area.setAttribute("aria-invalid", "true");
        area.focus();
        return;
      }
      (propios[id] = propios[id] || []).push({
        id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        texto: texto,
        t: Date.now(),
      });
      guardarTodo(propios);
      area.value = "";
      contador.textContent = "0 de " + MAX;
      pintarComentarios(art);
      area.focus();
      if (window.mostrarAviso) window.mostrarAviso("Comentario publicado.");
      if (window.foroAvisos) {
        window.foroAvisos.agregar({
          icono: "chat-left-text",
          texto: "Comentaste en «" + tituloPub(art) + "».",
          href: "index.html",
          leida: true,
        });
      }
    });

    pintarComentarios(art);
    return seccion;
  }

  function seccionDe(art) {
    return art.querySelector(".comentarios-seccion") || crearSeccion(art);
  }

  function abrirSeccion(art) {
    const seccion = seccionDe(art);
    seccion.hidden = false;
    const boton = art.querySelector(".comentarios");
    if (boton) {
      boton.setAttribute("aria-expanded", "true");
      boton.setAttribute("aria-controls", seccion.id);
    }
    return seccion;
  }

  lista.addEventListener("click", (e) => {
    const borrar = e.target.closest("[data-borrar]");
    if (borrar) {
      const art = borrar.closest(".publicacion");
      const id = idPub(art);
      const filas = [...art.querySelectorAll(".comentario-borrar")];
      const indice = filas.indexOf(borrar);
      propios[id] = (propios[id] || []).filter((c) => c.id !== borrar.dataset.borrar);
      guardarTodo(propios);
      pintarComentarios(art);
      const restantes = art.querySelectorAll(".comentario-borrar");
      const destino = restantes[Math.min(indice, restantes.length - 1)] || art.querySelector(".comentario-form textarea");
      if (destino) destino.focus();
      if (window.mostrarAviso) window.mostrarAviso("Comentario eliminado.");
      return;
    }

    const alternar = e.target.closest(".comentarios");
    if (alternar) {
      const art = alternar.closest(".publicacion");
      const seccion = seccionDe(art);
      const mostrar = seccion.hidden;
      seccion.hidden = !mostrar;
      alternar.setAttribute("aria-expanded", String(mostrar));
      alternar.setAttribute("aria-controls", seccion.id);
      return;
    }

    const comentar = e.target.closest(".btn-comentar");
    if (comentar) {
      const art = comentar.closest(".publicacion");
      const seccion = abrirSeccion(art);
      const area = seccion.querySelector("textarea");
      area.focus();
      seccion.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });

  lista.querySelectorAll(".publicacion").forEach((art) => {
    const boton = art.querySelector(".comentarios");
    if (boton) boton.setAttribute("aria-expanded", "false");
    actualizarContador(art);
  });
})();
