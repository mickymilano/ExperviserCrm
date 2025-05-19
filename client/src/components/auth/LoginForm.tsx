/**
 * Componente di login robusto con modalità di fallback
 */
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { login, generateEmergencyToken } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

// Schema di validazione
const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve contenere almeno 6 caratteri'),
  bypassAuth: z.boolean().default(false)
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyMode, setShowEmergencyMode] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      bypassAuth: false
    }
  });

  // Gestione invio form
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Tentativo di login normale
      await login(values.email, values.password, values.bypassAuth);
      toast({
        title: 'Login effettuato con successo',
        description: 'Benvenuto nel CRM',
        variant: 'default'
      });
      setLocation('/');
    } catch (error: any) {
      console.error('Errore login:', error);
      
      if (error.message?.includes('database') || error.message?.includes('server')) {
        // Mostra opzione per modalità di emergenza
        setShowEmergencyMode(true);
        toast({
          title: 'Errore di connessione',
          description: 'Si è verificato un problema con il server. Prova la modalità di emergenza.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Errore di autenticazione',
          description: error.message || 'Credenziali non valide',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Attiva token di emergenza
  const handleEmergencyAccess = async () => {
    setIsLoading(true);
    
    try {
      await generateEmergencyToken();
      toast({
        title: 'Accesso di emergenza attivato',
        description: 'Sei stato autenticato in modalità di emergenza',
        variant: 'default'
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: 'Errore di accesso',
        description: error.message || 'Impossibile generare token di emergenza',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Accesso al CRM</CardTitle>
        <CardDescription>Inserisci le tue credenziali per accedere</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@experviser.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {process.env.NODE_ENV === 'development' && (
              <FormField
                control={form.control}
                name="bypassAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Modalità sviluppo (bypass autenticazione)
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      {showEmergencyMode && (
        <CardFooter className="flex flex-col">
          <div className="text-sm text-muted-foreground mb-2">
            Problemi di connessione al database? Prova l'accesso di emergenza:
          </div>
          <Button 
            variant="outline" 
            onClick={handleEmergencyAccess}
            disabled={isLoading}
            className="w-full"
          >
            Accesso di emergenza
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}