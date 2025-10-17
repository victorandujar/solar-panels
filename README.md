This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# Solar Panels - Concepto de Prueba

## Características

- 🎨 Visualización 3D interactiva de placas solares
- ✏️ Modo de edición con controles precisos
- 📊 Estadísticas en tiempo real de paneles
- 🛣️ Gestión de viales y zanjas
- 🌐 Soporte multiidioma (ES/EN)

## 🖱️ Controles Mejorados en Modo Edición

Cuando activas el modo edición ("Editar layout"), tienes disponibles tres controles intuitivos con el ratón:

### 1. **Botón Izquierdo del Ratón** 🖱️

- **Acción**: Selecciona y mueve placas solares
- **Características**:
  - Arrastrar para mover la placa seleccionada
  - Snap automático magnético a filas y columnas existentes
  - Precisión sub-milimétrica (redondeado a 8 decimales)
  - Alineación automática con paneles adyacentes

### 2. **Botón Derecho del Ratón** ↔️

- **Acción**: Desplaza la cámara libremente en X e Y
- **Características**:
  - Movimiento suave de la vista
  - Mantén presionado y arrastra para desplazar
  - Ideal para explorar diferentes áreas de la planta solar

### 3. **Rueda del Ratón** 🔍

- **Acción**: Zoom in (acercar) y zoom out (alejar)
- **Características**:
  - Scroll hacia arriba = Alejar
  - Scroll hacia arriba = Acercar
  - Zoom suave y controlado
  - Respeta los límites de distancia máxima y mínima

## Mejoras Implementadas

### 1. **Snap Magnético Inteligente**

El sistema detecta automáticamente:

- **Filas existentes**: Se alinea la placa a las mismas filas donde hay otros paneles
- **Columnas con espaciado uniforme**: Calcula el espaciado entre paneles y coloca la nueva placa en la posición más lógica
- **Extensiones automáticas**: Permite crear nuevas columnas al lado de las existentes

### 2. **Controles del Ratón Independientes**

- Cada botón del ratón tiene una función específica
- Los controles no interfieren entre sí
- Transiciones suaves entre modos

### 3. **Vista Optimizada en Modo Edición**

- Cambia automáticamente a vista superior (topographic view)
- Mejor visualización para precisión de colocación
- Restaura la vista anterior al desactivar modo edición

## Cómo Usar

1. **Activar Modo Edición**

   - Haz clic en "Editar layout"

2. **Seleccionar Placas**

   - Haz clic izquierdo en una placa para seleccionarla
   - Mantén Ctrl/Cmd y haz clic para selección múltiple

3. **Mover Placas**

   - Botón izquierdo: Arrastra la placa a la nueva posición
   - Al soltar, se aplica automáticamente el snap magnético

4. **Explorar la Vista**

   - Botón derecho: Arrastra para mover la cámara
   - Rueda del ratón: Zoom in/out

5. **Desactivar Modo Edición**
   - Haz clic en "Desactivar edición"

## ⚙️ Ajustar Precisión del Snap Magnético

Si necesitas ajustar el equilibrio del snap, edita estos parámetros en `SolarPanelWithTransform.tsx`:

```typescript
// Línea 70: Radio de snap
const snapRadius = dimensions.length * 0.4; // Solo 40%

// 0.4 = SUTIL (snap solo cuando estás MUY cerca)
// 0.6 = Más tolerante
// 0.3 = Muy estricto
```

### Cómo funciona (SIMPLE Y EFECTIVO):

1. **Durante el Drag** 🖱️:

   - Movimiento **100% fluido** sin snap
   - La placa sigue tu cursor con raycasting al plano del terreno
   - Sin lag, sin saltos, sin bloqueos
   - Control total del usuario

2. **Al Soltar** ✨:

   - **SOLO entonces** se activa el snap
   - Busca el panel más cercano (distancia 2D)
   - Si estás REALMENTE cerca (40% del tamaño) → Copia X, Y, Z exactos
   - Si no estás cerca → La placa se queda donde la soltaste

3. **Puntos Verdes**:
   - Solo muestran donde están los paneles existentes
   - Sin puntos duplicados
   - Sin puntos generados dinámicamente
   - Visual simple y limpio
