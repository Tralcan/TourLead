
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Logo />
             <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
            </Button>
        </header>

        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline">Centro de Soporte</CardTitle>
                    <CardDescription>¿Tienes alguna pregunta? Estamos aquí para ayudarte.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 text-center font-headline">Preguntas Frecuentes (FAQ)</h2>
                        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>¿Cómo funciona el sistema de suscripciones para empresas?</AccordionTrigger>
                                <AccordionContent>
                                    Para acceder a la búsqueda y contratación de guías, las empresas deben tener una suscripción activa. Estas son gestionadas por los administradores de la plataforma, quienes asignan un período de validez. Si tu suscripción ha expirado, por favor, contacta con el administrador.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Como guía, ¿cómo puedo asegurarme de que mi perfil sea atractivo?</AccordionTrigger>
                                <AccordionContent>
                                    Un perfil completo es clave. Asegúrate de tener una foto de perfil profesional, un resumen claro de tu experiencia, tus especialidades y los idiomas que hablas. Mantén tu calendario de disponibilidad siempre actualizado para recibir ofertas relevantes.
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3">
                                <AccordionTrigger>¿Qué ocurre si una oferta es aceptada?</AccordionTrigger>
                                <AccordionContent>
                                    Cuando un guía acepta una oferta, se crea un "compromiso". Las fechas del compromiso se bloquean automáticamente en el calendario del guía, y la empresa recibe una notificación. La información de contacto detallada se comparte entre ambas partes para facilitar la coordinación.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>¿Cómo funciona el sistema de calificaciones?</AccordionTrigger>
                                <AccordionContent>
                                    Después de que un trabajo ha finalizado (la fecha de término ha pasado), tanto el guía como la empresa pueden dejar una calificación y un comentario. Es importante destacar que la calificación que recibes solo será visible para ti una vez que tú también hayas calificado a la otra parte, fomentando un sistema de feedback justo y bilateral.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </section>
                    <section className="border-t pt-10 text-center">
                        <h2 className="text-2xl font-semibold mb-6 font-headline">¿No encuentras lo que buscas?</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Si tienes problemas técnicos, dudas sobre el uso de la plataforma, o cualquier otra consulta que no esté resuelta en nuestras preguntas frecuentes, no dudes en contactarnos directamente.
                        </p>
                        <div className="mt-6">
                            <p className="font-semibold">Diego Anguita M.</p>
                            <a href="mailto:danguita@me.com" className="text-primary hover:underline">
                                danguita@me.com
                            </a>
                        </div>
                    </section>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
