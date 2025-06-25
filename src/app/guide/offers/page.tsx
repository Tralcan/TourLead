'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { JobOffer } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X } from "lucide-react";
import { StarRatingDisplay } from "@/components/star-rating";
import React from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

async function getCompanyRating(companyId: string) {
    const { data, error } = await supabase
        .from('commitments')
        .select('company_rating')
        .eq('company_id', companyId)
        .not('company_rating', 'is', null);

    if (error || !data || data.length === 0) {
        return { rating: 0, reviews: 0 };
    }

    const totalRating = data.reduce((acc, curr) => acc + (curr.company_rating || 0), 0);
    const averageRating = totalRating / data.length;
    return { rating: averageRating, reviews: data.length };
}


export default function OffersPage() {
    const { toast } = useToast();
    const [offers, setOffers] = React.useState<JobOffer[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [user, setUser] = React.useState<User | null>(null);

    const fetchOffers = React.useCallback(async (currentUser: User) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('offers')
            .select(`
                *,
                company:companies(*)
            `)
            .eq('guide_id', currentUser.id)
            .eq('status', 'pending');

        if (data) {
            const offersWithRatings = await Promise.all(data.map(async (offer) => {
                const company = offer.company as any;
                const { rating, reviews } = await getCompanyRating(company.id);
                return {
                    ...offer,
                    startDate: new Date(offer.start_date!),
                    endDate: new Date(offer.end_date!),
                    company: { ...company, rating, reviews }
                } as unknown as JobOffer;
            }));
            setOffers(offersWithRatings);
        } else {
            console.error(error);
        }
        setIsLoading(false);
    }, []);
    
    React.useEffect(() => {
        const getUserAndOffers = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                fetchOffers(user);
            } else {
                setIsLoading(false);
            }
        };
        getUserAndOffers();
    }, [fetchOffers]);


    const handleAccept = async (offer: JobOffer) => {
        const { error: updateError } = await supabase
            .from('offers')
            .update({ status: 'accepted' })
            .eq('id', offer.id);

        if (updateError) {
            toast({ title: "Error", description: "No se pudo aceptar la oferta.", variant: "destructive" });
            return;
        }

        const { error: insertError } = await supabase
            .from('commitments')
            .insert({
                guide_id: offer.guide_id,
                company_id: offer.company.id,
                job_type: offer.job_type,
                start_date: format(offer.startDate, 'yyyy-MM-dd'),
                end_date: format(offer.endDate, 'yyyy-MM-dd'),
            });
        
        if (insertError) {
             toast({ title: "Error", description: "No se pudo crear el compromiso.", variant: "destructive" });
        } else {
            toast({
                title: "¡Oferta Aceptada!",
                description: `Ahora estás reservado con ${offer.company.name}. Tu calendario ha sido actualizado.`,
            });
            if(user) fetchOffers(user); 
        }
    }

    const handleDecline = async (offer: JobOffer) => {
        const { error } = await supabase
            .from('offers')
            .update({ status: 'rejected' })
            .eq('id', offer.id);
        
        if(error) {
            toast({ title: "Error", description: "No se pudo rechazar la oferta.", variant: "destructive" });
        } else {
            toast({
                title: "Oferta Rechazada",
                description: `Has rechazado la oferta de ${offer.company.name}.`,
            });
             if(user) fetchOffers(user);
        }
    }
    
    if (isLoading) {
        return <p>Cargando ofertas...</p>
    }

    return (
        <div className="space-y-6">
            {offers.map(offer => (
                <Card key={offer.id}>
                    <CardHeader>
                       <div className="flex flex-row items-start gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={offer.company.avatar ?? ''} alt={offer.company.name ?? ''} />
                                <AvatarFallback>{offer.company.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="font-headline">{offer.job_type}</CardTitle>
                                        <CardDescription>De {offer.company.name}</CardDescription>
                                    </div>
                                    <StarRatingDisplay rating={offer.company.rating} reviews={offer.company.reviews} />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                        <p className="font-semibold">Fechas: <span className="font-normal">{format(offer.startDate, "d MMM, yyyy", { locale: es })} - {format(offer.endDate, "d MMM, yyyy", { locale: es })}</span></p>
                        <p className="text-muted-foreground">{offer.description}</p>
                    </CardContent>
                    <CardFooter className="gap-4">
                        <Button onClick={() => handleAccept(offer)} className="bg-green-500 hover:bg-green-600 text-white">
                            <Check className="mr-2 h-4 w-4" />
                            Aceptar
                        </Button>
                        <Button onClick={() => handleDecline(offer)} variant="destructive">
                            <X className="mr-2 h-4 w-4" />
                            Rechazar
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            {offers.length === 0 && (
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
