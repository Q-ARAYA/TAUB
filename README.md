# Para ti ♡
PWA romántica, mobile-first, sin dependencias ni backend. HTML, CSS y JavaScript editables directamente.

## Probar
Instala Node.js y ejecuta:
```sh
npm start
npm test
```
Abre http://localhost:4173. El servidor es solo para desarrollo. El service worker funciona en localhost y en producción con HTTPS.

## Tarjetas y mensaje
Edita cards.js. Las 11 letras actuales forman el secreto; los separadores están en 2, 5 y 7. No marques la tarjeta 6. El texto final se construye automáticamente desde las letras entre llaves y se muestra con la primera letra mayúscula.

Cada tarjeta necesita numero (entero positivo único), mensaje con exactamente una letra entre llaves, imagen (ruta opcional), ilustracion y palabrasEstilo opcional. Ejemplo:
```js
{ numero: 12, mensaje: 'Un abrazo para {T}i.', imagen: 'assets/cards/12.png', ilustracion: 'corazon', separadorDespuesDeLetra: true, palabrasEstilo: [] }
```
Coloca tus imágenes en assets/cards/ y usa rutas relativas. Se admite PNG, JPG, WebP y SVG. Si una imagen falla, aparece la ilustración. Ilustraciones disponibles: corazon, flor, abejas, estrellas, arco, sol, atardecer, globos, mapache. Fuentes por palabra: pixel y cursiva; amplía fontMap en app.js y las clases CSS para otras. Usa palabrasEstilo: [{palabra: 'Minecraft', fuente: 'pixel'}].

Al añadir tarjetas, se conserva el progreso previo y el nuevo contenido entra al sorteo. Se vuelve a exigir completar la colección para el nuevo secreto. Los números definen el orden, no el orden del archivo. Reinicia el progreso si cambias números existentes.

## Horario y progreso
El día lógico cambia a las 05:00 de Costa Rica (11:00 UTC), sin depender de la zona horaria del teléfono. La primera apertura desbloquea una tarjeta incluso antes de las 5, correspondiente al día lógico anterior. No se acumulan días ausentes. El reloj del dispositivo determina la hora; no existe validación con servidor.

localStorage guarda el progreso por navegador y origen. No hay sincronización entre ustedes, entre Safari y la app instalada, ni entre dispositivos. Borrar los datos del sitio borra la colección. El modo privado puede no conservar el progreso.

## Administrador
Abre /?admin=1 para administrar la siguiente tarjeta y las aperturas extra, o para usar los controles de prueba.

- **Próxima tarjeta:** elige una de las pendientes y pulsa Guardar elección. Esa tarjeta reemplaza el sorteo en la próxima apertura; no adelanta el horario. Puedes cambiarla o volver a Aleatoria antes de que se abra. La elección se borra automáticamente cuando se desbloquea la siguiente tarjeta.
- **Habilitar una apertura extra:** aparece un botón de sorpresa en la pantalla principal. Ella decide cuándo tocar Abrir. No se revela automáticamente ni se borra el día del último desbloqueo. Es una sola oportunidad (no se acumulan); puedes cancelarla antes de usarla. Puedes habilitarla con tarjeta elegida o con sorteo aleatorio.
- Una apertura extra se consume cuando se abre la siguiente tarjeta, incluso si llega antes el desbloqueo habitual de las 5:00. Después se retoma el horario normal. No adelanta la tarjeta del día siguiente.
- Sin elección ni apertura extra se mantiene exactamente el comportamiento diario habitual.
- Elección y oportunidad quedan guardadas en localStorage y sobreviven a recargas. **Estos controles solo afectan al mismo navegador/origen**, incluyendo sus otras pestañas. No se sincronizan desde tu dispositivo al iPhone de ella; para administración remota hace falta un backend con autenticación.

También puedes forzar la siguiente inmediatamente, desbloquear todas, reiniciar o simular una hora de Costa Rica. La simulación dura hasta recargar o volver a hora real. Usa reiniciar después de pruebas con fechas futuras. El parámetro es una herramienta oculta, no autenticación: cualquier persona con acceso al sitio y al parámetro puede usarlo.

