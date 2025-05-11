import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import experviserLogoPath from "@assets/experviser_logo.png";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, { message: "Email or username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { hasToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isShowingPassword, setIsShowingPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [directLogin, setDirectLogin] = useState(false);

  // Cleanup localStorage on mount, only if there's a persistent auth error
  React.useEffect(() => {
    // Se c'è un token ma non c'è un utente autenticato, probabilmente il token è scaduto
    if (hasToken && !isAuthenticated && !authLoading) {
      console.log("Removing invalid token from localStorage");
      localStorage.removeItem("auth_token");
    }
  }, [hasToken, isAuthenticated, authLoading]);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log("Already authenticated, redirecting to dashboard");
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  // Direct API login without using the auth hook
  const directApiLogin = async (data: LoginFormValues) => {
    setLoginError(null);
    setDirectLogin(true);

    try {
      // Console di debug
      console.log("Tentativo di login con:", data);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      const responseText = await response.text();
      console.log("Server response:", response.status, responseText);
      
      if (!response.ok) {
        throw new Error(responseText || response.statusText);
      }
      
      // Parse la risposta come JSON dopo aver già letto il testo
      let result;
      try {
        result = JSON.parse(responseText);
        console.log("Login result:", result);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid server response format");
      }
      
      if (result && result.token) {
        // Store the token
        console.log("Saving token to localStorage:", result.token.substring(0, 10) + "...");
        localStorage.setItem("auth_token", result.token);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${result.user.fullName || result.user.username}!`
        });
        
        // Breve pausa per mostrare il toast di successo
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reimposta eventuali token scaduti
        console.log("Navigating to dashboard");
        
        // Force a page reload to reset all app state
        window.location.href = "/";
      } else {
        throw new Error("Invalid login response - missing token");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Failed to login. Please check your credentials.");
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDirectLogin(false);
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    console.log("Form submitted with:", data);
    
    // Fornisci le credenziali di superadmin per debug
    if (data.emailOrUsername === 'debug' && data.password === 'debug') {
      form.setValue('emailOrUsername', 'michele@experviser.com');
      form.setValue('password', 'admin_admin_69');
      
      toast({
        title: "Debug mode",
        description: "Admin credentials loaded. Click login again."
      });
      return;
    }
    
    // Use the direct API login method
    directApiLogin(data);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <img src={experviserLogoPath} alt="Experviser Logo" className="mx-auto h-16 mb-2" />
          <h2 className="text-2xl font-bold text-gray-900">EXPERVISER CRM</h2>
          <p className="text-gray-600">Premium CRM for Consultants</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
              {loginError && (
                <div className="mt-2 text-red-500 text-sm">{loginError}</div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="emailOrUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email or username" {...field} />
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
                        <div className="relative">
                          <Input 
                            type={isShowingPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                            onClick={() => setIsShowingPassword(!isShowingPassword)}
                          >
                            {isShowingPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <Label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Remember me
                    </Label>
                  </div>
                  
                  <div className="text-sm">
                    <a
                      href="/auth/forgot-password"
                      className="font-medium text-primary hover:text-primary-focus"
                    >
                      Forgot your password?
                    </a>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={directLogin}
                  >
                    {directLogin ? "Logging in..." : "Login"}
                  </Button>
                  
                  <div className="text-center text-xs text-gray-500">
                    <p className="mt-1">Admin account: michele@experviser.com / admin_admin_69</p>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-xs text-gray-500 w-full">
              By continuing, you agree to Experviser's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}