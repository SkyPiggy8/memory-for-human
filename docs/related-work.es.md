# Proyectos de referencia y decisiones de MFH

[简体中文](related-work.md) · [English](related-work.en.md) · [Español](related-work.es.md)

MFH se centra en que una familia termine unas memorias con la IA que ya usa: preguntas según la relación, ayuda de familiares, selección de fuentes, capítulos editables, recuperación de textos y preparación de la obra física.

## Qué se consultó

Se leyeron documentos y algunos archivos de código el 2026-10-13. No se ejecutaron estos proyectos ni se compararon rendimiento o calidad.

| Proyecto | Dirección documentada o inspeccionada | Idea útil |
| --- | --- | --- |
| [StorySage](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/readme.md) | Agentes especializados de entrevista y escritura; implementación de memoria vectorial | Separar entrevista y escritura, y continuar desde recuerdos existentes |
| [memoir](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/README.md) | Rust/Axum, SQLite, SvelteKit; herramientas para registros y presupuesto de contexto | Una entrevista larga necesita registros duraderos y gestión del contexto |
| [Lorevox](https://github.com/lorevox-hx/lorevox) | La descripción en caché trata Archive → History → Memoir y revisión de candidatos | Separar relato original, afirmaciones y prosa; no se pudo verificar el código actual |

La página, API y petición del archivo original de Lorevox devolvieron 404 ese día. La caché no demuestra el estado actual de sus funciones.

Código consultado: [orquestador](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/agents/biography_team/orchestrator.py) y [memoria vectorial](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/content/memory_bank/memory_bank_vector_db.py) de StorySage; [herramientas](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/tools.rs) y [contexto](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/context.rs) de memoir.

## En qué trabaja MFH

La entrega manual a otra IA y la API comparten reglas de tarea y devuelven capítulos al mismo proyecto local. Los seis tipos de relación tienen 156 preguntas iniciales por idioma. Las explicaciones en chino, inglés y español ayudan a narradores y familiares sin programación. La interfaz no requiere compilación; el servicio local usa módulos incluidos en Node.js.

Identificadores estables, selección explícita, revisión que se reinicia al editar, recuperación sin sobrescribir, Markdown, impresión del navegador y pasos para libros y álbumes permiten continuar y conservar la obra. Las integraciones con álbumes y NAS no son automáticas.

Otros proyectos también preservan fuentes, usan revisión humana, guardan localmente y entrevistan con IA. La diferencia de MFH está en la combinación y el público, no en inventar esas ideas. Ahora trabaja con fuentes elegidas, tareas separadas, revisión por capítulo y límites claros; no implementa orquestación multiagente, compresión por tokens ni aprobación de candidatos biográficos.

Que una función no aparezca en lo leído no demuestra que otro proyecto carezca de ella. La facilidad de uso y las preguntas deben evaluarse con familias reales. Consulta el [diseño técnico](architecture.es.md).