## Desplegar
Para GitHub Pages: sube los archivos al repositorio, entra a Settings → Pages, selecciona Deploy from a branch y elige la rama y carpeta raíz. Para Netlify: despliega esta carpeta como sitio estático, sin comando de build. Para Vercel: importa el repositorio con preset Other, sin build. No es necesario subir node_modules ni ejecutar compilación.

**Privacidad:** estos archivos no implementan control de acceso. GitHub Pages y los enlaces públicos pueden ser visitados por otras personas. Para limitar el acceso a ustedes dos, elige alojamiento con autenticación o protección de acceso y configura ambas cuentas antes de compartir. Un enlace secreto no sustituye esa protección.

En cada actualización cambia CACHE en sw.js. La nueva versión se activará al cerrar las ventanas de la app y volver a abrir. Tras una primera visita online, el contenido básico queda disponible offline. Las fuentes externas tienen alternativas locales y pueden no estar disponibles sin internet; las imágenes propias visitadas se guardan en caché.

## Instalar en iPhone
Abre el enlace HTTPS en Safari → Compartir → Añadir a pantalla de inicio → Añadir. Abre el icono Para ti. Respeta el área del notch y la barra inferior; incluye iconos PNG y modo standalone.

## Accesibilidad y controles
Arrastra las tarjetas desde el asa de puntos. También hay botones Subir/Bajar para teclado y toque. El revelado respeta Reducir movimiento de iOS. El secreto aparece únicamente con todas las tarjetas reunidas en orden numérico; el botón permite volver a verlo.

## Animaciones y temas de las cartas
Cada apertura, incluida una visita desde la colección o un toque en la carta del día, muestra el reverso romántico y lo gira para revelar el mensaje. El fondo usa detalles tenues basados en ilustracion, también cuando la carta tiene imagen propia. Los temas nuevos usan corazones como alternativa.

Con todas las cartas reunidas y ordenadas, pulsa Descubrir el secreto: las mismas cartas se agrupan por los separadores de los datos y giran en secuencia para dejar únicamente sus letras. Después aparece la frase calculada y flotan corazones. Ordenarlas por sí solo ya no revela el secreto. Volver a mis tarjetas recupera la colección y permite repetir la animación. Reducir movimiento muestra el resultado sin giros ni partículas.

### Apertura en grande y partículas
Al entrar a la app, desbloquear una carta o volver a abrirla, se muestra en un diálogo a pantalla completa con su escena temática. La tarjeta da dos vueltas y media antes de quedar de frente, acompañada por estrellas doradas y rosas. Las partículas viven dentro del diálogo para que se vean encima de la carta y se limpian al terminar o cerrar. Reducir movimiento desactiva los giros y partículas. Los fondos incluyen ilustraciones grandes del tema y una paleta propia.

### Descubrimiento por toque
Al llegar un nuevo día lógico o en la primera visita, aparece una tarjeta cerrada con el botón **Descubrir mi tarjeta de hoy**. La aplicación espera el toque antes de sortear (o tomar la elección del administrador), añadir la tarjeta a la colección y abrir la animación en grande. Recargar, volver a la app o entrar a Mis tarjetas no descubre la carta pendiente ni muestra su letra o ilustración. Las cartas ya abiertas siguen disponibles y solo se animan cuando se tocan. Las aperturas extra mantienen su botón y también esperan el toque; los controles de forzar y desbloquear todas siguen siendo herramientas de prueba explícitas.

### Desbloquear siguiente desde administración
El botón Desbloquear siguiente habilita una sola oportunidad y vuelve a la pantalla de la tarjeta cerrada con Descubrir mi tarjeta de hoy. No sortea, añade ni muestra la carta todavía. Solo el toque en Descubrir consume esa oportunidad y reproduce la animación; respeta la próxima carta elegida por el administrador. Recargar conserva la oportunidad pendiente y pulsar varias veces no las acumula. Habilitar una apertura extra usa el mismo paso de descubrimiento. Desbloquear todas continúa siendo una acción de prueba inmediata.

## Separación entre administrador y vista normal (comportamiento actual)
Esta sección reemplaza las descripciones anteriores de desbloqueo desde administrador.

