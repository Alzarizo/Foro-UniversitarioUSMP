(function () {
  "use strict";

  const CLAVE = "foroA11y";
  const ESCALAS = [100, 115, 130, 150, 175, 200];
  const POR_DEFECTO = {
    escala: 100,
    espaciado: "0",
    fuente: "",
    tema: "",
    paleta: "",
    enlaces: false,
    foco: false,
    cursor: false,
    movimiento: false,
    regla: false,
    velocidad: "1",
  };

  const raiz = document.documentElement;
  let ajustes = Object.assign({}, POR_DEFECTO);

  function cargar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE));
      if (guardado && typeof guardado === "object") Object.assign(ajustes, guardado);
    } catch (e) {
    }
    if (!ESCALAS.includes(Number(ajustes.escala))) ajustes.escala = 100;
    ajustes.escala = Number(ajustes.escala);
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(ajustes));
    } catch (e) {
    }
  }

  function attr(nombre, valor) {
    if (valor) raiz.setAttribute("data-a11y-" + nombre, valor === true ? "" : valor);
    else raiz.removeAttribute("data-a11y-" + nombre);
  }

  function aplicar() {
    raiz.style.fontSize = ajustes.escala === 100 ? "" : ajustes.escala + "%";
    attr("grande", ajustes.escala >= 130);
    attr("espaciado", ajustes.espaciado !== "0" ? ajustes.espaciado : "");
    attr("fuente", ajustes.fuente);
    attr("tema", ajustes.tema);
    attr("paleta", ajustes.paleta);
    attr("enlaces", ajustes.enlaces);
    attr("foco", ajustes.foco);
    attr("cursor", ajustes.cursor);
    attr("movimiento", ajustes.movimiento);
    reglaActualizar();
  }

  cargar();
  aplicar();

  let reglaSup = null;
  let reglaInf = null;
  let marco = 0;

  function moverRegla(y) {
    cancelAnimationFrame(marco);
    marco = requestAnimationFrame(() => raiz.style.setProperty("--a11y-regla-y", y + "px"));
  }

  function alMouse(e) {
    moverRegla(e.clientY);
  }

  function alToque(e) {
    if (e.touches && e.touches[0]) moverRegla(e.touches[0].clientY);
  }

  function alFoco(e) {
    const el = e.target;
    if (el && el.getBoundingClientRect && !el.closest(".a11y-widget")) {
      const r = el.getBoundingClientRect();
      moverRegla(r.top + r.height / 2);
    }
  }

  function reglaActualizar() {
    if (!document.body) return;
    if (ajustes.regla && !reglaSup) {
      reglaSup = document.createElement("div");
      reglaInf = document.createElement("div");
      reglaSup.className = "a11y-regla-sup";
      reglaInf.className = "a11y-regla-inf";
      reglaSup.setAttribute("aria-hidden", "true");
      reglaInf.setAttribute("aria-hidden", "true");
      document.body.append(reglaSup, reglaInf);
      raiz.style.setProperty("--a11y-regla-y", Math.round(window.innerHeight * 0.4) + "px");
      document.addEventListener("mousemove", alMouse, { passive: true });
      document.addEventListener("touchmove", alToque, { passive: true });
      document.addEventListener("focusin", alFoco);
    } else if (!ajustes.regla && reglaSup) {
      reglaSup.remove();
      reglaInf.remove();
      reglaSup = reglaInf = null;
      document.removeEventListener("mousemove", alMouse);
      document.removeEventListener("touchmove", alToque);
      document.removeEventListener("focusin", alFoco);
    }
  }

  const hayVoz = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let leyendo = false;

  function elegirVoz() {
    const voces = window.speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang));
    const prefs = ["es-PE", "es-MX", "es-US", "es-419", "es-AR", "es-CO", "es-ES"];
    for (const p of prefs) {
      const v = voces.find((x) => x.lang.replace("_", "-").toLowerCase() === p.toLowerCase());
      if (v) return v;
    }
    return voces[0] || null;
  }

  function textoParaLeer() {
    const seleccion = String(window.getSelection ? window.getSelection() : "").trim();
    if (seleccion) return seleccion;
    const zona =
      document.querySelector("main .glass-circle:not([inert])") ||
      document.querySelector("main") ||
      document.body;
    return (zona.innerText || "")
      .replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u2300-\u23FF\u2B00-\u2BFF\uFF0B⋮⌕×]/gu, " ")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function trocear(texto) {
    const frases = texto.split(/(?<=[.!?…:;])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
    const trozos = [];
    let actual = "";
    frases.forEach((f) => {
      if ((actual + " " + f).length > 220 && actual) {
        trozos.push(actual);
        actual = f;
      } else {
        actual = actual ? actual + " " + f : f;
      }
    });
    if (actual) trozos.push(actual);
    return trozos;
  }

  let anunciarFn = () => {};

  function detenerLectura(avisar) {
    if (!hayVoz) return;
    leyendo = false;
    window.speechSynthesis.cancel();
    if (avisar) anunciarFn("Lectura detenida.");
  }

  function iniciarLectura() {
    if (!hayVoz) return;
    detenerLectura(false);
    const texto = textoParaLeer();
    if (!texto) {
      anunciarFn("No hay texto para leer.");
      return;
    }
    const trozos = trocear(texto);
    const voz = elegirVoz();
    leyendo = true;
    anunciarFn("Leyendo en voz alta.");
    trozos.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = voz ? voz.lang : "es-PE";
      if (voz) u.voice = voz;
      u.rate = Number(ajustes.velocidad) || 1;
      if (i === trozos.length - 1) {
        u.onend = () => {
          leyendo = false;
        };
      }
      window.speechSynthesis.speak(u);
    });
  }

  function radios(nombre, titulo, opciones, actual) {
    return `
      <fieldset>
        <legend>${titulo}</legend>
        <div class="a11y-opciones">
          ${opciones
            .map(
              (o, i) => `
            <label>
              <input type="radio" name="a11y-${nombre}" value="${o.valor}" ${String(actual) === o.valor ? "checked" : ""} />
              ${o.muestra ? `<span class="a11y-muestra" aria-hidden="true" style="background:${o.muestra}"></span>` : ""}${o.texto}
            </label>`
            )
            .join("")}
        </div>
      </fieldset>`;
  }

  function interruptor(id, texto) {
    return `
      <li>
        <label class="a11y-sw">
          <span>${texto}</span>
          <input type="checkbox" role="switch" id="a11y-${id}" data-ajuste="${id}" ${ajustes[id] ? "checked" : ""} />
          <span class="pista" aria-hidden="true"></span>
        </label>
      </li>`;
  }

  function construir() {
    if (document.getElementById("a11yWidget")) return;

    const contenedor = document.createElement("div");
    contenedor.className = "a11y-widget";
    contenedor.id = "a11yWidget";
    contenedor.innerHTML = `
      <button type="button" class="a11y-btn" id="a11yBtn" aria-haspopup="dialog" aria-expanded="false"
        aria-controls="a11yPanel" title="Opciones de accesibilidad (Alt + A)">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="4.2" r="2.2"/>
          <path d="M12 7c-2.2 0-4.2-.3-6-.9a1 1 0 0 0-.6 1.9c1.300.4 2.700.7 4.100.9v4l-1.600 5.900a1 1 0 0 0 1.900.5L12 15l1.900 5.300a1 1 0 0 0 1.900-.5l-1.600-5.900v-4c1.400-.2 2.800-.5 4.100-.9a1 1 0 0 0-.6-1.900c-1.800.6-3.800.9-6 .9z"/>
        </svg>
        <span class="sr-only">Opciones de accesibilidad</span>
      </button>

      <section class="a11y-panel" id="a11yPanel" role="dialog" aria-labelledby="a11yTitulo" tabindex="-1" hidden>
        <div class="a11y-cabecera">
          <h2 id="a11yTitulo">Accesibilidad</h2>
          <button type="button" class="a11y-cerrar" id="a11yCerrar" aria-label="Cerrar opciones de accesibilidad">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p class="a11y-ayuda">Tus ajustes se guardan en este navegador y valen para todas las páginas del foro. Atajo: <kbd>Alt</kbd> + <kbd>A</kbd>. Cierra con <kbd>Esc</kbd>.</p>

        <div class="a11y-grupo">
          <h3>Texto</h3>
          <fieldset style="border-top:0;padding-top:0">
            <legend>Tamaño del texto</legend>
            <div class="a11y-tamano">
              <button type="button" class="a11y-mini" id="a11yMenos" aria-label="Reducir tamaño del texto"><span aria-hidden="true">A−</span></button>
              <output id="a11yEscala" for="a11yMenos a11yMas" aria-live="polite"></output>
              <button type="button" class="a11y-mini" id="a11yMas" aria-label="Aumentar tamaño del texto"><span aria-hidden="true">A+</span></button>
            </div>
          </fieldset>
          ${radios("espaciado", "Espaciado entre líneas y letras", [
            { valor: "0", texto: "Normal" },
            { valor: "1", texto: "Medio" },
            { valor: "2", texto: "Amplio" },
          ], ajustes.espaciado)}
          ${radios("fuente", "Tipo de letra", [
            { valor: "", texto: "Predeterminada" },
            { valor: "legible", texto: "Legible (Verdana)" },
            { valor: "dislexia", texto: "Redondeada (dislexia)" },
          ], ajustes.fuente)}
        </div>

        <div class="a11y-grupo">
          <h3>Color y contraste</h3>
          ${radios("tema", "Tema", [
            { valor: "", texto: "Claro" },
            { valor: "oscuro", texto: "Oscuro" },
            { valor: "contraste", texto: "Alto contraste" },
            { valor: "crema", texto: "Crema (menos brillo)" },
          ], ajustes.tema)}
          ${radios("paleta", "Colores para daltonismo", [
            { valor: "", texto: "Colores originales", muestra: "#ab1412" },
            { valor: "rojoverde", texto: "Rojo-verde (protanopía / deuteranopía)", muestra: "#0b4f9c" },
            { valor: "azulamarillo", texto: "Azul-amarillo (tritanopía)", muestra: "#b0003a" },
            { valor: "grises", texto: "Escala de grises", muestra: "#555555" },
          ], ajustes.paleta)}
        </div>

        <div class="a11y-grupo">
          <h3>Lectura y navegación</h3>
          <ul class="a11y-lista">
            ${interruptor("enlaces", "Resaltar enlaces")}
            ${interruptor("foco", "Foco de teclado reforzado")}
            ${interruptor("cursor", "Cursor grande")}
            ${interruptor("movimiento", "Reducir animaciones")}
            ${interruptor("regla", "Regla de lectura")}
          </ul>
        </div>

        <div class="a11y-grupo" id="a11yBloqueVoz">
          <h3>Leer en voz alta</h3>
          <div class="a11y-voz">
            <button type="button" class="a11y-mini" id="a11yLeer">▶ Leer</button>
            <button type="button" class="a11y-mini" id="a11yParar">■ Detener</button>
            <label for="a11yVelocidad" class="sr-only">Velocidad de lectura</label>
            <select id="a11yVelocidad">
              <option value="0.75">Lenta</option>
              <option value="1">Normal</option>
              <option value="1.3">Rápida</option>
            </select>
            <p class="a11y-voz-nota">Lee el texto que tengas seleccionado o, si no hay selección, el contenido principal de la página.</p>
          </div>
        </div>

        <div class="a11y-pie">
          <button type="button" class="a11y-reset" id="a11yReset">Restablecer todo</button>
        </div>

        <p class="sr-only" id="a11yEstado" role="status" aria-live="polite"></p>
      </section>
    `;
    document.body.appendChild(contenedor);

    const btn = document.getElementById("a11yBtn");
    const panel = document.getElementById("a11yPanel");
    const estado = document.getElementById("a11yEstado");
    const salidaEscala = document.getElementById("a11yEscala");
    const menos = document.getElementById("a11yMenos");
    const mas = document.getElementById("a11yMas");
    const velocidad = document.getElementById("a11yVelocidad");

    let temporizador;
    anunciarFn = (msg) => {
      estado.textContent = "";
      clearTimeout(temporizador);
      temporizador = setTimeout(() => (estado.textContent = msg), 60);
    };

    velocidad.value = ajustes.velocidad;

    function pintarEscala() {
      salidaEscala.textContent = ajustes.escala + " %";
      const i = ESCALAS.indexOf(ajustes.escala);
      menos.setAttribute("aria-disabled", String(i <= 0));
      mas.setAttribute("aria-disabled", String(i >= ESCALAS.length - 1));
    }

    function abrir() {
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      panel.focus();
    }

    function cerrar(devolverFoco) {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (devolverFoco) btn.focus();
    }

    btn.addEventListener("click", () => (panel.hidden ? abrir() : cerrar(false)));
    document.getElementById("a11yCerrar").addEventListener("click", () => cerrar(true));

    document.addEventListener("keydown", (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (panel.hidden) abrir();
        else cerrar(true);
        return;
      }
      if (e.key === "Escape" && !panel.hidden && !document.querySelector("dialog[open]")) {
        cerrar(true);
      }
    });

    function cambiarEscala(delta) {
      const i = ESCALAS.indexOf(ajustes.escala) + delta;
      if (i < 0 || i >= ESCALAS.length) return;
      ajustes.escala = ESCALAS[i];
      guardar();
      aplicar();
      pintarEscala();
      anunciarFn("Tamaño del texto: " + ajustes.escala + " por ciento.");
    }

    menos.addEventListener("click", () => cambiarEscala(-1));
    mas.addEventListener("click", () => cambiarEscala(1));

    const nombresRadio = { espaciado: "espaciado", fuente: "fuente", tema: "tema", paleta: "paleta" };
    panel.addEventListener("change", (e) => {
      const t = e.target;
      if (t.type === "radio") {
        const clave = t.name.replace("a11y-", "");
        if (clave in nombresRadio) {
          ajustes[clave] = t.value;
          guardar();
          aplicar();
          anunciarFn("Opción aplicada: " + t.closest("label").textContent.trim() + ".");
        }
      } else if (t.dataset && t.dataset.ajuste) {
        ajustes[t.dataset.ajuste] = t.checked;
        guardar();
        aplicar();
        const nombre = t.closest("label").querySelector("span").textContent.trim();
        anunciarFn(nombre + (t.checked ? ": activado." : ": desactivado."));
      } else if (t === velocidad) {
        ajustes.velocidad = velocidad.value;
        guardar();
      }
    });

    document.getElementById("a11yReset").addEventListener("click", () => {
      detenerLectura(false);
      ajustes = Object.assign({}, POR_DEFECTO);
      guardar();
      aplicar();
      panel.querySelectorAll('input[type="radio"]').forEach((r) => {
        const clave = r.name.replace("a11y-", "");
        r.checked = r.value === String(ajustes[clave]);
      });
      panel.querySelectorAll("[data-ajuste]").forEach((c) => (c.checked = false));
      velocidad.value = ajustes.velocidad;
      pintarEscala();
      anunciarFn("Todos los ajustes de accesibilidad se restablecieron.");
    });

    if (hayVoz) {
      document.getElementById("a11yLeer").addEventListener("click", iniciarLectura);
      document.getElementById("a11yParar").addEventListener("click", () => detenerLectura(true));
      window.speechSynthesis.getVoices();
    } else {
      document.getElementById("a11yBloqueVoz").innerHTML =
        "<h3>Leer en voz alta</h3><p class=\"a11y-voz-nota\">Tu navegador no incluye lectura en voz alta. Puedes usar el lector de pantalla de tu dispositivo.</p>";
    }

    window.addEventListener("pagehide", () => detenerLectura(false));
    pintarEscala();
    reglaActualizar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", construir);
  else construir();
})();
