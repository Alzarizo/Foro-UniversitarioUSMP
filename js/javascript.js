document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaPublicaciones");
  const campoBusqueda = document.getElementById("campoBusqueda");
  const sinResultados = document.getElementById("sinResultados");
  const sinTitulo = document.getElementById("sinResultadosTitulo");
  const sinTexto = document.getElementById("sinResultadosTexto");
  const estadoResultados = document.getElementById("estadoResultados");
  const pestañas = document.querySelectorAll(".pestaña");
  const categorias = document.querySelectorAll(".categoria");

  const obtenerPublicaciones = () => lista.querySelectorAll(".publicacion");

  let ordenNuevas = 0;
  obtenerPublicaciones().forEach((p, i) => (p.dataset.orden = i));

  function anunciar(mensaje) {
    if (window.mostrarAviso) window.mostrarAviso(mensaje);
  }

  const estado = { categoria: "todos", texto: "", propias: false, orden: "reciente" };

  function textoDe(pub) {
    const partes = [
      pub.dataset.texto || "",
      pub.querySelector("h3").textContent,
      pub.querySelector(":scope > p").textContent,
    ];
    return partes.join(" ").toLowerCase();
  }

  const likesDe = (pub) => Number(pub.querySelector(".likes").textContent);

  function render() {
    let visibles = 0;

    obtenerPublicaciones().forEach((pub) => {
      const okCategoria = estado.categoria === "todos" || pub.dataset.categoria === estado.categoria;
      const okTexto = !estado.texto || textoDe(pub).includes(estado.texto);
      const okPropia = !estado.propias || pub.dataset.propia === "true";
      const mostrar = okCategoria && okTexto && okPropia;
      pub.hidden = !mostrar;
      if (mostrar) visibles++;
    });

    const orden = [...obtenerPublicaciones()].sort(
      estado.orden === "popular"
        ? (a, b) => likesDe(b) - likesDe(a)
        : (a, b) => a.dataset.orden - b.dataset.orden
    );
    orden.forEach((pub) => lista.appendChild(pub));

    const vacio = visibles === 0;
    sinResultados.classList.toggle("oculto", !vacio);
    if (estado.propias && vacio && !estado.texto) {
      sinTitulo.textContent = "Aún no tienes publicaciones";
      sinTexto.textContent = "Usa el botón «Crear publicación» para escribir la primera.";
    } else {
      sinTitulo.textContent = "No encontramos publicaciones";
      sinTexto.textContent = "Prueba con otra palabra o categoría.";
    }

    estadoResultados.textContent = vacio
      ? sinTitulo.textContent + "."
      : `Mostrando ${visibles} ${visibles === 1 ? "publicación" : "publicaciones"}` +
        (estado.orden === "popular" ? ", ordenadas por más me gusta." : ".");
  }

  function marcarGrupo(botones, activo) {
    botones.forEach((b) => {
      const on = b === activo;
      b.classList.toggle("activa", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function sincronizarPestaña(forzada) {
    let filtro = "todos";
    if (estado.propias) filtro = "mis-publicaciones";
    else if (estado.orden === "popular") filtro = "tendencias";
    else if (estado.categoria === "cursos") filtro = "cursos";
    if (forzada) filtro = forzada;
    marcarGrupo(pestañas, [...pestañas].find((b) => b.dataset.filtro === filtro));
  }

  function sincronizarCategoria() {
    marcarGrupo(categorias, [...categorias].find((b) => b.dataset.categoria === estado.categoria));
  }

  pestañas.forEach((pestaña) => {
    pestaña.addEventListener("click", () => {
      const filtro = pestaña.dataset.filtro;
      estado.categoria = filtro === "cursos" ? "cursos" : "todos";
      estado.propias = filtro === "mis-publicaciones";
      estado.orden = filtro === "tendencias" ? "popular" : "reciente";
      sincronizarCategoria();
      sincronizarPestaña(filtro);
      render();

      if (filtro === "categorias") {
        const activa = document.querySelector(".categoria.activa");
        if (activa) {
          activa.scrollIntoView({ block: "center" });
          activa.focus();
        }
      }
    });
  });

  categorias.forEach((categoria) => {
    categoria.addEventListener("click", () => {
      estado.categoria = categoria.dataset.categoria;
      estado.propias = false;
      estado.orden = "reciente";
      sincronizarCategoria();
      sincronizarPestaña();
      render();
    });
  });

  campoBusqueda.addEventListener("input", () => {
    estado.texto = campoBusqueda.value.toLowerCase().trim();
    render();
  });

  window.foroFeed = {
    mostrarTodo() {
      campoBusqueda.value = "";
      estado.texto = "";
      estado.categoria = "todos";
      estado.propias = false;
      estado.orden = "reciente";
      sincronizarCategoria();
      sincronizarPestaña();
      render();
    },
    ordenarPorPopulares() {
      const pestaña = [...pestañas].find((b) => b.dataset.filtro === "tendencias");
      if (pestaña) pestaña.click();
    },
  };

  lista.addEventListener("click", (e) => {
    const boton = e.target.closest(".me-gusta, .no-me-gusta");
    if (!boton) return;

    const bloque = boton.closest(".voto");
    const btnLike = bloque.querySelector(".me-gusta");
    const btnDislike = bloque.querySelector(".no-me-gusta");
    const txtLikes = bloque.querySelector(".likes");
    const txtDislikes = bloque.querySelector(".dislikes");

    let likes = Number(txtLikes.textContent);
    let dislikes = Number(txtDislikes.textContent);
    const actual = bloque.dataset.votoUsuario || "";
    const nuevo = boton === btnLike ? "like" : "dislike";

    if (actual === "like") likes--;
    if (actual === "dislike") dislikes--;
    if (actual === nuevo) {
      bloque.dataset.votoUsuario = "";
    } else {
      bloque.dataset.votoUsuario = nuevo;
      if (nuevo === "like") likes++;
      else dislikes++;
    }

    const voto = bloque.dataset.votoUsuario;
    btnLike.classList.toggle("seleccionado", voto === "like");
    btnDislike.classList.toggle("seleccionado", voto === "dislike");
    btnLike.setAttribute("aria-pressed", String(voto === "like"));
    btnDislike.setAttribute("aria-pressed", String(voto === "dislike"));
    txtLikes.textContent = likes;
    txtDislikes.textContent = dislikes;
  });

  const modal = document.getElementById("modalCrear");
  const btnCrear = document.getElementById("btnCrear");
  const form = document.getElementById("formPublicacion");
  const inputTitulo = document.getElementById("tituloPublicacion");
  const inputContenido = document.getElementById("contenidoPublicacion");
  const selectCategoria = document.getElementById("categoriaPublicacion");
  const errorTitulo = document.getElementById("errorTitulo");
  const errorContenido = document.getElementById("errorContenido");
  const fondo = document.querySelectorAll(
    "body > .saltar-enlace, body > header, body > nav, body > .contenedor, body > footer"
  );
  let elementoPrevio = null;

  function ponerError(campo, contenedor, mensaje) {
    contenedor.textContent = mensaje;
    campo.setAttribute("aria-invalid", "true");
  }

  function quitarError(campo, contenedor) {
    contenedor.textContent = "";
    campo.removeAttribute("aria-invalid");
  }

  function abrirModal() {
    elementoPrevio = document.activeElement;
    modal.classList.remove("oculto");
    document.body.style.overflow = "hidden";
    fondo.forEach((el) => el.setAttribute("inert", ""));
    inputTitulo.focus();
  }

  function cerrarVentana() {
    modal.classList.add("oculto");
    document.body.style.overflow = "";
    fondo.forEach((el) => el.removeAttribute("inert"));
    quitarError(inputTitulo, errorTitulo);
    quitarError(inputContenido, errorContenido);
    if (elementoPrevio) elementoPrevio.focus();
  }

  btnCrear.addEventListener("click", abrirModal);
  document.getElementById("cerrarModal").addEventListener("click", cerrarVentana);
  document.getElementById("cancelarModal").addEventListener("click", cerrarVentana);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarVentana();
  });

  document.addEventListener("keydown", (e) => {
    if (modal.classList.contains("oculto")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      cerrarVentana();
      return;
    }

    if (e.key === "Tab") {
      const enfocables = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
  });

  inputTitulo.addEventListener("input", () => {
    if (inputTitulo.value.trim()) quitarError(inputTitulo, errorTitulo);
  });
  inputContenido.addEventListener("input", () => {
    if (inputContenido.value.trim()) quitarError(inputContenido, errorContenido);
  });

  function escapeHTML(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const titulo = inputTitulo.value.trim();
    const contenido = inputContenido.value.trim();

    quitarError(inputTitulo, errorTitulo);
    quitarError(inputContenido, errorContenido);
    let primerError = null;

    if (!titulo) {
      ponerError(inputTitulo, errorTitulo, "Escribe un título para tu publicación, por ejemplo: «¿Dónde encuentro los apuntes de Física?».");
      primerError = inputTitulo;
    }
    if (!contenido) {
      ponerError(inputContenido, errorContenido, "Escribe el contenido: explica tu duda o lo que quieres compartir.");
      primerError = primerError || inputContenido;
    }
    if (primerError) {
      primerError.focus();
      return;
    }

    const categoria = selectCategoria.value;
    const nombreCategoria = selectCategoria.options[selectCategoria.selectedIndex].text;
    const id = "pub-nueva-" + Date.now();
    const t = escapeHTML(titulo);

    const yo = window.foroPerfil
      ? window.foroPerfil.leer()
      : { nombre: "Tú", apellidos: "", colorAvatar: "granate" };
    const inicialesYo = window.foroPerfil ? window.foroPerfil.iniciales(yo) : "TÚ";
    const colorYo = ["granate", "vino", "carbon", "ambar"].includes(yo.colorAvatar) ? yo.colorAvatar : "granate";

    const nueva = document.createElement("article");
    nueva.className = "publicacion";
    nueva.dataset.categoria = categoria;
    nueva.dataset.texto = `${titulo} ${contenido}`.toLowerCase();
    nueva.dataset.propia = "true";
    nueva.dataset.orden = --ordenNuevas;
    nueva.setAttribute("aria-labelledby", id + "-titulo");

    nueva.innerHTML = `
      <div class="autor">
        <div class="avatar avatar-${colorYo}" aria-hidden="true">${escapeHTML(inicialesYo)}</div>
        <div class="datos-autor">
          <strong>${escapeHTML(yo.nombre)}</strong>
          <span>Mi publicación · ahora</span>
        </div>
        <div class="opciones">
          <button type="button" class="menu-publicacion" aria-label="Más opciones de tu publicación" data-bs-toggle="menu" data-bs-placement="bottom-end"><i class="bi bi-three-dots-vertical" aria-hidden="true"></i></button>
          <div class="menu">
            <button class="menu-item" type="button" data-mensaje="Publicación guardada"><i class="bi bi-bookmark" aria-hidden="true"></i> Guardar</button>
            <button class="menu-item" type="button" data-mensaje="Enlace copiado"><i class="bi bi-link-45deg" aria-hidden="true"></i> Copiar enlace</button>
            <hr class="menu-divider" />
            <button class="menu-item peligro" type="button" data-mensaje="Gracias, revisaremos esta publicación"><i class="bi bi-flag" aria-hidden="true"></i> Reportar</button>
          </div>
        </div>
      </div>

      <h3 id="${id}-titulo">${t}</h3>
      <p>${escapeHTML(contenido)}</p>

      <div class="etiquetas">
        <span class="etiqueta rojo">${escapeHTML(nombreCategoria)}</span>
      </div>

      <div class="pie-publicacion">
        <div class="voto">
          <button type="button" class="btn-voto me-gusta" aria-pressed="false" aria-label="Me gusta, tu publicación"><i class="bi bi-hand-thumbs-up" aria-hidden="true"></i></button>
          <span class="numero-votos likes">0</span>
          <button type="button" class="btn-voto no-me-gusta" aria-pressed="false" aria-label="No me gusta, tu publicación"><i class="bi bi-hand-thumbs-down" aria-hidden="true"></i></button>
          <span class="numero-votos dislikes">0</span>
        </div>
        <button type="button" class="comentarios"><i class="bi bi-chat-left-text" aria-hidden="true"></i> <span>0 comentarios</span></button>
        <button type="button" class="btn-comentar" aria-label="Comentar en: ${t}">Comentar</button>
      </div>
    `;

    lista.prepend(nueva);

    campoBusqueda.value = "";
    estado.texto = "";
    estado.categoria = "todos";
    estado.propias = false;
    estado.orden = "reciente";
    sincronizarCategoria();
    sincronizarPestaña();
    render();

    form.reset();
    cerrarVentana();
    anunciar("¡Publicación creada correctamente!");
    if (window.foroAvisos) {
      window.foroAvisos.agregar({
        icono: "pencil-square",
        texto: "Tu publicación «" + titulo + "» ya está visible en el foro.",
        href: "index.html",
        leida: true,
      });
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
    const inputFoto = document.getElementById("input-imagen-comentario");
    const vistaPreviaFoto = document.getElementById("vista-previa-comentario");
    const textarea = document.getElementById("contenidoPublicacion");
    const formPublicacion = document.getElementById("formPublicacion");
    
    let imagenPorPublicar = "";

    function procesarImagen(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imagenPorPublicar = event.target.result;
                if (vistaPreviaFoto) {
                    vistaPreviaFoto.innerHTML = `<img src="${imagenPorPublicar}" alt="Miniatura" style="max-width:100px; max-height:100px; border-radius:6px; margin-top:5px; border:1px solid #ccc;">`;
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert("Por favor, selecciona o arrastra solo archivos de imagen (PNG, JPG, etc.).");
        }
    }

    if (inputFoto) {
        inputFoto.addEventListener("change", function (e) {
            if (e.target.files && e.target.files[0]) {
                procesarImagen(e.target.files[0]);
            }
        });
    }

    if (textarea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            textarea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            textarea.addEventListener(eventName, () => {
                textarea.style.borderColor = "#007bff"; 
                textarea.style.backgroundColor = "rgba(0, 123, 255, 0.03)";
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            textarea.addEventListener(eventName, () => {
                textarea.style.borderColor = ""; 
                textarea.style.backgroundColor = "";
            }, false);
        });

        textarea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            if (dt.files && dt.files.length > 0) {
                procesarImagen(dt.files[0]);
            }
        }, false);
    }

    const observer = new MutationObserver(function (mutations) {
        if (imagenPorPublicar === "") return;

        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) {
                    const esPublicacion = node.matches('.publicacion, .card-publicacion, article') || 
                                          node.querySelector('.publicacion, .card-publicacion, article, p');
                    
                    if (esPublicacion) {
                        const contenedorTexto = node.querySelector('.contenido, p, .cuerpo, .mensaje') || node;
                        
                        if (node.querySelector('.img-adjunta-user')) return;

                        const nuevaImg = document.createElement("img");
                        nuevaImg.src = imagenPorPublicar;
                        nuevaImg.classList.add("img-adjunta-user");
                        
                        nuevaImg.style.maxWidth = "250px";
                        nuevaImg.style.maxHeight = "250px";
                        nuevaImg.style.width = "auto";
                        nuevaImg.style.height = "auto";
                        nuevaImg.style.objectFit = "contain";
                        nuevaImg.style.borderRadius = "8px";
                        nuevaImg.style.marginTop = "12px";
                        nuevaImg.style.display = "block";

                        contenedorTexto.appendChild(nuevaImg);

                        imagenPorPublicar = "";
                        if (vistaPreviaFoto) vistaPreviaFoto.innerHTML = "";
                        if (inputFoto) inputFoto.value = "";
                    }
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});