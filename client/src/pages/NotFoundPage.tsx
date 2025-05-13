import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Pagina non trovata</h2>
        <p className="mb-6 text-muted-foreground">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link href="/">
          <a className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            <ChevronLeft className="h-4 w-4" />
            <span>Torna alla dashboard</span>
          </a>
        </Link>
      </div>
    </div>
  );
}