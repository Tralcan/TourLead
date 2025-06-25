'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { mockOffers } from "@/lib/data";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X } from "lucide-react";

export default function OffersPage() {
    const { toast } = useToast();

    const handleAccept = (companyName: string) => {
        toast({
            title: "¡Oferta Aceptada!",
            description: `Ahora estás reservado con ${companyName}. Tu calendario ha sido actualizado.`,
        });
    }

    const handleDecline = (companyName: string) => {
        toast({
            title: "Oferta Rechazada",
            description: `Has rechazado la oferta de ${companyName}.`,
            variant: "destructive",
        })
    }

    return (
        <div className="space-y-6">
            {mockOffers.map(offer => (
                <Card key={offer.id}>
                    <CardHeader className="flex flex-row items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={offer.company.avatar} alt={offer.company.name} />
                            <AvatarFallback>{offer.company.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="font-headline">{offer.jobType}</CardTitle>
                            <CardDescription>De {offer.company.name}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-semibold">Fechas: <span className="font-normal">{format(offer.startDate, "d MMM, yyyy", { locale: es })} - {format(offer.endDate, "d MMM, yyyy", { locale: es })}</span></p>
                        <p className="text-muted-foreground">{offer.description}</p>
                    </CardContent>
                    <CardFooter className="gap-4">
                        <Button onClick={() => handleAccept(offer.company.name)} className="bg-green-500 hover:bg-green-600 text-white">
                            <Check className="mr-2 h-4 w-4" />
                            Aceptar
                        </Button>
                        <Button onClick={() => handleDecline(offer.company.name)} variant="destructive">
                            <X className="mr-2 h-4 w-4" />
                            Rechazar
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            {mockOffers.length === 0 && (
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle>No hay Ofertas Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Actualmente no tienes nuevas ofertas de trabajo. ¡Vuelve más tarde!</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
