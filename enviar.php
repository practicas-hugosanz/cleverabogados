<?php
/* ==========================================================================
   CLEVER ABOGADOS — recepción del formulario de contacto
   --------------------------------------------------------------------------
   Pensado para el hosting web de IONOS (PHP 7.4 o superior, función mail()
   disponible sin configurar SMTP).

   ANTES DE PUBLICAR, dos cosas en el panel de IONOS:

   1. Crear el buzón REMITENTE de más abajo. IONOS sólo acepta enviar correo
      cuyo «From» pertenezca a un dominio alojado en su servidor; si se pone
      aquí un gmail.com el mensaje se rechaza o cae en spam. El buzón no hace
      falta que lo lea nadie: es la identidad del servidor, no un contacto.

   2. Comprobar en «Rendimiento > PHP» que la versión sea 7.4 o superior.

   El correo del visitante NO se usa como remitente, sino como Reply-To: así
   el despacho responde con «Responder» y el mensaje sigue pasando el SPF del
   dominio.
   ========================================================================== */

/* ------------------------------------------------------------- ajustes -- */

$DESTINO   = 'info@cleverabogados.es';   // quién recibe las consultas
$REMITENTE = 'web@cleverabogados.es';    // buzón del dominio (ver nota 1)
$NOMBRE_DE = 'Web Clever Abogados';      // nombre visible del remitente

/* Materias admitidas. Debe coincidir con el <select> de index.html: si llega
   otra cosa, es que no ha salido del formulario. */
$MATERIAS = array(
  'Derecho Laboral', 'Derecho Civil', 'Familia y Sucesiones', 'Derecho Penal',
  'Derecho Bancario', 'Mercantil y Concursal', 'Contencioso-Administrativo',
  'Mediación', 'Otra consulta'
);

/* --------------------------------------------------------------- útiles -- */

/* Un salto de línea en una cabecera permite inyectar destinatarios ocultos y
   convertir el formulario en un relé de spam. Se eliminan siempre. */
function limpiar_cabecera($v) {
  return trim(str_replace(array("\r", "\n", "%0a", "%0d"), '', $v));
}

function campo($nombre) {
  return isset($_POST[$nombre]) ? trim((string) $_POST[$nombre]) : '';
}

/* Los asuntos con tildes viajan codificados o se ven rotos en muchos gestores. */
function asunto_utf8($texto) {
  return '=?UTF-8?B?' . base64_encode($texto) . '?=';
}

/* Responde en JSON al envío por fetch. Sin JavaScript: si ha ido bien se
   redirige a gracias.html —con 303, para que recargar no reenvíe el
   formulario— y si ha fallado se pinta el error aquí mismo, porque index.html
   es estático y no puede mostrarlo. */
function responder($ok, $mensaje) {
  $espera_json = (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
                  strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');

  if ($espera_json) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($ok ? 200 : 400);
    echo json_encode(array('ok' => $ok, 'mensaje' => $mensaje));
    exit;
  }

  if ($ok) {
    header('Location: gracias.html', true, 303);
    exit;
  }

  $texto = htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');
  http_response_code(400);
  header('Content-Type: text/html; charset=utf-8');
  echo <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>No se ha podido enviar | Clever Abogados</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="favicon.ico" sizes="any">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<header class="legalNav">
  <div class="legalNav__inner">
    <a href="index.html" aria-label="Clever Abogados — inicio"><img src="img/logo.png" alt="Clever Abogados" width="480" height="183"></a>
    <a href="index.html" class="lnk">Volver al inicio</a>
  </div>
</header>
<main class="e404 gracias">
  <div class="wrap">
    <h1>No hemos podido enviar su consulta</h1>
    <p class="e404__txt">$texto</p>
    <div class="e404__cta">
      <a href="index.html#contacto" class="btn">Volver al formulario</a>
      <a href="tel:+34966300232" class="btn btn--ghost">Llamar al 966 300 232</a>
    </div>
  </div>
</main>
</body>
</html>
HTML;
  exit;
}

/* ------------------------------------------------------- sólo por POST -- */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: index.html#contacto', true, 303);
  exit;
}

/* ------------------------------------------------------------ antispam -- */

