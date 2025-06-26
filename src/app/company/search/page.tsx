
"use client";

import React from "react";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, DollarSign, User, Loader2, ShieldCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StarRatingDisplay } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { Guide } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createOffer } from "@/app/actions/offers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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

const offerFormSchema = z.object({
    job_type: z.string().min(1, "El tipo de trabajo es requerido."),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(500, "La descripción no puede exceder los 500 caracteres."),
    contact_person: z.string().min(1, "El nombre de contacto es requerido."),
    contact_phone: z.string().min(1, "El teléfono de contacto es requerido."),
  });
type OfferFormValues = z.infer<typeof offerFormSchema>;

type RatingDetail = {
    id: number;
    job_type: string | null;
    guide_rating: number | null;
    end_date: string;
    company: { name: string | null } | null;
};

function RatingDetailsDialog({ guide, isOpen, onOpenChange }: { guide: Guide, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [ratings, setRatings] = React.useState<RatingDetail[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        if (!isOpen) return;

        async function fetchRatingDetails() {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('commitments')
                .select(`
                    id,
                    job_type,
                    guide_rating,
                    end_date,
                    company:companies (
                        name
                    )
                `)
                .eq('guide_id', guide.id)
                .not('guide_rating', 'is', null)
                .order('end_date', { ascending: false });
            
            if (error) {
                console.error("Error al obtener detalles de calificación:", error);
                toast({ title: "Error", description: "No se pudieron cargar los detalles de las calificaciones.", variant: "destructive" });
            } else if (data) {
                setRatings(data as RatingDetail[]);
            }
            setIsLoading(false);
        }

        fetchRatingDetails();
    }, [guide.id, isOpen, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Calificaciones de {guide.name}</DialogTitle>
                    <DialogDescription>
                        Detalle de los trabajos anteriores y las calificaciones recibidas.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <p className="text-center">Cargando calificaciones...</p>
                    ) : ratings.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trabajo</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Calificación</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ratings.map(rating => (
                                    <TableRow key={rating.id}>
                                        <TableCell>{rating.job_type || 'N/A'}</TableCell>
                                        <TableCell>{rating.company?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            {format(new Date(rating.end_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <StarRatingDisplay rating={rating.guide_rating ?? 0} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center">Este guía aún no tiene calificaciones.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function OfferDialog({ 
    guide, 
    startDate, 
    endDate, 
    isOpen, 
    onOpenChange 
}: { 
    guide: Guide, 
    startDate: Date, 
    endDate: Date, 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<OfferFormValues>({
        resolver: zodResolver(offerFormSchema),
        defaultValues: { job_type: "", description: "", contact_person: "", contact_phone: "" }
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const onSubmit = async (values: OfferFormValues) => {
        setIsSubmitting(true);
        
        const formData = new FormData();
        formData.append('guideId', guide.id);
        formData.append('startDate', format(startDate, 'yyyy-MM-dd'));
        formData.append('endDate', format(endDate, 'yyyy-MM-dd'));
        formData.append('jobType', values.job_type);
        formData.append('description', values.description);
        formData.append('contactPerson', values.contact_person);
        formData.append('contactPhone', values.contact_phone);

        const result = await createOffer(formData);
        
        if (result.success) {
            toast({ title: "¡Oferta Enviada!", description: `Tu oferta ha sido enviada a ${guide.name}.` });
            router.push('/company/hired');
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Hacer una Oferta a {guide.name}</DialogTitle>
                    <DialogDescription>
                        Fechas seleccionadas: {format(startDate, "PPP", { locale: es })} - {format(endDate, "PPP", { locale: es })}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="job_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Trabajo</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej. Tour por el centro histórico" {...field} />
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
                              <FormLabel>Descripción de la Oferta</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Describe los detalles del trabajo, responsabilidades, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="contact_person"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Persona de Contacto para la Oferta</FormLabel>
                              <FormControl>
                                <Input placeholder="Juan Pérez" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contact_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono de Contacto</FormLabel>
                              <FormControl>
                                <Input placeholder="+56 9 1234 5678" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Enviando..." : "Enviar Oferta"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
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
                            <p className="font-semibold">${guide.rate}</p>
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

export default function SearchGuidesPage() {
    const { toast } = useToast();
    const [startDate, setStartDate] = React.useState<Date | undefined>();
    const [endDate, setEndDate] = React.useState<Date | undefined>();
    const [specialty, setSpecialty] = React.useState<string>('');
    const [language, setLanguage] = React.useState<string>('');
    
    const [allGuides, setAllGuides] = React.useState<Guide[]>([]);
    const [filteredGuides, setFilteredGuides] = React.useState<Guide[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSearching, setIsSearching] = React.useState(false);
    const [specialtiesList, setSpecialtiesList] = React.useState<string[]>([]);
    const [languagesList, setLanguagesList] = React.useState<string[]>([]);
    const [hasSearched, setHasSearched] = React.useState(false);

    const [isSubscribed, setIsSubscribed] = React.useState(false);
    const [isCheckingSubscription, setIsCheckingSubscription] = React.useState(true);

    const [selectedGuide, setSelectedGuide] = React.useState<Guide | null>(null);
    const [isOfferDialogOpen, setIsOfferDialogOpen] = React.useState(false);
    
    const [selectedGuideForProfile, setSelectedGuideForProfile] = React.useState<Guide | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

    const [selectedGuideForRatings, setSelectedGuideForRatings] = React.useState<Guide | null>(null);
    const [isRatingDialogOpen, setIsRatingDialogOpen] = React.useState(false);

    React.useEffect(() => {
        async function performSubscriptionCheckAndFetchData() {
            setIsCheckingSubscription(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsCheckingSubscription(false);
                setIsLoading(false);
                return;
            }

            try {
                const today = new Date().toISOString();
                const { data: subscriptionData, error: subscriptionError } = await supabase
                    .from('subscriptions')
                    .select('id', { count: 'exact' })
                    .eq('company_id', user.id)
                    .lte('start_date', today)
                    .gte('end_date', today);

                if (subscriptionError) throw subscriptionError;

                if (subscriptionData && subscriptionData.length > 0) {
                    setIsSubscribed(true);
                    setIsLoading(true);
                    
                    const [guidesRes, specialtiesRes, languagesRes] = await Promise.all([
                        supabase.from('guides').select('*'),
                        supabase.from('expertise').select('name').eq('state', true),
                        supabase.from('languaje').select('name')
                    ]);

                    const { data: guidesData, error: guidesError } = guidesRes;
                    if (guidesError) throw new Error(`Error fetching guides: ${guidesError.message}`);
                    if (guidesData) {
                         const guidesWithRatings = await Promise.all(
                            guidesData.map(async (guide) => {
                                const { rating, reviews } = await getGuideRating(guide.id);
                                return { ...guide, rating, reviews } as Guide;
                            })
                        );
                        setAllGuides(guidesWithRatings);
                    }

                    const { data: specialtiesData, error: specialtiesError } = specialtiesRes;
                    if (specialtiesError) throw new Error(`Error fetching specialties: ${specialtiesError.message}`);
                    if (specialtiesData) {
                        setSpecialtiesList(specialtiesData.map(s => s.name).filter(Boolean));
                    }

                    const { data: languagesData, error: languagesError } = languagesRes;
                    if (languagesError) throw new Error(`Error fetching languages: ${languagesError.message}`);
                    if (languagesData) {
                        setLanguagesList(languagesData.map(l => l.name).filter(Boolean));
                    }
                    setFilteredGuides([]);
                    setIsLoading(false);
                } else {
                    setIsSubscribed(false);
                }
            } catch (error) {
                 const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
                toast({ title: "Error", description: `Ocurrió un error inesperado: ${errorMessage}`, variant: "destructive" });
                 setIsLoading(false);
            } finally {
                setIsCheckingSubscription(false);
            }
        }
        performSubscriptionCheckAndFetchData();
    }, [toast]);

    const handleSearch = () => {
        setIsSearching(true);
        setHasSearched(true);
        
        let guides = [...allGuides];

        if (specialty) {
            guides = guides.filter(g => g.specialties?.includes(specialty));
        }

        if (language) {
            guides = guides.filter(g => g.languages?.includes(language));
        }

        if (startDate && endDate) {
            const requiredDates: string[] = [];
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                requiredDates.push(format(currentDate, 'yyyy-MM-dd'));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            guides = guides.filter(guide => {
                if (!guide.availability || guide.availability.length === 0) {
                    return false;
                }
                const availableDates = new Set(guide.availability.map(d => d.split('T')[0]));
                for (const dateToCheck of requiredDates) {
                    if (!availableDates.has(dateToCheck)) {
                        return false;
                    }
                }
                return true;
            });
        }
        
        setFilteredGuides(guides);
        setIsSearching(false);
    }
    
    const handleViewProfile = (guide: Guide) => {
        setSelectedGuideForProfile(guide);
        setIsProfileDialogOpen(true);
    };

    const handleOfferClick = (guide: Guide) => {
        if (!startDate || !endDate) {
            toast({ title: "Fechas Requeridas", description: "Por favor, selecciona una fecha de inicio y fin para hacer una oferta.", variant: "destructive" });
            return;
        }
        setSelectedGuide(guide);
        setIsOfferDialogOpen(true);
    };

    const handleRatingClick = (guide: Guide) => {
        if ((guide.reviews ?? 0) > 0) {
            setSelectedGuideForRatings(guide);
            setIsRatingDialogOpen(true);
        }
    };

    if (isCheckingSubscription) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verificando Acceso</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Estamos verificando tu estado de suscripción...</p>
                </CardContent>
            </Card>
        );
    }

    if (!isSubscribed) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Restringido</CardTitle>
                    <CardDescription>Necesitas una suscripción activa para buscar guías.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Por favor, contacta con el administrador para activar tu acceso a esta funcionalidad.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Encuentra a tu Guía Perfecto</CardTitle>
                    <CardDescription>Filtra guías por disponibilidad, especialidad e idioma para encontrar lo que necesitas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Elige una fecha de inicio</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>Elige una fecha de fin</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} />
                            </PopoverContent>
                        </Popover>
                        
                        <Select onValueChange={(value) => setSpecialty(value === 'all-specialties' ? '' : value)} value={specialty || 'all-specialties'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una especialidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-specialties">Todas las especialidades</SelectItem>
                                {specialtiesList.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(value) => setLanguage(value === 'all-languages' ? '' : value)} value={language || 'all-languages'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un idioma" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-languages">Todos los idiomas</SelectItem>
                                {languagesList.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                            </SelectContent>
                        </Select>

                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSearch} disabled={isSearching} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Buscar Guías
                    </Button>
                </CardFooter>
            </Card>

            {isLoading ? (
                <p className="text-center">Cargando guías...</p>
            ) : hasSearched ? (
                filteredGuides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGuides.map(guide => (
                            <Card key={guide.id} className="flex flex-col">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={guide.avatar ?? ''} alt={guide.name ?? ''} />
                                        <AvatarFallback>{guide.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="font-headline">{guide.name}</CardTitle>
                                        <CardDescription>
                                            {guide.languages?.join(' • ') || 'Idiomas no especificados'}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {guide.specialties?.map(spec => (
                                            <Badge key={spec} variant="outline">{spec}</Badge>
                                        ))}
                                    </div>
                                    <div className="space-y-2 text-sm text-muted-foreground pt-2">
                                        {guide.summary && <p className="line-clamp-3">{guide.summary}</p>}
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground border-t pt-4">
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                            <span>{guide.rate} / día</span>
                                        </div>
                                        <button
                                            onClick={() => handleRatingClick(guide)}
                                            disabled={(guide.reviews ?? 0) === 0}
                                            className="disabled:cursor-not-allowed"
                                            aria-label="Ver detalles de calificaciones"
                                        >
                                            <StarRatingDisplay rating={guide.rating} reviews={guide.reviews} />
                                        </button>
                                    </div>
                                </CardContent>
                                <CardFooter className="gap-2">
                                    <Button variant="outline" className="w-full" onClick={() => handleViewProfile(guide)}>
                                        Ver Perfil
                                    </Button>
                                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleOfferClick(guide)}>
                                        Ofertar
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center p-8">
                        <CardTitle>No se encontraron guías</CardTitle>
                        <CardDescription>Prueba con otros filtros de búsqueda.</CardDescription>
                    </Card>
                )
            ) : (
                <Card className="text-center p-8">
                    <CardTitle>Realiza una búsqueda</CardTitle>
                    <CardDescription>Utiliza los filtros de arriba para encontrar al guía perfecto.</CardDescription>
                </Card>
            )}

            {selectedGuide && startDate && endDate && (
                <OfferDialog
                    guide={selectedGuide}
                    startDate={startDate}
                    endDate={endDate}
                    isOpen={isOfferDialogOpen}
                    onOpenChange={setIsOfferDialogOpen}
                />
            )}

            {selectedGuideForRatings && (
                <RatingDetailsDialog
                    guide={selectedGuideForRatings}
                    isOpen={isRatingDialogOpen}
                    onOpenChange={setIsRatingDialogOpen}
                />
            )}

            {selectedGuideForProfile && (
                <GuideProfileDialog
                    guide={selectedGuideForProfile}
                    isOpen={isProfileDialogOpen}
                    onOpenChange={setIsProfileDialogOpen}
                />
            )}
        </div>
    );
}

    