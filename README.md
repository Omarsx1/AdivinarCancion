# Adivina la canción

Juego de fiesta para el after office: el host pone clips de 20 segundos desde su Mac y la sala
responde desde el celular. El audio nunca sale del navegador del host; los MP3 no se suben a ningún
servidor.

## Rutas

- `/` — landing con el selector de juego.
- `/song-host` — escenario para compartir en Teams (código de sala, QR y desarrollo de la partida).
- `/song-play` — vista del jugador: código, alias, cuatro opciones y temporizador.

El panel de administración se abre desde el escenario (botón **Administrar**) y no forma parte de la
pantalla compartida: ahí se cargan y ordenan las canciones, se ajusta el clip y se ve el QR.

## Supabase

Usa el mismo proyecto de Supabase que BreachParty. La configuración vive en `.env`
(`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`), copiada de `../BreachParty/.env`.

Solo se usan **Realtime Broadcast + Presence**: no hay tablas ni migraciones. El canal es
`breachparty-song:<código>`, separado de `breachparty:<código>` para que una partida de BreachParty
no choque con una de canciones.

## QR y celulares

El QR apunta a `/song-play?room=<código>`. Si no defines `PUBLIC_PLAY_ORIGIN`, se usa el origen del
navegador: con `localhost` el QR solo abre en la misma Mac. Para que los celulares entren, publica la
app o define el origen accesible antes de arrancar:

```dotenv
PUBLIC_PLAY_ORIGIN=https://tu-dominio.example
```

El panel de administración avisa cuando el QR todavía apunta a localhost.

## Desarrollo

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm test       # Vitest: parseo de nombres, opciones y ranking
pnpm check      # Astro + TypeScript
pnpm build
```

Requiere Node 22.23 o superior (Astro 7).

## Reglas

- 4 opciones por canción: la correcta y 3 artistas distintos, del mismo idioma, género y género musical cuando el catálogo lo permite (`src/data/songCatalog.ts`). Nunca repite al artista correcto.
- Clip de 10/15/20/25 segundos (20 por defecto), tomado de un punto aleatorio entre el 20 % y el 75 % de la canción.
- 5 segundos para responder (5/8/10).
- El orden de las canciones se baraja al empezar cada partida.
- **Desde el inicio**: reinicia el clip en 0:00 para usar intros instrumentales.
- +100 puntos por acierto. Desempate: aciertos y luego tiempo acumulado de respuesta.
- Los títulos se leen de `Artista - Título.mp3` y se pueden editar en el panel.

## Límites conocidos

- La lista de canciones vive en la pestaña del host: si se recarga, se pierde (no hay IndexedDB).
- El audio se reproduce en la pestaña del host; en Teams hay que compartir la pestaña **con audio**.
- El navegador exige un clic para reproducir: el botón **Empezar** del host lo resuelve.