/* Campo señuelo: está oculto por CSS, ninguna persona lo ve. Los robots que
   rellenan todos los campos del formulario sí lo completan. Se contesta que
   todo ha ido bien para no darles pistas sobre por qué no llega nada. */
if (campo('web') !== '') {
  responder(true, 'Gracias, hemos recibido su consulta.');
}

/* Un formulario relleno en menos de tres segundos no lo ha escrito una
   persona. El instante de carga viaja en un campo oculto.

   El sello lo pone el reloj del visitante, no el servidor, así que puede venir
   adelantado y dar una diferencia negativa. Se exige que esté entre 0 y 3
   segundos: ante un reloj desajustado se deja pasar la consulta. Perder un
   cliente por descartarlo en silencio es mucho peor que colar un robot. */
$cargado = (int) campo('t');
if ($cargado > 0) {
  $transcurrido = time() - $cargado;
  if ($transcurrido >= 0 && $transcurrido < 3) {
    responder(true, 'Gracias, hemos recibido su consulta.');
  }
}

/* ---------------------------------------------------------- validación -- */

$nombre  = limpiar_cabecera(campo('nombre'));
$email   = limpiar_cabecera(campo('email'));
$tel     = limpiar_cabecera(campo('tel'));
$materia = campo('materia');
$mensaje = campo('mensaje');
$rgpd    = campo('rgpd');

$errores = array();

if ($nombre === '')                                     $errores[] = 'el nombre';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))
                                                        $errores[] = 'un correo válido';
if ($mensaje === '')                                    $errores[] = 'la consulta';
if ($rgpd === '')                                       $errores[] = 'la aceptación de la política de privacidad';

if (!in_array($materia, $MATERIAS, true)) $materia = 'Otra consulta';

/* Recortes por si alguien envía el formulario fuera del navegador. */
if (mb_strlen($nombre) > 120)    $nombre  = mb_substr($nombre, 0, 120);
if (mb_strlen($tel) > 40)        $tel     = mb_substr($tel, 0, 40);
if (mb_strlen($mensaje) > 5000)  $mensaje = mb_substr($mensaje, 0, 5000);

if ($errores) {
  responder(false, 'Falta ' . implode(', ', $errores) . '.');
}

/* ------------------------------------------------------------- mensaje -- */

$fecha = date('d/m/Y \a \l\a\s H:i');
$ip    = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'desconocida';

$cuerpo =
  "Nueva consulta desde cleverabogados.es\n" .
  "======================================\n\n" .
  "Nombre:    $nombre\n" .
  "Correo:    $email\n" .
  "Teléfono:  " . ($tel !== '' ? $tel : '—') . "\n" .
  "Materia:   $materia\n\n" .
  "Consulta:\n" .
  "---------\n" .
  "$mensaje\n\n" .
  "---------------------------------------\n" .
  "Constancia del consentimiento (RGPD)\n" .
  "Aceptó el aviso legal y la política de privacidad el $fecha.\n" .
  "Dirección IP desde la que se envió: $ip\n" .
  "Conserve este correo: es la prueba del consentimiento.\n";

$cabeceras = array(
  'From: ' . asunto_utf8($NOMBRE_DE) . ' <' . $REMITENTE . '>',
  'Reply-To: ' . asunto_utf8($nombre) . ' <' . $email . '>',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
  'MIME-Version: 1.0',
  'X-Mailer: PHP/' . phpversion()
);

/* La @ es deliberada: si el servidor de correo falla, mail() imprime un aviso
   con la ruta absoluta del archivo. Eso rompería el JSON que espera el
   navegador y además enseñaría al visitante dónde vive el script. Nos basta
   con el valor de retorno. */
$enviado = @mail(
  $DESTINO,
  asunto_utf8('Consulta web — ' . $materia . ' — ' . $nombre),
  $cuerpo,
  implode("\r\n", $cabeceras)
);

if ($enviado) {
  responder(true, 'Consulta enviada. Le responderemos en menos de 24 horas laborables.');
}

/* Si mail() falla es cosa del servidor, no del visitante: se le da una salida
   por la que sí puede contactar. */
responder(false, 'No hemos podido enviar la consulta. Escríbanos a ' . $DESTINO . ' o llame al 966 300 232.');
