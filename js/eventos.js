(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CLAVE = "foroEventos";

  const EVENTOS = [
    { id: "feria-ciencias", titulo: "Feria de Ciencias", fecha: "2026-09-05", ini: "10:00", fin: "17:00", lugar: "Auditorio principal", modalidad: "Presencial", cat: "academico", desc: "Proyectos de investigación de estudiantes de todas las facultades." },
    { id: "semana-ingenieria", titulo: "Semana de Ingeniería", fecha: "2026-09-10", ini: "09:00", fin: "18:00", lugar: "Campus universitario", modalidad: "Presencial", cat: "academico", desc: "Conferencias, visitas guiadas y concursos de las carreras de ingeniería." },
    { id: "talleres-universitarios", titulo: "Talleres universitarios", fecha: "2026-09-15", ini: "15:00", fin: "18:00", lugar: "Pabellón de talleres", modalidad: "Presencial", cat: "academico", desc: "Talleres cortos de habilidades blandas y herramientas digitales." },

    { id: "noche-talentos", titulo: "Noche de talentos", fecha: "2026-12-11", ini: "19:00", fin: "22:00", lugar: "Teatro universitario", modalidad: "Presencial", cat: "cultural", desc: "Baile, teatro, música y humor presentados por estudiantes." },
    { id: "feria-becas", titulo: "Feria de becas y movilidad estudiantil", fecha: "2026-11-10", ini: "10:00", fin: "16:00", lugar: "Plaza central", modalidad: "Presencial", cat: "academico", desc: "Conoce becas, intercambios y convenios con universidades del extranjero." },
    { id: "hackathon", titulo: "Hackathon universitario", fecha: "2026-11-14", ini: "09:00", fin: "21:00", lugar: "Laboratorio de cómputo 3", modalidad: "Presencial", cat: "tecnologia", desc: "Equipos de hasta cuatro personas resuelven un reto en un día. Inscripción por equipos." },
    { id: "festival-musica", titulo: "Festival de música y poesía", fecha: "2026-11-19", ini: "19:00", fin: "21:30", lugar: "Teatro universitario", modalidad: "Presencial", cat: "cultural", desc: "Presentaciones de grupos musicales y lecturas de poesía de la comunidad." },
    { id: "interfacultades", titulo: "Campeonato interfacultades de fútbol", fecha: "2026-11-21", ini: "08:00", fin: "17:00", lugar: "Campo deportivo", modalidad: "Presencial", cat: "deporte", desc: "Fase final del campeonato. Entrada libre para toda la comunidad." },
    { id: "abrigos", titulo: "Campaña de donación de abrigos", fecha: "2026-11-26", ini: "09:00", fin: "15:00", lugar: "Hall principal", modalidad: "Presencial", cat: "voluntariado", desc: "Trae ropa de abrigo en buen estado o ayuda a clasificarla como voluntario." },
    { id: "taller-apa", titulo: "Taller de normas APA 7", fecha: "2026-12-02", ini: "17:00", fin: "18:30", lugar: "Videollamada (el enlace llega por correo)", modalidad: "Virtual", cat: "academico", desc: "Citas, referencias y formato de trabajos académicos, con ejemplos." },
    { id: "feria-laboral", titulo: "Feria laboral y de prácticas", fecha: "2026-12-04", ini: "10:00", fin: "15:00", lugar: "Auditorio principal", modalidad: "Presencial", cat: "academico", desc: "Empresas con ofertas de prácticas y primer empleo. Lleva tu CV impreso." },
    { id: "noche-talentos", titulo: "Noche de Talentos", fecha: "2026-12-11", ini: "19:00", fin: "22:00", lugar: "Teatro universitario", modalidad: "Presencial", cat: "cultural", desc: "Baile, teatro, música y humor presentados por estudiantes." },
  ];

  const CATEGORIAS = {
    academico: "Académico",
    tecnologia: "Tecnología",
    cultural: "Cultural",
    deporte: "Deporte",
    voluntariado: "Voluntariado",
  };

  const filtro = { cat: "todos", texto: "", pasados: false };
  let asistire = new Set();
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (Array.isArray(g)) asistire = new Set(g);
  } catch (e) {
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify([...asistire]));
    } catch (e) {
    }
  }

  const parsear = (fecha, hora) => new Date(fecha + "T" + hora + ":00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const esPasado = (ev) => parsear(ev.fecha, "23:59") < hoy;

  const fmtMes = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" });
  const fmtMesCorto = new Intl.DateTimeFormat("es-PE", { month: "short" });
  const fmtDia = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" });

  const textoNormal = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function escICS(t) {
    return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function aICS(fecha, hora) {
    return fecha.replace(/-/g, "") + "T" + hora.replace(":", "") + "00";
  }

  function descargarICS(ev) {
    const ahora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const lineas = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Foro USMP//Eventos//ES",
      "BEGIN:VEVENT",
      "UID:" + ev.id + "@foro.usmp",
      "DTSTAMP:" + ahora,
      "DTSTART:" + aICS(ev.fecha, ev.ini),
      "DTEND:" + aICS(ev.fecha, ev.fin),
      "SUMMARY:" + escICS(ev.titulo),
      "LOCATION:" + escICS(ev.lugar),
      "DESCRIPTION:" + escICS(ev.desc),
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const blob = new Blob([lineas.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "evento-" + ev.id + ".ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.mostrarAviso("Descarga iniciada: añade el archivo a tu calendario.");
  }

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function tarjeta(ev) {
    const pasado = esPasado(ev);
    const d = parsear(ev.fecha, ev.ini);

    const li = el("li", "evento-card" + (pasado ? " pasado" : ""));
    li.id = "evento-" + ev.id;

    const time = el("time", "evento-fecha");
    time.dateTime = ev.fecha;
    time.append(el("strong", "", String(d.getDate()).padStart(2, "0")));
    const mes = el("span", "", fmtMesCorto.format(d).replace(".", ""));
    mes.setAttribute("aria-hidden", "true");
    time.append(mes, el("span", "sr-only", " de " + fmtMes.format(d)));

    const cuerpo = el("div", "evento-cuerpo");
    const h3 = el("h3", "", ev.titulo);
    h3.id = "titulo-" + ev.id;
    h3.tabIndex = -1;

    const meta = el("ul", "evento-meta");
    meta.setAttribute("aria-label", "Detalles del evento");
    const dia = fmtDia.format(d);
    const items = [
      ["calendar-event", dia.charAt(0).toUpperCase() + dia.slice(1), "Fecha"],
      ["clock", ev.ini + " – " + ev.fin, "Hora"],
      ["geo-alt", ev.lugar, "Lugar"],
    ];
    items.forEach(([icono, texto, nombre]) => {
      const li2 = el("li");
      const ic = el("i", "bi bi-" + icono);
      ic.setAttribute("aria-hidden", "true");
      li2.append(ic, " ", el("span", "sr-only", nombre + ": "), texto);
      meta.appendChild(li2);
    });

    const etiquetas = el("div", "evento-etiquetas");
    etiquetas.append(el("span", "etiqueta", CATEGORIAS[ev.cat]), el("span", "etiqueta", ev.modalidad));
    if (pasado) etiquetas.append(el("span", "etiqueta", "Finalizado"));

    cuerpo.append(h3, meta, el("p", "", ev.desc), etiquetas);

    if (!pasado) {
      const acciones = el("div", "evento-acciones");

      const asistir = el("button", "btn-secundario btn-asistir", "Asistiré");
      asistir.type = "button";
      asistir.dataset.accion = "asistir";
      asistir.dataset.id = ev.id;
      asistir.setAttribute("aria-pressed", String(asistire.has(ev.id)));
      asistir.setAttribute("aria-label", "Asistiré: " + ev.titulo);

      const ics = el("button", "btn-secundario", "Añadir al calendario");
      ics.type = "button";
      ics.dataset.accion = "ics";
      ics.dataset.id = ev.id;
      ics.setAttribute("aria-label", "Añadir al calendario: " + ev.titulo);

      acciones.append(asistir, ics);
      cuerpo.appendChild(acciones);
    }

    li.append(time, cuerpo);
    return li;
  }

  function visibles() {
    const q = textoNormal(filtro.texto.trim());
    return EVENTOS.filter((ev) => {
      if (!filtro.pasados && esPasado(ev)) return false;
      if (filtro.cat !== "todos" && ev.cat !== filtro.cat) return false;
      if (q && !textoNormal([ev.titulo, ev.lugar, ev.desc, CATEGORIAS[ev.cat]].join(" ")).includes(q)) return false;
      return true;
    }).sort((a, b) => parsear(a.fecha, a.ini) - parsear(b.fecha, b.ini));
  }

  function render() {
    const cont = $("contenidoEventos");
    const lista = visibles();
    cont.textContent = "";

    let mesActual = "";
    let ul = null;
    lista.forEach((ev) => {
      const d = parsear(ev.fecha, ev.ini);
      const clave = d.getFullYear() + "-" + d.getMonth();
      if (clave !== mesActual) {
        mesActual = clave;
        const nombreMes = fmtMes.format(d);
        const h2 = el("h2", "mes-titulo", nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1));
        ul = el("ul", "lista-eventos");
        cont.append(h2, ul);
      }
      ul.appendChild(tarjeta(ev));
    });

    $("sinEventos").classList.toggle("oculto", lista.length > 0);
    $("estadoEventos").textContent =
      lista.length === 0 ? "No hay eventos con esos filtros." : "Mostrando " + lista.length + (lista.length === 1 ? " evento." : " eventos.");
    pintarMis();
  }

  function pintarMis() {
    const ul = $("listaMis");
    ul.textContent = "";
    const mios = EVENTOS.filter((ev) => asistire.has(ev.id) && !esPasado(ev)).sort(
      (a, b) => parsear(a.fecha, a.ini) - parsear(b.fecha, b.ini)
    );
    mios.forEach((ev) => {
      const li = el("li");
      const a = el("a", "", ev.titulo);
      a.href = "#evento-" + ev.id;
      a.dataset.ir = ev.id;
      const d = parsear(ev.fecha, ev.ini);
      li.append(a, el("small", "", fmtDia.format(d) + " · " + ev.ini));
      ul.appendChild(li);
    });
    $("contadorMis").textContent = mios.length;
    $("contadorMis").setAttribute("aria-label", mios.length + (mios.length === 1 ? " evento" : " eventos"));
    $("misVacio").hidden = mios.length > 0;
  }

  $("contenidoEventos").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-accion]");
    if (!b) return;
    const ev = EVENTOS.find((x) => x.id === b.dataset.id);
    if (!ev) return;

    if (b.dataset.accion === "ics") {
      descargarICS(ev);
      return;
    }

    const marcar = !asistire.has(ev.id);
    if (marcar) asistire.add(ev.id);
    else asistire.delete(ev.id);
    guardar();
    b.setAttribute("aria-pressed", String(marcar));
    pintarMis();
    window.mostrarAviso(marcar ? "Marcaste que asistirás a: " + ev.titulo : "Quitaste tu asistencia a: " + ev.titulo);
  });

  $("listaMis").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-ir]");
    if (!a) return;
    e.preventDefault();
    if (!visibles().some((ev) => ev.id === a.dataset.ir)) {
      filtro.cat = "todos";
      filtro.texto = "";
      $("buscarEvento").value = "";
      marcarChip();
      render();
    }
    const titulo = $("titulo-" + a.dataset.ir);
    if (titulo) {
      titulo.scrollIntoView({ block: "center" });
      titulo.focus();
    }
  });

  function marcarChip() {
    document.querySelectorAll("#chipsCategoria .chip").forEach((c) => {
      c.setAttribute("aria-pressed", String(c.dataset.cat === filtro.cat));
    });
  }

  $("chipsCategoria").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    filtro.cat = c.dataset.cat;
    marcarChip();
    render();
  });

  $("buscarEvento").addEventListener("input", (e) => {
    filtro.texto = e.target.value;
    render();
  });

  $("verPasados").addEventListener("change", (e) => {
    filtro.pasados = e.target.checked;
    render();
  });

  render();
})();
