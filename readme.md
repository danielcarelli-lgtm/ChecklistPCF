Markdown
# Checklist Card PCF Control

Este repositorio contiene un componente personalizado (PCF - Power Apps Component Framework) de tipo `standard` diseñado para Dynamics 365 y Power Apps. 

El componente **Checklist Card** transforma un conjunto de campos estándar (un campo numérico, varios conjuntos de opciones y un campo de texto multilínea) en una tarjeta interactiva, responsiva y altamente optimizada para dispositivos móviles (uso táctil).

## 🚀 Características Principales

* **Diseño Táctil (Mobile-First):** Se han eliminado los controles de menú desplegable (`<select>`) tradicionales. En su lugar, los valores de los *OptionSets* se muestran como botones de un solo clic que cambian de estilo dinámicamente al ser seleccionados.
* **Control Numérico Avanzado:** El campo de cantidad incluye botones grandes de `+` y `-` optimizados para dedos. Incluye soporte para **pulsación prolongada (Long Press)**: al mantener presionado el botón, el valor suma o resta de forma rápida y continua respetando los límites máximos y mínimos definidos en Dataverse.
* **Interfaz Fluida (Responsive):** Desarrollado con CSS Flexbox. Los campos se agrupan de forma inteligente; si hay espacio en la pantalla, se alinean en la misma fila (por ejemplo, "Funcionamiento" y "Limpieza" comparten renglón), aprovechando al máximo el espacio visual.
* **Indicador de Completitud en Tiempo Real:** Junto al título de la tarjeta, un icono dinámico evalúa instantáneamente si todos los campos requeridos tienen valor, mostrando un estado de ⏳ **Incompleto** o ✅ **Completo**.
* **Ultra Ligero:** No utiliza librerías externas de diseño (como Fluent UI o React). Todo está construido con manipulación directa del DOM mediante TypeScript estándar y CSS en línea, asegurando un rendimiento y tiempo de carga óptimos.

## 📦 Variables y Propiedades (Manifiesto)

El componente está preparado para recibir los siguientes parámetros desde Dataverse/Power Apps:

### Campos Vinculados (Bound)
Estos campos guardan la información directamente en la base de datos:
* `boundValue` *(Número Entero)*: Valor principal de cantidad.
* `val_funcionamiento` *(OptionSet)*: Selección de estado de funcionamiento.
* `val_limpieza` *(OptionSet)*: Selección de estado de limpieza.
* `val_status` *(OptionSet)*: Estatus general del registro.
* `val_chequeo_fecha` *(OptionSet)*: Validación o estatus de fecha/hora.
* `val_tiempo` *(Varias líneas de texto)*: Notas o tiempos registrados.

### Etiquetas Personalizables (Input)
Permiten sobrescribir el texto a mostrar en la tarjeta. Si no se configuran, usan los siguientes valores por defecto:
* `label_boundValue`: "Cantidad"
* `label_funcionamiento`: "En funcionamiento"
* `label_limpieza`: "Limpieza"
* `label_chequeo_fecha`: "Chequeo fecha/hora"
* `label_status`: "Estatus grabación"
* `label_tiempo`: "Tiempo grabación"
* `titulo_tarjeta`: Título principal de la tarjeta.