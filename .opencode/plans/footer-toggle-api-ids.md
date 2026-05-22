# Plan: Toggle de API IDs en el footer (oculto)

## Archivo a modificar
`src/layout/Footer.tsx`

## Código final

```tsx
import { useTheme, useThemeClasses } from '../functions/themeStore';

export default function Footer() {
  const { bgApp, border, textMuted } = useThemeClasses();
  const { showApiIds, setShowApiIds } = useTheme();

  return (
    <footer className={`${bgApp} border-t ${border} py-4 px-6 mt-auto flex items-center justify-center group`}>
      <button
        onClick={() => setShowApiIds(!showApiIds)}
        className="group-hover:opacity-40 opacity-0 text-[9px] transition-opacity cursor-pointer"
        title="Toggle API IDs"
      >
        {showApiIds ? 'IDs: ON' : '⚙'}
      </button>
    </footer>
  );
}
```

## Comportamiento
- **Invisible** (opacity-0) por defecto
- Aparece sutilmente (opacity-40) solo al hacer hover sobre el footer
- Muestra "IDs: ON" cuando está activo, "⚙" cuando está oculto
- Usa el mismo `showApiIds` de `themeStore` que el `ControlPanel` — ambos se sincronizan
