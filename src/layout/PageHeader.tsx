import { useEffect, useState } from 'react';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  tournament_banner_url?: string | null;
  logo?: string | null;
}

export default function PageHeader({ 
  title = "Competición", 
  subtitle = "Explora los resultados, posiciones y detalles actualizados de este torneo.",
  tournament_banner_url,
  logo
}: PageHeaderProps) {
  const defaultBanner = "https://cdn.pixabay.com/photo/2024/10/09/23/52/ai-generated-9109556_640.jpg";
  const [imgSrc, setImgSrc] = useState(tournament_banner_url || defaultBanner);

  // Sincronizar imgSrc cuando cambie el prop
  useEffect(() => {
    setImgSrc(tournament_banner_url || defaultBanner);
  }, [tournament_banner_url]);

  return (
    <div className="relative w-full h-72 md:h-96 overflow-hidden group bg-zinc-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={imgSrc} 
          alt="Banner background" 
          onError={() => setImgSrc(defaultBanner)}
          className="w-full h-full object-cover transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-10 md:px-16 max-w-3xl">
        {logo && (
          <img 
            src={logo} 
            alt="Tournament Logo" 
            className="w-24 h-24 md:w-32 md:h-32 object-contain mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-fade-in"
          />
        )}
        
        <h2 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-xl">
          {title}
        </h2>
        
        <p className="text-sm md:text-lg text-zinc-300 font-medium leading-relaxed opacity-90 max-w-xl">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
