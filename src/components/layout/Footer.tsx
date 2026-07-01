import { ExternalLink } from 'lucide-react';
export function Footer() {
  const currentYear = new Date().getFullYear();
  const developerUrl = "https://sactel.cloud"; // Reemplaza con tu URL real
  const developerName = "SACTel Cloud";
  return (
    <footer className="border-t border-border bg-card py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {currentYear}</span>
            <span className="hidden md:inline">|</span>
            <span>Todos los derechos reservados</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span>Desarrollado por</span>
            <a
              href={developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
            >
              {developerName}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}