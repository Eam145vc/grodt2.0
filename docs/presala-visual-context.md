# Contexto para el Desarrollo del Componente Visual de la Presala

## Resumen del Proyecto

Este documento proporciona todo el contexto técnico necesario para que un LLM de diseño desarrolle un componente de React utilizando Tailwind CSS para la "presala" de un juego interactivo. La presala es una pantalla donde los espectadores de un stream de TikTok eligen un país y compiten para clasificar a un evento principal sumando puntos a través de likes y regalos.

## Arquitectura General

El sistema sigue una arquitectura cliente-servidor en tiempo real.

-   **Backend (Node.js + Socket.IO):** Mantiene el estado completo del juego, incluyendo la presala. Procesa eventos de TikTok (likes, regalos), actualiza el estado y lo transmite a todos los clientes conectados.
-   **Frontend (React):** Actúa como un cliente "tonto". Recibe el estado completo del juego del servidor a intervalos regulares y renderiza la interfaz de usuario basándose en esa información. No contiene lógica de negocio para calcular puntos o manejar el estado.

## Flujo de Datos y Estado

1.  **Conexión:** El cliente se conecta al servidor de Socket.IO.
2.  **Sincronización de Estado:** El servidor emite un evento `gameState` cada 100ms. Este evento contiene el objeto completo y actualizado del estado del juego.
3.  **Recepción en el Cliente:** Un hook de React (`useSocket`) recibe este objeto `gameState` y lo pone a disposición de los componentes.
4.  **Renderizado:** El componente de la presala consume el objeto `gameState` y renderiza la información.

## Lógica de Puntuación (Especificación para Backend)

**Nota:** La siguiente lógica es una especificación de cómo el backend **debería** procesar los eventos de TikTok para la presala. Aunque esta lógica aún no está completamente implementada, el frontend debe diseñarse asumiendo que el `gameState` reflejará estos cálculos.

1.  **Recepción de Eventos:** El servidor recibe eventos de `like` y `gift` desde el "Cerebro Central" de TikTok. Cada evento está asociado a un `userId`.
2.  **Identificación del Equipo:** El servidor utiliza el `userId` para buscar a qué equipo pertenece el usuario en el objeto `gameState.presala.userTeam`.
3.  **Cálculo de Puntos:**
    *   **Por cada `like`:** El equipo del usuario recibe **1 punto** (`POINTS_PER_LIKE`).
    *   **Por cada moneda de regalo (`gift`):** El equipo del usuario recibe **2 puntos** (`POINTS_PER_COIN`). El valor del regalo en monedas se multiplica por esta constante.
4.  **Actualización de Estado:** Los puntos calculados se suman al `points` del equipo correspondiente en `gameState.presala.teams`.
5.  **Transmisión:** El `gameState` actualizado se transmite a todos los clientes, y el componente visual se renderiza de nuevo con los nuevos puntajes.

### El Objeto `gameState`

El componente visual recibirá un objeto `gameState` con la siguiente estructura (la parte relevante es `presala`):

```json
{
  "presala": {
    "teams": {
      "colombia": {
        "points": 520,
        "members": ["user123", "user456"]
      },
      "mexico": {
        "points": 810,
        "members": ["user789"]
      }
    },
    "userTeam": {
      "user123": "colombia",
      "user456": "colombia",
      "user789": "mexico"
    }
  }
}
```

**Descripción de las propiedades de `presala`:**

-   `teams`: Un objeto donde cada clave es el nombre de un país (en minúsculas). El valor es un objeto con:
    -   `points`: El puntaje actual del equipo.
    -   `members`: Un array (en el backend es un Set) de los IDs de los usuarios en ese equipo.
-   `userTeam`: Un objeto que mapea el ID de un usuario al equipo al que pertenece.

## Requisitos del Componente Visual

El componente de React a desarrollar debe cumplir con los siguientes requisitos:

### 1. Selección de Equipo

-   Debe mostrar la lista de países disponibles para unirse. Esta lista está definida en el backend, pero para el frontend, se puede usar la siguiente lista estática:
    `['argentina', 'bolivia', 'chile', 'colombia', 'costa rica', 'cuba', 'ecuador', 'el salvador', 'guatemala', 'honduras', 'mexico', 'nicaragua', 'panama', 'paraguay', 'peru', 'puerto rico', 'republica dominicana', 'uruguay', 'venezuela']`
-   Debe haber un campo de entrada (`<input>`) y un botón (`<button>`) para que el usuario ingrese su ID de TikTok y seleccione un país.
-   Al hacer clic en el botón "Unirse", el componente debe emitir un evento de socket `join-team`.

**Ejemplo de cómo emitir el evento:**

El hook `useSocket` deberá ser modificado para exponer una función `joinTeam`.

```javascript
// Dentro de useSocket.js
const joinTeam = (userId, teamName) => {
  if (socketRef.current && isConnected) {
    socketRef.current.emit('join-team', { userId, teamName });
  }
};

// En el componente de la presala
const { joinTeam } = useSocket();

const handleJoin = () => {
  // userId y teamName se obtienen de los inputs del formulario
  joinTeam(userId, teamName);
};
```

### 2. Visualización de la Competición

-   El componente debe mostrar una tabla o una lista de todos los equipos (`gameState.presala.teams`).
-   Para cada equipo, debe mostrar:
    -   La bandera del país (se pueden usar emojis o buscar una librería de banderas).
    -   El nombre del país.
    -   Una barra de progreso que represente el avance hacia la meta de clasificación.
-   La barra de progreso debe calcularse de la siguiente manera: `(puntos_actuales / PUNTOS_PARA_CLASIFICAR) * 100`.
-   La meta de clasificación (`POINTS_TO_QUALIFY`) es de **1000 puntos**.
-   La barra de progreso debe actualizarse en tiempo real a medida que el `gameState` cambia.
-   Los equipos deben estar ordenados de mayor a menor puntaje.

### 3. Estilo y Diseño

-   Utilizar **Tailwind CSS** para todos los estilos.
-   El diseño debe ser limpio, moderno y atractivo, con una temática de "competición" o "versus".
-   Debe ser responsivo y verse bien en dispositivos móviles y de escritorio.

## Resumen para el LLM de Diseño

**Tu tarea es:**

1.  Crear un nuevo componente de React llamado `Presala.js`.
2.  Este componente utilizará el hook `useSocket` para acceder al `gameState`.
3.  Implementar un formulario para que los usuarios se unan a un equipo, emitiendo el evento `join-team`.
4.  Mostrar una lista de todos los equipos con su puntaje y una barra de progreso hacia los 1000 puntos.
5.  Ordenar la lista por puntaje de forma descendente.
6.  Estilizar todo con Tailwind CSS.
7.  **No implementes lógica de cálculo de puntos.** Solo consume y muestra los datos del `gameState`.

Este contexto debería ser suficiente para que puedas proceder con el diseño y la maquetación del componente.