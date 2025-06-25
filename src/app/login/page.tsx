'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Mountain, Briefcase, Building } from 'lucide-react';

export default function LoginPage() {
    const supabase = createClient()

    const handleGoogleLogin = async (userType: 'guide' | 'company') => {
        const redirectTo = `${window.location.origin}/auth/callback`;

        // DEBUGGING: Mostrar la URL exacta que se está utilizando.
        alert(`URL de redirección que se enviará a Supabase:\n\n${redirectTo}\n\nAsegúrate de que esta URL sea EXACTAMENTE igual a una de las URLs en la lista de "Redirect URLs" en la configuración de autenticación de tu proyecto de Supabase.`);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
            },
        })

        if (error) {
            alert(`Error de Supabase al intentar iniciar sesión: ${error.message}`);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Mountain className="h-10 w-10 text-accent" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Bienvenido a TourLead Connect</CardTitle>
                    <CardDescription>Inicia sesión para continuar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => handleGoogleLogin('guide')} className="w-full">
                        <Briefcase className="mr-2 h-4 w-4" /> Iniciar Sesión como Guía
                    </Button>
                    <Button onClick={() => handleGoogleLogin('company')} className="w-full">
                        <Building className="mr-2 h-4 w-4" /> Iniciar Sesión como Empresa
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
