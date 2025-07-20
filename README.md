# Tower Defense - Entorno de Desarrollo Unificado

Este proyecto contiene un juego Tower Defense completo, incluyendo el cliente (frontend), el servidor (backend) y un conjunto de microservicios para la integración con TikTok.

## Arquitectura de Servicios

El entorno de desarrollo se compone de 5 servicios principales:

1.  **Servidor del Juego (`server`):** El backend principal del juego, maneja la lógica, el estado y la comunicación con los clientes.
2.  **Cliente del Juego (`client`):** La interfaz de usuario del juego, construida con React.
3.  **Cerebro Central (`tiktok-services/central-brain`):** Un servicio de orquestación que recibe eventos de los listeners de TikTok y los reenvía al servidor del juego. También puede dar órdenes a los listeners.
4.  **Listener de Node.js (`tiktok-services/nodejs-listener`):** Un microservicio que se conecta a TikTok LIVE para escuchar eventos.
5.  **Listener de Python (`tiktok-services/python-listener`):** Un segundo microservicio que también se conecta a TikTok LIVE, proporcionando redundancia o diferentes capacidades.

## Cómo Iniciar el Entorno de Desarrollo

Gracias al uso de `concurrently`, todo el entorno de desarrollo se puede iniciar con un único comando desde el directorio raíz del proyecto.

### Prerrequisitos

- Node.js instalado.
- Python instalado (para el listener de Python).
- Instalar las dependencias de todos los servicios. Puedes hacerlo ejecutando `npm install` en los directorios `client`, `server`, `tiktok-services/central-brain`, `tiktok-services/nodejs-listener` y `pip install -r requirements.txt` en `tiktok-services/python-listener`. (Nota: Este paso solo es necesario una vez).

### Iniciar Todos los Servicios

Para iniciar el cliente, el servidor y todos los microservicios de TikTok en una sola terminal, ejecuta:

```bash
npm run start:dev
```

Este comando hará lo siguiente:
- Lanzará los 5 servicios en paralelo.
- Asignará un color y un prefijo a la salida de cada servicio para que puedas monitorear fácilmente lo que está sucediendo en cada uno.

### Detener Todos los Servicios

Para detener todos los procesos, simplemente presiona `Ctrl + C` en la terminal donde se está ejecutando `concurrently`.