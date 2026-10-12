# Diseño técnico: fuentes, modelos y capítulos revisados

[简体中文](architecture.md) · [English](architecture.en.md) · [Español](architecture.es.md)

MFH convierte una entrevista en un proyecto que se puede continuar. Las respuestas originales se guardan aparte de los borradores. La persona elige qué recibe el modelo, modifica el resultado y lo revisa. Esta página describe v0.2; los [proyectos de referencia](related-work.es.md) explican su posición.

## Proceso de trabajo

```text
Respuestas / textos → identificadores estables A… / M…
    → fuentes elegidas → instrucciones de la tarea
    → entrega manual O servidor API local
    → borrador editable → revisión de quien cuenta
    → copia de textos / Markdown / impresión del navegador
```

Cada idioma tiene 156 preguntas iniciales para seis tipos de relación, incluidas 48 sobre una vida. La entrevista por API pide una sola pregunta a partir de respuestas seleccionadas. No hay planificación automática de cobertura ni grafo de conocimiento.

## Fuentes que se pueden consultar

`app/core.js` define el formato `memory-for-human` v2. Respuestas, materiales y capítulos son registros separados. Los identificadores `A1`… y `M1`… se conservan al borrar otros registros, guardar copias y recuperarlas. Los materiales importados no se envían a la IA por defecto; también se pueden desmarcar respuestas.

`context()` incluye las fuentes elegidas y, para revisar, el capítulo actual. Las instrucciones piden referencias como `[A1]`. El programa conserva los identificadores y el texto original, pero no verifica las citas frase por frase. Una referencia ayuda a comprobar; no demuestra que algo sea cierto.

## Tareas independientes del modelo

`taskPrompt()` define entrevista, redacción de un capítulo, revisión y explicación sencilla. La entrega manual incluye las reglas y el idioma; la API usa las mismas reglas de tarea. El texto o JSON devuelto crea un capítulo nuevo como borrador, sin aprobar los hechos.

`server.mjs` adapta por separado OpenAI compatible y Anthropic Messages. El usuario configura servicio, modelo y dirección. Un modelo local necesita su propio servidor compatible. MFH no entrena un modelo base; cambiar de IA no borra fuentes ni capítulos.

## Revisión humana y recuperación

Cada capítulo guarda contenido, origen, fecha y estado `approved`. Empieza como borrador. La persona lo marca revisado; modificarlo lo devuelve a borrador. La revisión de IA señala detalles sin apoyo, fechas contradictorias y privacidad, pero no aprueba capítulos. El estado corresponde al capítulo, no a una cola de aprobación de cada hecho.

Las instrucciones dentro de una fuente se tratan como datos. La regla está en los prompts; no se ha realizado una evaluación completa de ataques de inyección de instrucciones.

`app/app.js` guarda varios proyectos en IndexedDB, incluida la respuesta sin enviar y el capítulo activo. `publicProject()` exporta campos permitidos sin credenciales. `validateProject()` comprueba formato, versión y tamaño. Recuperar crea una identidad nueva, conserva los identificadores de fuente y mantiene la obra anterior. Los datos demasiado grandes se rechazan, no se recortan en silencio.

La copia contiene textos, no fotos, escaneos ni grabaciones originales. El navegador no cifra estos datos. Otro navegador, dirección, puerto o modo de archivo puede tener otro espacio de guardado; descarga una copia antes de cambiar.

## Ejecución local y Key

La interfaz usa scripts clásicos, sin compilación. El archivo HTML permite escribir, editar y guardar copias. La API requiere Node.js 22+ con módulos incluidos y escucha en `127.0.0.1`. El iniciador de Windows puede descargar LTS oficial y comprobar SHA-256 antes de extraerlo.

El servidor comprueba Host, Origin y un token de sesión por ejecución. Solo sirve archivos permitidos, no la configuración privada. La Key introducida queda en memoria durante esa ejecución. Los errores del proveedor se filtran antes de mostrarse. La inferencia en línea envía los textos elegidos al servicio; consulta la [guía de privacidad](guide.es.md).

## Obras largas y límites

Se escribe por capítulos con fuentes elegidas. La extensión orienta; no justifica inventar. Un JSON de materiales de más de 100.000 caracteres exige reducir o dividir. Es un límite de caracteres, no un presupuesto automático de tokens por modelo. Los resultados cortados conservan el aviso de límite de salida.

Fechas, nombres y repeticiones entre capítulos requieren coordinación humana. Resúmenes automáticos, búsqueda semántica y revisión de coherencia del libro siguen pendientes. Tampoco están implementados ASR de archivos, OCR, aprobación de hechos por varios narradores ni maquetación ilustrada.

## Archivos principales

| Archivo | Trabajo |
| --- | --- |
| `app/core.js` | Formato, validación, selección, reglas y exportación |
| `app/app.js` | Entrevista, guardado, edición, entrega e impresión |
| `app/i18n.js` | Interfaz, explicaciones y preguntas en tres idiomas |
| `server.mjs` | Autenticación local, adaptadores y errores filtrados |
| `templates/`, `prompts/` | Instrucciones para familiares y otra IA |

Las pruebas cubren recuperación, selección, límites, acceso local y transporte API simulado. Las comprobaciones en un navegador real cubren escritura, idiomas, entrega, recuperación, edición e impresión. No prueban acceso real a proveedores, calidad de la entrevista ni una obra larga completa.
