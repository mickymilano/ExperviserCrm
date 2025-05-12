import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-9xl font-bold text-primary">404</div>
      <h1 className="text-2xl font-semibold mt-4 mb-2">Pagina non trovata</h1>
      <p className="text-muted-foreground text-center mb-6">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <Button asChild>
        <Link href="/">Torna alla home</Link>
      </Button>
    </div>
  );
}