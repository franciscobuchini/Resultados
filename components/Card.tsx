import { ReactNode } from "react";

/* ===== STYLE CLASSES ===== */

/* ===== TYPES ===== */
type CardProps = {
  children?: ReactNode;
  title?: string;
  logoUrl?: string;
  optionsButton?: ReactNode;
  content?: ReactNode;
};

type CardHeaderProps = {
  title: string;
  logoUrl?: string;
  optionsButton?: ReactNode;
};

type CardContentProps = {
  children: ReactNode;
};

/* ===== CARD ===== */
export function Card({ children, title, logoUrl, optionsButton, content }: CardProps) {
  return (
    <div className="bg-emerald-600 rounded-lg p-4 w-full">
      {title && (
        <Card.Header title={title} logoUrl={logoUrl} optionsButton={optionsButton} />
      )}
      {content && <Card.Content>{content}</Card.Content>}
      {children}
    </div>
  );
}

/* ===== SUBCOMPONENTS ===== */
Card.Header = function CardHeader({ title, logoUrl, optionsButton }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt={title} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 bg-gray-300 rounded-sm flex-shrink-0" />
        )}
        <span className="font-semibold">{title}</span>
      </div>
      {optionsButton && <div>{optionsButton}</div>}
    </div>
  );
};

Card.Content = function CardContent({ children }: CardContentProps) {
  return <div className="flex flex-col gap-2">{children}</div>;
};