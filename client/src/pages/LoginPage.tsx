import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

// Schema di validazione
const loginSchema = z.object({
  email: z.string().min(1, 'Email richiesta'),
  password: z.string().min(1, 'Password richiesta'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Configurazione del form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });
  
  // Gestione login
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il login');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setLocation('/');
    },
    onError: (error: Error) => {
      setLoginError(error.message);
      // Reset password field
      form.setValue('password', '');
    },
  });
  
  const onSubmit = (data: LoginFormData) => {
    setLoginError(null);
    loginMutation.mutate(data);
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Colonna sinistra (immagine di sfondo + logo) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary-foreground/20 flex-col justify-between p-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">EXPERVISER CRM</h1>
          <p className="text-primary-foreground/90 text-xl max-w-md">
            La piattaforma per gestire relazioni con i clienti e incrementare le opportunità di business.
          </p>
        </div>
        <div className="text-primary-foreground/70 text-sm">
          &copy; {new Date().getFullYear()} Experviser. Tutti i diritti riservati.
        </div>
      </div>
      
      {/* Colonna destra (form login) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">EXPERVISER CRM</h1>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Benvenuto</h2>
            <p className="text-muted-foreground">Accedi per continuare</p>
          </div>
          
          {/* Form di login */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Errore di login */}
            {loginError && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
                {loginError}
              </div>
            )}
            
            {/* Campo email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                {...form.register('email')}
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Inserisci email"
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            {/* Campo password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  {...form.register('password')}
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Inserisci password"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            {/* Checkbox Remember me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...form.register('remember')}
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-muted-foreground">
                  Ricordami
                </label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">
                Password dimenticata?
              </a>
            </div>
            
            {/* Pulsante di login */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Accesso in corso...
                </span>
              ) : (
                'Accedi'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Per assistenza o problemi di accesso contatta l'amministratore di sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
}