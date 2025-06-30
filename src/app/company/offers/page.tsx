
"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Edit, Trash, User } from "lucide-react";
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

const supabase = createClient();

type GuideInfo = {
    id: string;
    name: string | null;
    avatar: string | null;
};

type Offer = {
    id: number;
    job_type: string | null;
    description: string | null;
    start_date: string;
    end_date: string;
    contact_person: string | null;
    contact_phone: string | null;
    guide: GuideInfo;
};

type OfferCampaign = {
    campaignId: string;
    job_type: string | null;
    description: string | null;
    start_date: string;
    end_date: string;
    offers: Offer[];
    hasAcceptedOffers: boolean;
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
            const firstOffer = campaign.offers[0];
            form.reset({
                jobType: campaign.job_type ?? "",
                description: campaign.description ?? "",
                contactPerson: firstOffer?.contact_person ?? "",
                contactPhone: firstOffer?.contact_phone ?? "",
            });
        }
    }, [campaign, form]);

    if (!campaign) return null;

    const handleSubmit = async (values: EditOfferFormValues) => {
        setIsSubmitting(true);
        const offerIds = campaign.offers.map(o => o.id);
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
                        Estás editando la oferta para {campaign.offers.length} guía(s). Los cambios se aplicarán a todas las ofertas pendientes en esta campaña.
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
                .select('id, job_type, description, start_date, end_date, contact_person, contact_phone, guide:guides(id, name, avatar)')
                .eq('company_id', user.id)
                .eq('status', 'pending')
                .gte('end_date', new Date().toISOString());

            if (error) throw error;
            
            if (offersData) {
                const grouped = offersData.reduce((acc, offer) => {
                    const key = `${offer.job_type}-${offer.start_date}-${offer.end_date}`;
                    if (!acc[key]) {
                        acc[key] = {
                            campaignId: key,
                            job_type: offer.job_type,
                            description: offer.description,
                            start_date: offer.start_date,
                            end_date: offer.end_date,
                            offers: [],
                        };
                    }
                    acc[key].offers.push(offer as Offer);
                    return acc;
                }, {} as Record<string, Omit<OfferCampaign, 'hasAcceptedOffers'>>);

                const campaignsWithStatus = await Promise.all(Object.values(grouped).map(async (campaign) => {
                    const { count, error: countError } = await supabase
                        .from('offers')
                        .select('id', { count: 'exact', head: true })
                        .eq('company_id', user.id)
                        .eq('job_type', campaign.job_type!)
                        .eq('start_date', campaign.start_date)
                        .eq('end_date', campaign.end_date)
                        .eq('status', 'accepted');
                
                    if (countError) {
                        console.error("Error checking for accepted offers:", countError);
                        return { ...campaign, hasAcceptedOffers: false }; // Safe default
                    }
                
                    return { ...campaign, hasAcceptedOffers: (count ?? 0) > 0 };
                }));

                setCampaigns(campaignsWithStatus.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
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
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Ofertas de Trabajo Vigentes</CardTitle>
                    <CardDescription>
                        Gestiona las ofertas pendientes que has enviado. Aquí puedes editarlas o cancelarlas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground">Cargando ofertas...</p>
                    ) : campaigns.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No tienes ofertas vigentes.</p>
                    ) : (
                        campaigns.map(campaign => {
                            const isCancelDisabled = campaign.hasAcceptedOffers;
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
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
                                        <h4 className="font-semibold text-sm mb-2">Guías Ofertados ({campaign.offers.length}):</h4>
                                        <div className="flex flex-wrap gap-4">
                                            {campaign.offers.map(offer => (
                                                <div key={offer.guide.id} className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={offer.guide.avatar ?? undefined} alt={offer.guide.name ?? ''} />
                                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{offer.guide.name}</span>
                                                </div>
                                            ))}
                                        </div>
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
        </>
    );
}
