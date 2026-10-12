# Guía práctica y técnica

[Guía de uso](#usage) · [Preguntas y entrevista](#interview) · [Diseño técnico](#architecture) · [Proyectos de referencia](#related-work)

<a id="usage"></a>

## Guía de uso

### Empezar con calma

Pregunta por un momento pequeño. Un familiar puede escribir mientras una persona mayor cuenta. Se puede descansar o saltar preguntas. Para una vida larga, reúne entrevistas breves y escribe un capítulo cada vez. No uses una meta de palabras para inventar o presionar.

La aplicación lee texto `.txt`, `.md`, `.csv` y `.json`, hasta 1 MB por archivo. Indica quién cuenta, fecha aproximada del hecho, personas, lugar, fuente y permiso. La fecha de la entrevista no tiene por qué ser la del hecho.

Los chats escritos no necesitan reconocimiento de voz. Exporta o copia fragmentos relevantes con los métodos permitidos por la herramienta original. No se importan automáticamente todos los chats. Conserva las grabaciones, transcríbelas con tu herramienta y corrige nombres y hechos. El dictado del navegador no equivale a transcribir un archivo subido.

Las fotos necesitan descripciones: quién, cuándo, dónde y qué se sabe. Conserva las dudas. La aplicación no lee imágenes, PDF ni cartas manuscritas. Los originales se guardan en tu carpeta y no dentro de la copia de textos.

### IA y revisión

Los materiales importados no se envían a la IA hasta seleccionarlos. Las respuestas guardadas y los materiales elegidos sirven para escribir; la revisión también usa el capítulo actual. La IA puede ordenar y expresar lo aportado, no inventar una vida. Guarda las referencias en el borrador. Quien cuenta decide la veracidad, la privacidad y lo que se omite.

“Usar mi propia IA” crea instrucciones sin materiales privados por defecto. Elige la tarea e indica si incluyes materiales. Pega después el capítulo o el JSON documentado. Una IA que use el ordenador puede leer [su guía de instrucciones](AI-HANDOFF.es.md).

Las peticiones y entregas a una IA en línea envían los textos incluidos a ese servicio. Guardar localmente no convierte una IA en la nube en una IA sin conexión. Pide permiso para recoger y compartir materiales de otras personas. Las Keys no entran en copias ni instrucciones.

### Guardar y recuperar

Descarga regularmente la copia completa de los textos: contiene respuestas, fuentes de texto, capítulos y una respuesta sin terminar; no contiene Keys ni archivos originales. Recuperar crea unas memorias nuevas y mantiene lo anterior. Markdown sirve para editar y compartir, no para recuperar todo el proyecto.

El almacenamiento depende del navegador y de la dirección. Abrir el archivo, cambiar de puerto o usar otro navegador puede mostrar otro almacenamiento. Haz una copia antes de cambiar. La navegación privada y el borrado de datos pueden eliminar el trabajo local.

### Libro impreso: preparación y pasos

Prepara texto revisado, fotos originales seleccionadas con descripciones, título y portada, índice, PDF de impresión y un ejemplar de prueba. Usa una herramienta de maquetación que conozcas o pide ayuda a la imprenta.

1. Busca una imprenta, una copistería o un servicio de libros de tirada pequeña.
2. Consulta cantidad, tamaño, páginas, papel, color, encuadernación, plazo y precio.
3. Pide los requisitos reales de PDF, sangrado, margen interior, portada y lomo antes de maquetar.
4. Usa imágenes originales. Aleja texto y caras del corte y del pliegue de encuadernación.
5. Exporta y revisa el PDF: fuentes, orden de páginas, imágenes y páginas en blanco previstas.
6. Imprime una prueba. Comprueba lectura con el destinatario, ortografía, fotos, recortes y encuadernación.
7. Corrige y encarga los ejemplares. Envía el archivo de impresión, no entrevistas privadas originales.

Puedes preguntar: «Quiero una tirada pequeña de memorias personales: unas [páginas] páginas y [ejemplares] copias, con [fotos] fotos. ¿Qué tamaño, papel y encuadernación recomiendan? Indiquen precio de prueba y copias finales, plazo y requisitos PDF de interior y portada».

La impresión del navegador permite «Guardar como PDF»; no diseña automáticamente un libro de fotos ni una portada lista para imprenta. Confirma las especificaciones aparte.

### Álbumes, marcos y archivo

Para un libro de fotos, elige originales y descripciones reales; prueba recortes y pliegues. Las escenas creadas con IA deben decir «ilustración de IA»: no son fotos históricas. Conserva originales junto a imágenes restauradas.

Prueba fotos y tarjetas de historias en una tableta o marco existente antes de comprar equipos. Comprueba los formatos. Un marco casero necesita hardware compatible, pantalla, alimentación apropiada, almacenamiento, cables y carcasa; prueba el programa antes de comprarlo todo.

Mantén copias independientes de grabaciones, textos, fotos, obra final y lista de fuentes. El NAS es opcional; sincronizar no basta para recuperar. Usa distintos medios y, cuando sea posible, otro lugar, y prueba abrir o recuperar archivos.

Proyectos independientes opcionales: [faster-whisper](https://github.com/SYSTRAN/faster-whisper) para transcribir, [Immich](https://github.com/immich-app/immich) para fotos, [picframe](https://github.com/helgeerbe/picframe) para un marco con Raspberry Pi y [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) para documentos. MFH los enlaza; no ha integrado ni verificado tu instalación. Sigue sus documentos y condiciones.

### Entrevista y diseño técnico

[Preguntas y entrevista](guide.es.md#interview) · [Diseño técnico](guide.es.md#architecture) · [Proyectos de referencia](guide.es.md#related-work)

<a id="interview"></a>

## Preguntas y entrevista

“Cuéntame toda tu vida” es demasiado amplio; una fecha exacta puede ser difícil. Empieza por un momento pequeño. Más preguntas ofrecen opciones, no un formulario obligatorio.

### Preguntas iniciales

| Historia | Preguntas | Temas |
| --- | --- | --- |
| Pareja | 24 | Encuentro, vida cotidiana, distancia, cambios y palabras |
| Matrimonio y familia | 24 | Decisiones, hogar, hábitos, cuidados y cambios |
| Una vida | 48 | Infancia, escuela, trabajo, mudanzas, familia y vida posterior |
| Compañeros de servicio | 20 | Vida compartida, ayuda, despedidas, reencuentros y objetos |
| Compañeros de trabajo | 20 | Llegada, colaboración, desacuerdos, aprendizaje y despedida |
| Compañeros de estudios | 20 | Rutinas, amigos, actividades, graduación y reencuentro |

Cada idioma tiene los mismos 156 temas. Sin IA, las preguntas siguen el orden elegido y vuelven al principio al terminar. La API continúa desde respuestas seleccionadas. No hay seguimiento automático de etapas completadas.

### Elegir una sola pregunta

Parte de un detalle ya mencionado. Pregunta dónde ocurrió, qué hizo alguien, qué objeto recuerda o qué pasó después. Si la escena está clara, cambia de tema. Aclara el orden solo cuando haga falta y acepta fechas aproximadas. Deja que la persona describa sus sentimientos sin sugerir una emoción o respuesta.

Ejemplo ficticio: “Iba al trabajo en bicicleta”. → “¿Por dónde pasabas?” → “Por un puente y un puesto de desayunos”. → “¿Qué solías comer allí?”. Así aparecen detalles sin inventar clima ni motivos.

Separa las versiones de cada persona. Pregunta si un fragmento se puede compartir. Se puede saltar o descansar. Un familiar puede escribir y leer el resultado, identificando sus propias aportaciones.

### Instrucciones para tu IA

```text
Haz una pregunta cada vez, a partir de un detalle que ya he contado.
Si la respuesta está clara, pasa a un tema que no hayamos tratado.
Si es corta, pregunta por una acción, lugar, persona u objeto.
Acepta fechas aproximadas; aclara el orden solo si es necesario.
No incluyas una emoción, fecha o respuesta sugerida en la pregunta.
Identifica de quién es cada versión cuando los recuerdos difieran.
Si no quiero hablar o estoy cansado, cambia de tema o descansa.
Antes de escribir, señala una o dos lagunas sin rellenarlas inventando.
```

Con personas mayores, empieza con una sesión breve y un tema. Respeta el silencio, pide permiso para grabar y lee el texto de vuelta. Un capítulo corto tiene valor; la persona decide si continúa. Consulta la [guía para otra IA](AI-HANDOFF.es.md).

<a id="architecture"></a>

## Diseño técnico

MFH convierte una entrevista en un proyecto que se puede continuar. Las respuestas originales se guardan aparte de los borradores. La persona elige qué recibe el modelo, modifica el resultado y lo revisa. Esta página describe v0.2; los [proyectos de referencia](guide.es.md#related-work) explican su posición.

### Proceso de trabajo

```text
Respuestas / textos → identificadores estables A… / M…
    → fuentes elegidas → instrucciones de la tarea
    → entrega manual O servidor API local
    → borrador editable → revisión de quien cuenta
    → copia de textos / Markdown / impresión del navegador
```

Cada idioma tiene 156 preguntas iniciales para seis tipos de relación, incluidas 48 sobre una vida. La entrevista por API pide una sola pregunta a partir de respuestas seleccionadas. No hay planificación automática de cobertura ni grafo de conocimiento.

### Fuentes que se pueden consultar

`app/core.js` define el formato `memory-for-human` v2. Respuestas, materiales y capítulos son registros separados. Los identificadores `A1`… y `M1`… se conservan al borrar otros registros, guardar copias y recuperarlas. Los materiales importados no se envían a la IA por defecto; también se pueden desmarcar respuestas.

`context()` incluye las fuentes elegidas y, para revisar, el capítulo actual. Las instrucciones piden referencias como `[A1]`. El programa conserva los identificadores y el texto original, pero no verifica las citas frase por frase. Una referencia ayuda a comprobar; no demuestra que algo sea cierto.

### Tareas independientes del modelo

`taskPrompt()` define entrevista, redacción de un capítulo, revisión y explicación sencilla. La entrega manual incluye las reglas y el idioma; la API usa las mismas reglas de tarea. El texto o JSON devuelto crea un capítulo nuevo como borrador, sin aprobar los hechos.

`server.mjs` adapta por separado OpenAI compatible y Anthropic Messages. El usuario configura servicio, modelo y dirección. Un modelo local necesita su propio servidor compatible. MFH no entrena un modelo base; cambiar de IA no borra fuentes ni capítulos.

### Revisión humana y recuperación

Cada capítulo guarda contenido, origen, fecha y estado `approved`. Empieza como borrador. La persona lo marca revisado; modificarlo lo devuelve a borrador. La revisión de IA señala detalles sin apoyo, fechas contradictorias y privacidad, pero no aprueba capítulos. El estado corresponde al capítulo, no a una cola de aprobación de cada hecho.

Las instrucciones dentro de una fuente se tratan como datos. La regla está en los prompts; no se ha realizado una evaluación completa de ataques de inyección de instrucciones.

`app/app.js` guarda varios proyectos en IndexedDB, incluida la respuesta sin enviar y el capítulo activo. `publicProject()` exporta campos permitidos sin credenciales. `validateProject()` comprueba formato, versión y tamaño. Recuperar crea una identidad nueva, conserva los identificadores de fuente y mantiene la obra anterior. Los datos demasiado grandes se rechazan, no se recortan en silencio.

La copia contiene textos, no fotos, escaneos ni grabaciones originales. El navegador no cifra estos datos. Otro navegador, dirección, puerto o modo de archivo puede tener otro espacio de guardado; descarga una copia antes de cambiar.

### Ejecución local y Key

La interfaz usa scripts clásicos, sin compilación. El archivo HTML permite escribir, editar y guardar copias. La API requiere Node.js 22+ con módulos incluidos y escucha en `127.0.0.1`. El iniciador de Windows puede descargar LTS oficial y comprobar SHA-256 antes de extraerlo.

El servidor comprueba Host, Origin y un token de sesión por ejecución. Solo sirve archivos permitidos, no la configuración privada. La Key introducida queda en memoria durante esa ejecución. Los errores del proveedor se filtran antes de mostrarse. La inferencia en línea envía los textos elegidos al servicio; consulta la [guía de privacidad](guide.es.md#usage).

### Obras largas y límites

Se escribe por capítulos con fuentes elegidas. La extensión orienta; no justifica inventar. Un JSON de materiales de más de 100.000 caracteres exige reducir o dividir. Es un límite de caracteres, no un presupuesto automático de tokens por modelo. Los resultados cortados conservan el aviso de límite de salida.

Fechas, nombres y repeticiones entre capítulos requieren coordinación humana. Resúmenes automáticos, búsqueda semántica y revisión de coherencia del libro siguen pendientes. Tampoco están implementados ASR de archivos, OCR, aprobación de hechos por varios narradores ni maquetación ilustrada.

### Archivos principales

| Archivo | Trabajo |
| --- | --- |
| `app/core.js` | Formato, validación, selección, reglas y exportación |
| `app/app.js` | Entrevista, guardado, edición, entrega e impresión |
| `app/i18n.js` | Interfaz, explicaciones y preguntas en tres idiomas |
| `server.mjs` | Autenticación local, adaptadores y errores filtrados |
| `docs/templates.md`, `docs/ai-handoff.md` | Instrucciones para familiares y otra IA |

Las pruebas cubren recuperación, selección, límites, acceso local y transporte API simulado. Las comprobaciones en un navegador real cubren escritura, idiomas, entrega, recuperación, edición e impresión. No prueban acceso real a proveedores, calidad de la entrevista ni una obra larga completa.

<a id="related-work"></a>

## Proyectos de referencia

MFH se centra en que una familia termine unas memorias con la IA que ya usa: preguntas según la relación, ayuda de familiares, selección de fuentes, capítulos editables, recuperación de textos y preparación de la obra física.

### Qué se consultó

Se leyeron documentos y algunos archivos de código el 2026-10-13. No se ejecutaron estos proyectos ni se compararon rendimiento o calidad.

| Proyecto | Dirección documentada o inspeccionada | Idea útil |
| --- | --- | --- |
| [StorySage](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/readme.md) | Agentes especializados de entrevista y escritura; implementación de memoria vectorial | Separar entrevista y escritura, y continuar desde recuerdos existentes |
| [memoir](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/README.md) | Rust/Axum, SQLite, SvelteKit; herramientas para registros y presupuesto de contexto | Una entrevista larga necesita registros duraderos y gestión del contexto |
| [Lorevox](https://github.com/lorevox-hx/lorevox) | La descripción en caché trata Archive → History → Memoir y revisión de candidatos | Separar relato original, afirmaciones y prosa; no se pudo verificar el código actual |

La página, API y petición del archivo original de Lorevox devolvieron 404 ese día. La caché no demuestra el estado actual de sus funciones.

Código consultado: [orquestador](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/agents/biography_team/orchestrator.py) y [memoria vectorial](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/content/memory_bank/memory_bank_vector_db.py) de StorySage; [herramientas](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/tools.rs) y [contexto](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/context.rs) de memoir.

### En qué trabaja MFH

La entrega manual a otra IA y la API comparten reglas de tarea y devuelven capítulos al mismo proyecto local. Los seis tipos de relación tienen 156 preguntas iniciales por idioma. Las explicaciones en chino, inglés y español ayudan a narradores y familiares sin programación. La interfaz no requiere compilación; el servicio local usa módulos incluidos en Node.js.

Identificadores estables, selección explícita, revisión que se reinicia al editar, recuperación sin sobrescribir, Markdown, impresión del navegador y pasos para libros y álbumes permiten continuar y conservar la obra. Las integraciones con álbumes y NAS no son automáticas.

Otros proyectos también preservan fuentes, usan revisión humana, guardan localmente y entrevistan con IA. La diferencia de MFH está en la combinación y el público, no en inventar esas ideas. Ahora trabaja con fuentes elegidas, tareas separadas, revisión por capítulo y límites claros; no implementa orquestación multiagente, compresión por tokens ni aprobación de candidatos biográficos.

Que una función no aparezca en lo leído no demuestra que otro proyecto carezca de ella. La facilidad de uso y las preguntas deben evaluarse con familias reales. Consulta el [diseño técnico](guide.es.md#architecture).
