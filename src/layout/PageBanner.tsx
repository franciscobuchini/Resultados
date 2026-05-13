import { useEffect, useState } from 'react';
import { useThemeClasses } from '../functions/themeStore';

interface PageBannerProps {
  title?: string;
  subtitle?: string;
  tournament_banner_url?: string | null;
  logo?: string | null;
}

export default function PageBanner({
  title = "",
  tournament_banner_url,
  logo
}: PageBannerProps) {
  const { textMain } = useThemeClasses();
  const defaultBanner = "https://cdn.pixabay.com/photo/2024/10/09/23/52/ai-generated-9109556_640.jpg";
  const [imgSrc, setImgSrc] = useState(tournament_banner_url || defaultBanner);

  // Sincronizar imgSrc cuando cambie el prop
  useEffect(() => {
    setImgSrc(tournament_banner_url || defaultBanner);
  }, [tournament_banner_url]);

  return (
    <div className="relative w-full h-80 md:h-120 overflow-hidden group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={imgSrc}
          alt="Banner background"
          loading="lazy"
          onError={() => setImgSrc(defaultBanner)}
          className="w-full h-full object-cover transition-transform duration-1000"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, transparent 10%, black 100%)',
            maskImage: 'linear-gradient(to top, transparent 15%, black 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end pb-4 px-6">
        <div className="flex items-center gap-3">
          {logo && (
            <img
              src={logo}
              alt="Tournament Logo"
              loading="lazy"
              className="w-24 h-24 md:w-32 md:h-32 object-contain"
            />
          )}

          <h2 className={`text-3xl md:text-5xl font-black ${textMain} uppercase tracking-tighter`}>
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}
