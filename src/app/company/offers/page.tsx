
"use client";

import React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Edit, Trash, User, UserPlus, Eye, ShieldCheck, DollarSign } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { updateOfferDetails, cancelPendingOffersForJob } from "@/app/actions/offers";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type Guide } from "@/lib/types";
import { StarRatingDisplay } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";

const supabase = createClient();

async function getGuideRating(guideId: string) {
    const { data, error } = await supabase
        .from('commitments')
        .select('guide_rating')
        .eq('guide_id', guideId)
        .not('guide_rating', 'is', null);

    if (error) {
        return { rating: 0, reviews: 0 };
    }
    
    if (!data || data.length === 0) {
        return { rating: 0, reviews: 0 };
    }

    const totalRating = data.reduce((acc, curr) => acc + (curr.guide_rating || 0), 0);
    const averageRating = totalRating / data.length;
    const result = { rating: parseFloat(averageRating.toFixed(1)), reviews: data.length };
    return result;
}


function GuideProfileDialog({ guide, isOpen, onOpenChange }: { guide: Guide, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!guide) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage src={guide.avatar ?? ''} alt={guide.name ?? ''} />
                        <AvatarFallback>{guide.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <DialogTitle className="text-2xl">{guide.name}</DialogTitle>
                        <DialogDescription>
                            {guide.email} {guide.phone && `• ${guide.phone}`}
                        </DialogDescription>
                        <StarRatingDisplay rating={guide.rating ?? 0} reviews={guide.reviews} />
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {guide.summary && <p className="text-sm text-muted-foreground">{guide.summary}</p>}
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Especialidades</h4>
                        <div className="flex flex-wrap gap-2">
                             {guide.specialties?.length ? guide.specialties.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>) : <p className="text-sm text-muted-foreground">No especificado</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Idiomas</h4>
                         <div className="flex flex-wrap gap-2">
                             {guide.languages?.length ? guide.languages.map(lang => <Badge key={lang} variant="secondary">{lang}</Badge>) : <p className="text-sm text-muted-foreground">No especificado</p>}
                        </div>
                    </div>
                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold text-sm mb-2">Información Académica</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            {guide.career && <p><span className="font-medium text-foreground">Carrera:</span> {guide.career}</p>}
                            {guide.institution && <p><span className="font-medium text-foreground">Institución:</span> {guide.institution}</p>}
                            {guide.is_certified && (
                                <div className="flex items-center gap-2 pt-1">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-foreground">Titulado</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {guide.rate && (
                        <div className="mt-4 border-t pt-4">
                            <h4 className="font-semibold text-sm mb-2">Tarifa por día</h4>
                             <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>{guide.rate} / día</span>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type Offer = {
    id: number;
    job_type: string | null;
    description: string | null;
    start_date: string;
    end_date: string;
    contact_person: string | null;
    contact_phone: string | null;
    status: 'pending' | 'accepted' | 'rejected';
    guide: Guide;
};

type OfferCampaign = {
    campaignId: string;
    job_type: string | null;
    description: string | null;
    start_date: string;
    end_date: string;
    contact_person: string | null;
    contact_phone: string | null;
    acceptedGuides: Offer[];
    pendingGuides: Offer[];
};

const editOfferFormSchema = z.object({
  jobType: z.string().min(1, "El tipo de trabajo es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  contactPerson: z.string().min(1, "La persona de contacto es requerida."),
  contactPhone: z.string().min(1, "El teléfono de contacto es requerido."),
});

type EditOfferFormValues = z.infer<typeof editOfferFormSchema>;

function EditOfferDialog({ campaign, isOpen, onOpenChange, onUpdated }: { campaign: OfferCampaign | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onUpdated: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const form = useForm<EditOfferFormValues>({
        resolver: zodResolver(editOfferFormSchema),
        defaultValues: { jobType: "", description: "", contactPerson: "", contactPhone: "" }
    });
    
    React.useEffect(() => {
        if (campaign) {
            form.reset({
                jobType: campaign.job_type ?? "",
                description: campaign.description ?? "",
                contactPerson: campaign.contact_person ?? "",
                contactPhone: campaign.contact_phone ?? "",
            });
        }
    }, [campaign, form]);

    if (!campaign) return null;

    const handleSubmit = async (values: EditOfferFormValues) => {
        setIsSubmitting(true);
        const offerIds = campaign.pendingGuides.map(o => o.id);
        const result = await updateOfferDetails({
            offerIds,
            jobType: values.jobType,
            description: values.description,
            contactPerson: values.contactPerson,
            contactPhone: values.contactPhone,
        });

        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            onUpdated();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Oferta de Trabajo</DialogTitle>
                    <DialogDescription>
                        Estás editando la oferta para {campaign.pendingGuides.length} guía(s) pendiente(s). Los cambios se aplicarán a todas las ofertas pendientes en esta campaña.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="jobType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Trabajo</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Persona de Contacto</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono de Contacto</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ActiveOffersPage() {
    const { toast } = useToast();
    const [campaigns, setCampaigns] = React.useState<OfferCampaign[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [selectedCampaignForEdit, setSelectedCampaignForEdit] = React.useState<OfferCampaign | null>(null);

    const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
    const [selectedCampaignForCancel, setSelectedCampaignForCancel] = React.useState<OfferCampaign | null>(null);
    const [isCanceling, setIsCanceling] = React.useState(false);

    const [selectedGuide, setSelectedGuide] = React.useState<Guide | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

    const fetchCampaigns = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const { data: offersData, error } = await supabase
                .from('offers')
                .select('id, job_type, description, start_date, end_date, contact_person, contact_phone, status, guide:guides(*)')
                .eq('company_id', user.id)
                .or('status.eq.pending,status.eq.accepted')
                .gte('end_date', new Date().toISOString());

            if (error) throw error;
            
            if (offersData) {
                const offersWithRatings = await Promise.all(
                    offersData.map(async (offer) => {
                        const guide = offer.guide as Guide;
                        if (!guide) return null;
                        const { rating, reviews } = await getGuideRating(guide.id);
                        return { ...offer, guide: { ...guide, rating, reviews } } as Offer;
                    })
                );

                const validOffers = offersWithRatings.filter(Boolean) as Offer[];
                
                const grouped = validOffers.reduce((acc, offer) => {
                    const key = `${offer.job_type}-${offer.start_date}-${offer.end_date}`;
                    if (!acc[key]) {
                        acc[key] = {
                            campaignId: key,
                            job_type: offer.job_type,
                            description: offer.description,
                            start_date: offer.start_date,
                            end_date: offer.end_date,
                            contact_person: offer.contact_person,
                            contact_phone: offer.contact_phone,
                            acceptedGuides: [],
                            pendingGuides: [],
                        };
                    }

                    if (offer.status === 'accepted') {
                        acc[key].acceptedGuides.push(offer);
                    } else if (offer.status === 'pending') {
                        acc[key].pendingGuides.push(offer);
                    }
                    
                    return acc;
                }, {} as Record<string, OfferCampaign>);


                setCampaigns(Object.values(grouped).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({ title: "Error", description: `No se pudieron cargar las ofertas: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    React.useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);
    
    const handleEditClick = (campaign: OfferCampaign) => {
        setSelectedCampaignForEdit(campaign);
        setIsEditDialogOpen(true);
    };

    const handleCancelClick = (campaign: OfferCampaign) => {
        setSelectedCampaignForCancel(campaign);
        setIsCancelDialogOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedCampaignForCancel) return;
        setIsCanceling(true);

        const { job_type, start_date, end_date } = selectedCampaignForCancel;
        const result = await cancelPendingOffersForJob({
            jobType: job_type,
            startDate: start_date,
            endDate: end_date,
        });

        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            fetchCampaigns();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        
        setIsCanceling(false);
        setIsCancelDialogOpen(false);
        setSelectedCampaignForCancel(null);
    };

    const handleViewProfile = (guide: Guide) => {
        setSelectedGuide(guide);
        setIsProfileDialogOpen(true);
    };
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Ofertas de Trabajo Vigentes</CardTitle>
                    <CardDescription>
                        Gestiona las ofertas que has enviado. Aquí puedes editarlas, cancelarlas o añadir más guías.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground">Cargando ofertas...</p>
                    ) : campaigns.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No tienes ofertas vigentes.</p>
                    ) : (
                        campaigns.map(campaign => {
                            const isCancelDisabled = campaign.acceptedGuides.length > 0;
                            const allOfferedGuides = [...campaign.acceptedGuides, ...campaign.pendingGuides];
                            
                            const params = new URLSearchParams();
                            params.set('start_date', campaign.start_date);
                            params.set('end_date', campaign.end_date);
                            params.set('job_type', campaign.job_type || '');
                            params.set('description', campaign.description || '');
                            params.set('contact_person', campaign.contact_person || '');
                            params.set('contact_phone', campaign.contact_phone || '');
                            const existingGuideIds = allOfferedGuides.map(o => o.guide.id).join(',');
                            params.set('exclude_guides', existingGuideIds);
                            const href = `/company/search?${params.toString()}`;

                            return (
                                <Card key={campaign.campaignId} className="bg-muted/30">
                                    <CardHeader>
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <CardTitle>{campaign.job_type}</CardTitle>
                                                <CardDescription>
                                                    {format(new Date(campaign.start_date.replace(/-/g, '/')), "d MMM yyyy", { locale: es })} - {format(new Date(campaign.end_date.replace(/-/g, '/')), "d MMM yyyy", { locale: es })}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link href={href} passHref>
                                                    <Button asChild variant="outline" size="icon">
                                                        <span>
                                                            <UserPlus className="h-4 w-4" />
                                                            <span className="sr-only">Añadir Guía</span>
                                                        </span>
                                                    </Button>
                                                </Link>
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(campaign)}>
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Editar</span>
                                                </Button>

                                                {isCancelDisabled ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span tabIndex={0}>
                                                                <Button variant="destructive" size="icon" disabled>
                                                                    <Trash className="h-4 w-4" />
                                                                    <span className="sr-only">Cancelar</span>
                                                                </Button>
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>No se puede cancelar porque al menos un guía ya aceptó esta oferta.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <Button variant="destructive" size="icon" onClick={() => handleCancelClick(campaign)}>
                                                        <Trash className="h-4 w-4" />
                                                        <span className="sr-only">Cancelar</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
                                        
                                        {campaign.acceptedGuides.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2">Guías Aceptados ({campaign.acceptedGuides.length}):</h4>
                                                <div className="flex flex-wrap gap-4">
                                                    {campaign.acceptedGuides.map(offer => (
                                                        <button 
                                                            key={offer.guide.id}
                                                            className="flex items-center gap-2 p-1 rounded-md hover:bg-background transition-colors"
                                                            onClick={() => handleViewProfile(offer.guide)}
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={offer.guide.avatar ?? undefined} alt={offer.guide.name ?? ''} />
                                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm font-medium">{offer.guide.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {campaign.pendingGuides.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2">Guías Pendientes ({campaign.pendingGuides.length}):</h4>
                                                <div className="flex flex-wrap gap-4">
                                                    {campaign.pendingGuides.map(offer => (
                                                         <button 
                                                            key={offer.guide.id}
                                                            className="flex items-center gap-2 p-1 rounded-md hover:bg-background transition-colors"
                                                            onClick={() => handleViewProfile(offer.guide)}
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={offer.guide.avatar ?? undefined} alt={offer.guide.name ?? ''} />
                                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm">{offer.guide.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            <EditOfferDialog 
                campaign={selectedCampaignForEdit}
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onUpdated={fetchCampaigns}
            />

            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cancelará todas las ofertas pendientes para el trabajo "{selectedCampaignForCancel?.job_type}". Los guías ya no podrán aceptar la oferta. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCanceling}>No, mantener ofertas</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmCancel} disabled={isCanceling} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sí, cancelar todas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {selectedGuide && (
                <GuideProfileDialog
                    guide={selectedGuide}
                    isOpen={isProfileDialogOpen}
                    onOpenChange={setIsProfileDialogOpen}
                />
            )}
        </>
    );
}
