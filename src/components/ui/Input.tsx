import { forwardRef, useId, type ElementType, type InputHTMLAttributes, type ReactNode } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ElementType;
  customIcon?: ReactNode;
  containerClassName?: string;
  variant?: 'default' | 'raw';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  icon: Icon,
  customIcon,
  containerClassName = '',
  className = '',
  variant = 'default',
  ...props
}, ref) => {
  const { border, textMain, textMuted, textAccent } = useThemeClasses();
  const defaultId = useId();
  const inputId = props.id || defaultId;

  // Derivar variables dinámicas basadas en el tema actual
  const colorVar = textMain.replace('text-', '--color-');
  const escapedId = inputId.replace(/:/g, '\\:');

  const autofillStyles = (
    <style>{`
      #${escapedId}:-webkit-autofill,
      #${escapedId}:-webkit-autofill:hover, 
      #${escapedId}:-webkit-autofill:focus, 
      #${escapedId}:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
        -webkit-text-fill-color: var(${colorVar}) !important;
        transition: background-color 5000000s ease-in-out 0s;
        caret-color: currentColor;
      }
      #${escapedId}:autofill {
        background-color: transparent !important;
      }
    `}</style>
  );

  if (variant === 'raw') {
    return (
      <>
        {autofillStyles}
        <input
          ref={ref}
          id={inputId}
          className={`bg-transparent border-none outline-none ${textMain} w-full placeholder:${textMuted} ${className}`}
          {...props}
        />
      </>
    );
  }

  // Derivar colores dinámicos de enfoque basados en el tema
  const focusRing = textAccent.replace('text-', 'ring-');
  const focusBorder = textAccent.replace('text-', 'border-');

  return (
    <>
      {autofillStyles}
      <div className={`flex items-center gap-3 rounded-xl border ${border} focus-within:${focusBorder} px-4 py-3 transition-all focus-within:ring-1 focus-within:${focusRing}/20 ${containerClassName}`}>
        {customIcon ? (
          <div className="shrink-0 flex items-center justify-center">
            {customIcon}
          </div>
        ) : Icon ? (
          <Icon size={18} className={textMuted} />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`bg-transparent border-none outline-none ${textMain} w-full text-sm placeholder:${textMuted} ${className}`}
          {...props}
        />
      </div>
    </>
  );
});

Input.displayName = 'Input';
