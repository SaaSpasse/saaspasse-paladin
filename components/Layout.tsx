
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-paladin-cream">
      <header className="relative z-50 mb-6 text-center max-w-2xl w-full flex flex-col items-center py-2 transition-all">
        {/* Avatar Médaillon - Dessin SVG du SaaSpaladin - Taille Réduite */}
        <div className="w-20 h-20 rounded-full border-4 border-paladin-dark bg-paladin-purple overflow-hidden shadow-[4px_4px_0px_0px_rgba(7,10,38,1)] z-10 -mb-8 relative group flex items-center justify-center">
           <svg viewBox="0 0 100 100" className="w-full h-full transition-transform duration-500 group-hover:scale-110">
             {/* Fond Violet */}
             <rect width="100" height="100" fill="#853DFF" />
             
             {/* Cape / Épaules */}
             <path d="M10 100 Q 50 70 90 100 L 90 100 L 10 100 Z" fill="#7E4874" />
             <path d="M20 100 Q 50 80 80 100" fill="none" stroke="#070A26" strokeWidth="2" />
             
             {/* Tête (Forme gélule/obus) */}
             <rect x="25" y="15" width="50" height="70" rx="25" fill="#ECEBF1" stroke="#070A26" strokeWidth="3" />
             
             {/* Yeux (Fentes verticales) */}
             <rect x="38" y="35" width="8" height="25" rx="3" fill="#070A26" />
             <rect x="54" y="35" width="8" height="25" rx="3" fill="#070A26" />
             
             {/* Détails usure casque */}
             <path d="M35 25 L 40 28" stroke="#070A26" strokeWidth="1" opacity="0.5" />
             <path d="M65 20 L 60 25" stroke="#070A26" strokeWidth="1" opacity="0.5" />
           </svg>
        </div>

        <div className="inline-block p-3 pt-10 border-4 border-paladin-dark bg-paladin-purple text-white shadow-[6px_6px_0px_0px_rgba(7,10,38,1)] rotate-[-1deg]">
          <h1 className="text-2xl sm:text-4xl font-fantasy font-bold tracking-wider uppercase">
            SaaSpaladin
          </h1>
          <p className="text-[10px] sm:text-xs font-sans tracking-widest mt-0.5 uppercase opacity-90">
            Générateur d'images pour beehiiv
          </p>
        </div>
      </header>
      
      <main className="w-full max-w-4xl bg-white border-2 border-paladin-dark shadow-[12px_12px_0px_0px_rgba(7,10,38,0.2)] p-6 sm:p-10 rounded-sm relative overflow-hidden mt-2">
         {/* Decorative corners */}
         <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-paladin-purple"></div>
         <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-paladin-purple"></div>
         <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-paladin-purple"></div>
         <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-paladin-purple"></div>
         
        {children}
      </main>

      <footer className="mt-12 text-paladin-dark/60 text-sm font-fantasy text-center pb-8">
        © 2025 <a href="https://saaspasse.beehiiv.com/subscribe?_gl=1*fub7n0*_ga*MTM2NDMwNDA2NS4xNzM5NDg3Mzc5*_ga_500JY1EZSE*czE3NjQ1NDE3NzQkbzMzMyRnMCR0MTc2NDU0MTc3NCRqNjAkbDAkaDA." target="_blank" rel="noreferrer" className="hover:text-paladin-purple underline transition-colors">SaaSpasse</a> • Forgé avec Gemini 2.5 Flash & 3 Pro
      </footer>
    </div>
  );
};