- En /?admin=1 se muestra únicamente el panel administrador y la galería de vistas previas de todas las cartas. Abrirlas muestra la animación sin guardar descubrimientos, cambiar el orden, alterar el último día ni consumir la próxima carta o la oportunidad extra. La consulta de este panel tampoco escribe el progreso.
- Guardar elección, Habilitar siguiente en la vista normal, Habilitar apertura extra y Cancelar apertura extra solo cambian la configuración correspondiente. Se conserva el progreso más reciente de la vista normal para evitar que una pestaña administrativa antigua lo sobrescriba.
- La vista normal (sin ?admin=1) es la única que puede añadir cartas a la colección, al pulsar Descubrir. El enlace Ir a la vista normal cambia explícitamente a esa experiencia.
- Ver todas las tarjetas solo lleva a la galería de vistas previas; ya no desbloquea la colección.
- Reiniciar progreso normal es una acción de mantenimiento explícita con confirmación; nunca se ejecuta al consultar o previsualizar cartas.
- El progreso guardado antes de esta corrección se conserva, porque no es posible distinguir las cartas abiertas durante pruebas de las descubiertas por ella. Si el progreso pertenece únicamente a pruebas, se puede usar Reiniciar progreso normal.
- Las preferencias y oportunidades solo se comparten entre pestañas del mismo navegador y origen. Esta separación de vistas no añade autenticación ni sincronización entre dispositivos.

## Última tarjeta descubierta y fotos
El administrador muestra el número, mensaje y momento de la última carta descubierta en la vista normal, con horario de Costa Rica. La carta también queda marcada en su galería como ÚLTIMA DESCUBIERTA; las demás indican DESCUBIERTA o PENDIENTE. Ver una vista previa o cambiar una configuración no altera esta información. Los datos anteriores conservan el número y día lógico; la hora exacta se registra desde esta versión. La información se actualiza entre pestañas y al volver al panel; sigue siendo local al mismo navegador/origen.

Las cinco fotos facilitadas están en assets/memories y forman un collage de fondo tanto en la aplicación como en la apertura en grande. Se copian sin modificar los originales; el encuadre y la transparencia se aplican con CSS. La capa de fotos es independiente de los temas y se incluye en la caché offline.

## Asignación antes de descubrir (comportamiento actual)
La tarjeta se asigna y guarda cuando la apertura está disponible: al comenzar el día lógico de las 5 AM o al habilitar una oportunidad extra. La app realiza la asignación en su primera ejecución a partir de ese momento si estaba cerrada. El administrador puede ver número, mensaje y vista previa bajo Tarjeta asignada, aún sin descubrir. No entra a la colección ni se revela a ella hasta tocar Descubrir.

La asignación no cambia al recargar, pasar más tiempo o volver a previsualizar. Mientras no se descubra, Guardar elección reemplaza la tarjeta asignada por otra pendiente. Volver a Aleatoria genera una nueva asignación si ya puede abrir. Si aún no llegó la hora, la elección se guarda para entonces. Al descubrir se consumen asignación, elección y oportunidad; la última descubierta sigue mostrándose por separado. Cancelar la apertura extra quita la disponibilidad anticipada si todavía no llegó el día normal. Esta configuración sigue siendo local al mismo navegador/origen.

## Acabado visual
modern.css contiene la capa visual blanca y rosada: paneles claros, botones y controles modernos, tipografía limpia y tarjetas con esquinas suaves. style.css conserva las animaciones y los temas. Las fotos continúan visibles en el fondo, incluso en las aperturas de cartas. Ambos archivos de estilos están incluidos en la caché offline.

## Tipografías de películas
Las tarjetas de Mérida/Valiente y Up usan estilos inspirados en sus títulos, con fuentes gratuitas de Google Fonts: Cinzel y Barlow Condensed. No son las fuentes oficiales de los logotipos. Se aplican mediante palabrasEstilo con fuente valiente o up; Minecraft conserva pixel. El renderizador permite palabras que incluyan una letra marcada, como {U}p, y mantiene esa letra destacada tanto en colección como en la carta grande. Si no hay conexión, se usan las fuentes alternativas del sistema.
