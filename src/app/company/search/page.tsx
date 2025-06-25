
"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, DollarSign, User, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

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


const supabase = createClient();

async function getGuideRating(guideId: string) {
    const { data, error } = await supabase
        .from('commitments')
        .select('guide_rating')
        .eq('guide_id', guideId)
        .not('guide_rating', 'is', null);

    if (error) {
        console.error(`getGuideRating: Error al buscar calificaciones para ${guideId}:`, error);
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

const toYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
}

const offerFormSchema = z.object({
    job_type: z.string().min(1, "El tipo de trabajo es requerido."),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(500, "La descripción no puede exceder los 500 caracteres."),
  });
type OfferFormValues = z.infer<typeof offerFormSchema>;

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
    const form = useForm<OfferFormValues>({
        resolver: zodResolver(offerFormSchema),
        defaultValues: { job_type: "", description: "" }
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const onSubmit = async (values: OfferFormValues) => {
        setIsSubmitting(true);
        
        const formData = new FormData();
        formData.append('guideId', guide.id);
        formData.append('startDate', toYYYYMMDD(startDate));
        formData.append('endDate', toYYYYMMDD(endDate));
        formData.append('jobType', values.job_type);
        formData.append('description', values.description);

        const result = await createOffer(formData);
        
        if (result.success) {
            toast({ title: "¡Oferta Enviada!", description: `Tu oferta ha sido enviada a ${guide.name}.` });
            onOpenChange(false);
            form.reset();
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

    const [selectedGuide, setSelectedGuide] = React.useState<Guide | null>(null);
    const [isOfferDialogOpen, setIsOfferDialogOpen] = React.useState(false);

    React.useEffect(() => {
        async function fetchGuides() {
            setIsLoading(true);
            try {
                const { data: guidesData, error: guidesError } = await supabase.from('guides').select('*');

                if (guidesError) {
                    console.error("SearchPage: Fallo al obtener guías:", guidesError);
                    toast({ title: "Error", description: "No se pudieron cargar los guías.", variant: "destructive" });
                    setIsLoading(false);
                    return; 
                }

                if (guidesData) {
                    const guidesWithRatings = await Promise.all(
                        guidesData.map(async (guide) => {
                            const { rating, reviews } = await getGuideRating(guide.id);
                            return { ...guide, rating, reviews } as Guide;
                        })
                    );
                    
                    const allSpecialties = [...new Set(guidesWithRatings.flatMap(g => g.specialties || []))].filter(Boolean);
                    setSpecialtiesList(allSpecialties);

                    const allLanguages = [...new Set(guidesWithRatings.flatMap(g => g.languages || []))].filter(Boolean);
                    setLanguagesList(allLanguages);

                    setAllGuides(guidesWithRatings);
                    setFilteredGuides([]);
                }
            } catch (error) {
                console.error("SearchPage: Ocurrió un error inesperado al obtener guías:", error);
                toast({ title: "Error", description: "Ocurrió un error inesperado al obtener guías.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        fetchGuides();
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

        if(startDate && endDate) {
            guides = guides.filter(guide => {
                if(!guide.availability || guide.availability.length === 0) return false;
                
                const availableDates = new Set(guide.availability.map(d => d.split('T')[0]));
                
                let currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    if (!availableDates.has(toYYYYMMDD(currentDate))) {
                        return false; // If any date in the range is not available, exclude the guide
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                return true; // All dates in the range are available
            });
        }
        
        setFilteredGuides(guides);
        setIsSearching(false);
    }
    
    const handleOfferClick = (guide: Guide) => {
        if (!startDate || !endDate) {
            toast({ title: "Fechas Requeridas", description: "Por favor, selecciona una fecha de inicio y fin para hacer una oferta.", variant: "destructive" });
            return;
        }
        setSelectedGuide(guide);
        setIsOfferDialogOpen(true);
    };

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
                                        <CardDescription>{guide.email}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {guide.specialties?.map(spec => (
                                            <Badge key={spec} variant="outline">{spec}</Badge>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                            <span>{guide.rate} / día</span>
                                        </div>
                                        <StarRatingDisplay rating={guide.rating} reviews={guide.reviews} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleOfferClick(guide)}>
                                        <User className="mr-2 h-4 w-4" />
                                        Ver Perfil y Ofertar
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
        </div>
    );
}
