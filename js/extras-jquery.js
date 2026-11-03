$(function () {
  const URL_BOOTSTRAP =
    "https://cdn.jsdelivr.net/npm/bootstrap@6.0.0-alpha.1/dist/js/bootstrap.bundle.min.js";

  const $aviso = $("#toastAviso");
  let toast = null;

  function toastRespaldo() {
    let temporizador;
    return {
      show() {
        $aviso.addClass("show");
        clearTimeout(temporizador);
        temporizador = setTimeout(() => $aviso.removeClass("show"), 6000);
      },
    };
  }

  window.mostrarAviso = function (mensaje) {
    $("#toastMensaje").text(mensaje);
    (toast || (toast = toastRespaldo())).show();
  };

  import(URL_BOOTSTRAP)
    .then(function (bs) {
      $('[data-bs-toggle="tooltip"]').each(function () {
        bs.Tooltip.getOrCreateInstance(this);
      });
      toast = bs.Toast.getOrCreateInstance($aviso[0], { delay: 6000 });
    })
    .catch(function () {
      toast = toastRespaldo();
    });

  $aviso.on("click", "[data-bs-dismiss='toast']", function () {
    $aviso.removeClass("show");
  });

  $("#listaPublicaciones").on("click", ".menu-item", function () {
    window.mostrarAviso($(this).data("mensaje"));
  });

  $(".hashtags").on("click", "button", function () {
    const termino = $(this).data("buscar");
    const $campo = $("#campoBusqueda");

    $campo.val($campo.val() === termino ? "" : termino);

    $campo[0].dispatchEvent(new Event("input", { bubbles: true }));
  });
});
