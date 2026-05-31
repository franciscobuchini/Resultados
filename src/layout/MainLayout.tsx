import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';
import { useThemeClasses } from '../functions/themeStore';
import Scrollbar from './Scrollbar';
import ProfileCTA from '../components/ui/ProfileCTA';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { bgApp, textMain, bgMain } = useThemeClasses();

  return (
    <div className={`min-h-screen ${bgApp} ${textMain} flex flex-col font-sans`}>
      <Scrollbar />
      {/* Header Fijo */}
      <Header />

      <div className="flex flex-1 pt-16"> {/* Compensar el header fijo */}
        {/* Sidebar Izquierda (Opcional según dispositivo) */}
        <SidebarLeft />

        {/* Parte Central del Sitio */}
        <main className={`flex-1 min-w-0 ${bgMain} flex flex-col overflow-x-hidden`}>
          <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
            <ProfileCTA />
            {children}
          </div>
        </main>

        {/* Sidebar Derecha (Opcional según dispositivo) */}
        <SidebarRight />
      </div>

      {/* Footer al final */}
      <Footer />
    </div>
  );
}
