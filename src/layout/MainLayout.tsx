import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-zinc-100">
      {/* Header Fijo */}
      <Header />

      <div className="flex flex-1 pt-16"> {/* Compensar el header fijo */}
        {/* Sidebar Izquierda (Opcional según dispositivo) */}
        <SidebarLeft />

        {/* Parte Central del Sitio */}
        <main className="flex-1 min-w-0 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto">
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
