# Experimento: animaciones fluidas

Rama de trabajo: `experiment/animaciones-fluidas`.

## Qué cambia

- `motion.js` centraliza microinteracciones para botones, pestañas, conjuros,
  inventario y campos editables.
- La niebla de navegación incorpora un barrido de luz y una viñeta efímera;
  el nuevo panel entra en dos capas (cabecera y contenido) para dar continuidad
  cinematográfica sin cambiar la composición original.
- Usa GSAP cuando la versión ya cargada por la aplicación está disponible y
  Web Animations API como respaldo, sin añadir dependencias pesadas.
- La entrada cinematográfica del contenido solo se activa mientras la niebla
  de navegación está activa. Las actualizaciones de vida, estadísticas,
  conjuros o mochila no vuelven a animar toda la pantalla.
- Se preservan y mantienen acotados al retrato los efectos existentes de daño,
  curación, PG temporales, vida crítica y estado «Caído».
- Curación y PG temporales añaden un glow localizado y una ráfaga breve de
  partículas verdes o azules, respectivamente, siguiendo la herradura de PG.
- En Combate, los conjuros preparados se integran en el panel de espacios de
  conjuro y se elimina el contador de asaltos de la interfaz.
- `prefers-reduced-motion` desactiva los movimientos adicionales.
- El service worker cachea `motion.js` y actualiza su versión de caché para que
  el experimento siga disponible sin conexión tras la primera carga.

## Prueba local

Desde esta carpeta:

```powershell
python -m http.server 4173
```

Abre `http://localhost:4173`. Para comprobar la variante reducida, activa
«Reducir movimiento» en las preferencias de accesibilidad del sistema o en las
herramientas de desarrollo del navegador.

## Controles de calidad realizados

- `node --check motion.js`
- `node --check sw.js`
- `git diff --check`
- Verificación de inclusión de `motion.js` en HTML y precaché del service worker.

La automatización de navegador de este entorno no expone el localhost del
proceso de prueba, por lo que queda pendiente la pasada visual interactiva en
un navegador que comparta el mismo host.
