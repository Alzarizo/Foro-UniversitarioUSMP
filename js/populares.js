(function () {
  "use strict";

  const lista = document.getElementById("listaPublicaciones");
  const ul = document.getElementById("listaPopulares");
  if (!lista || !ul) return;

  const TOP = 3;
  const sinMovimiento = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function idDe(art) {
    if (!art.id) art.id = (art.getAttribute("aria-labelledby") || "pub").replace(/-titulo$/, "");
    return art.id;
  }

  function leerPublicaciones() {
    return [...lista.querySelectorAll(".publicacion")].map((art, i) => {
      const likes = Number((art.querySelector(".likes") || {}).textContent) || 0;
      const contador = art.querySelector(".comentarios span:last-child");
      const comentarios = contador ? parseInt(contador.textContent, 10) || 0 : 0;
      const h3 = art.querySelector("h3");
      return { id: idDe(art), titulo: h3 ? h3.textContent.trim() : "", likes, comentarios, pos: i };
    });
  }

  let firma = "";

  function pintar() {
    const top = leerPublicaciones()
      .filter((p) => p.likes > 0)
      .sort((a, b) => b.likes - a.likes || b.comentarios - a.comentarios || a.pos - b.pos)
      .slice(0, TOP);

    const nueva = top.map((p) => [p.id, p.titulo, p.likes, p.comentarios].join("|")).join("~");
    if (nueva === firma) return;
    firma = nueva;

    ul.textContent = "";
    top.forEach((p) => {
      const li = el("li");
      const a = el("a", "", p.titulo);
      a.href = "#" + p.id;
      a.dataset.pub = p.id;

      const datos = el("span");
      datos.append(icono("hand-thumbs-up"), " " + p.likes, el("span", "sr-only", " me gusta"));
      datos.append(" · ", icono("chat-left-text"), " " + p.comentarios);
      datos.append(el("span", "sr-only", p.comentarios === 1 ? " comentario" : " comentarios"));

      li.append(a, datos);
      ul.appendChild(li);
    });
  }

  let temporizador;

  function irA(id) {
    let art = document.getElementById(id);
    if (!art) return;
    if (art.hidden && window.foroFeed) window.foroFeed.mostrarTodo();
    art = document.getElementById(id);

    const boton = art.querySelector(".comentarios");
    if (boton && boton.getAttribute("aria-expanded") !== "true") boton.click();

    art.scrollIntoView({ block: "start", behavior: sinMovimiento() ? "auto" : "smooth" });

    const titulo = art.querySelector("h3");
    if (titulo) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }

    lista.querySelectorAll(".publicacion.resaltada").forEach((p) => p.classList.remove("resaltada"));
    art.classList.add("resaltada");
    clearTimeout(temporizador);
    temporizador = setTimeout(() => art.classList.remove("resaltada"), 3500);
  }

  ul.addEventListener("click", (e) => {
    const enlace = e.target.closest("a[data-pub]");
    if (!enlace) return;
    e.preventDefault();
    irA(enlace.dataset.pub);
  });

  const verTodo = document.getElementById("verPopulares");
  if (verTodo) {
    verTodo.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.foroFeed) window.foroFeed.ordenarPorPopulares();
      const primera = lista.querySelector(".publicacion:not([hidden]) h3");
      if (primera) {
        primera.tabIndex = -1;
        primera.scrollIntoView({ block: "center", behavior: sinMovimiento() ? "auto" : "smooth" });
        primera.focus({ preventScroll: true });
      }
    });
  }

  let pendiente = false;
  new MutationObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      pintar();
    });
  }).observe(lista, { childList: true, subtree: true, characterData: true });

  pintar();
})();
