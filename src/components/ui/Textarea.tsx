import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  containerClassName = '',
  className = '',
  ...props
}, ref) => {
  const { border, textMain, textMuted, textAccent } = useThemeClasses();
  const defaultId = useId();
  const textareaId = props.id || defaultId;

  // Derivar variables dinámicas basadas en el tema actual
  const focusRing = textAccent.replace('text-', 'ring-');
  const focusBorder = textAccent.replace('text-', 'border-');

  return (
    <div className={`flex flex-col rounded-xl border ${border} focus-within:${focusBorder} px-4 py-3 transition-all focus-within:ring-1 focus-within:${focusRing}/20 ${containerClassName}`}>
      <textarea
        ref={ref}
        id={textareaId}
        className={`bg-transparent border-none outline-none ${textMain} w-full text-sm placeholder:${textMuted} resize-none ${className}`}
        {...props}
      />
    </div>
  );
});

Textarea.displayName = 'Textarea';
