# Node.js TikTok Listener - Plan de Prueba

Este documento describe cómo probar la conexión entre el listener de Node.js y el Cerebro Central.

## Requisitos

- Tener dos terminales o consolas abiertas.
- Haber instalado las dependencias de Node.js: `npm install`

## Pasos para la Prueba

1.  **Terminal 1: Iniciar el Listener de Node.js**
    -   Navega al directorio del listener:
        ```bash
        cd tiktok-services/nodejs-listener
        ```
    -   Ejecuta el listener:
        ```bash
        node main.js
        ```
    -   Deberías ver un mensaje indicando que el servidor está escuchando en un puerto (ej. 5002).

2.  **Terminal 2: Ejecutar el Script de Prueba**
    -   En la segunda terminal, navega al mismo directorio:
        ```bash
        cd tiktok-services/nodejs-listener
        ```
    -   Ejecuta el script de prueba para iniciar la conexión:
        ```bash
        node test_connection.js
        ```

## Resultados Esperados

-   **Terminal 1 (Listener):** Verás logs indicando una nueva conexión con TikTok.
-   **Terminal 2 (Script de Prueba):** Verás una respuesta del servidor del listener confirmando la solicitud.
-   **Terminal del Cerebro Central:** Deberías empezar a ver los eventos reenviados por el listener, con el `source` "nodejs-listener".