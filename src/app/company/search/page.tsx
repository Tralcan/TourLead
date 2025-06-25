
"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, DollarSign, User } from "lucide-react";
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

const supabase = createClient();

async function getGuideRating(guideId: string) {
    const { data, error } = await supabase
        .from('commitments')
        .select('guide_rating')
        .eq('guide_id', guideId)
        .not('guide_rating', 'is', null);

    if (error) {
        // Log the error but don't throw, to avoid crashing the whole page
        console.error(`Error fetching rating for guide ${guideId}:`, error);
        return { rating: 0, reviews: 0 };
    }
    
    if (!data || data.length === 0) {
        return { rating: 0, reviews: 0 };
    }

    const totalRating = data.reduce((acc, curr) => acc + (curr.guide_rating || 0), 0);
    const averageRating = totalRating / data.length;
    return { rating: parseFloat(averageRating.toFixed(1)), reviews: data.length };
}

// Helper to format a Date object to 'YYYY-MM-DD' string, ignoring timezone.
const toYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}


export default function SearchGuidesPage() {
    const [startDate, setStartDate] = React.useState<Date | undefined>();
    const [endDate, setEndDate] = React.useState<Date | undefined>();
    const [specialty, setSpecialty] = React.useState<string>('');
    
    const [allGuides, setAllGuides] = React.useState<Guide[]>([]);
    const [filteredGuides, setFilteredGuides] = React.useState<Guide[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [specialtiesList, setSpecialtiesList] = React.useState<string[]>([]);

    React.useEffect(() => {
        async function fetchGuides() {
            setIsLoading(true);
            try {
                const { data: guidesData, error: guidesError } = await supabase.from('guides').select('*');

                if (guidesError) {
                    console.error("Failed to fetch guides:", guidesError);
                    return; 
                }

                if (guidesData) {
                    const guidesWithRatings = await Promise.all(
                        guidesData.map(async (guide) => {
                            try {
                                const { rating, reviews } = await getGuideRating(guide.id);
                                return { ...guide, rating, reviews } as Guide;
                            } catch (ratingError) {
                                console.error(`Failed to process rating for guide ${guide.id}:`, ratingError);
                                return { ...guide, rating: 0, reviews: 0 } as Guide;
                            }
                        })
                    );
                    
                    const allSpecialties = [...new Set(guidesWithRatings.flatMap(g => g.specialties || []))];
                    setSpecialtiesList(allSpecialties);

                    setAllGuides(guidesWithRatings);
                    setFilteredGuides(guidesWithRatings);
                }
            } catch (error) {
                console.error("An unexpected error occurred while fetching guides:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchGuides();
    }, []);

    const handleSearch = () => {
        let guides = [...allGuides];
        
        if (specialty) {
            guides = guides.filter(g => g.specialties?.includes(specialty));
        }

        if(startDate && endDate) {
            guides = guides.filter(guide => {
                if(!guide.availability || guide.availability.length === 0) return false;
                const availableDates = new Set(guide.availability);
                
                let currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    if (availableDates.has(toYYYYMMDD(currentDate))) {
                        return true;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                return false;
            });
        }
        
        setFilteredGuides(guides);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Encuentra a tu Guía Perfecto</CardTitle>
                    <CardDescription>Filtra guías por disponibilidad y especialidad para encontrar lo que necesitas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        
                        <Select onValueChange={setSpecialty} value={specialty}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una especialidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todas las especialidades</SelectItem>
                                {specialtiesList.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                            </SelectContent>
                        </Select>

                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSearch} className="bg-accent text-accent-foreground hover:bg-accent/90">Buscar Guías</Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? <p>Cargando guías...</p> : filteredGuides.map(guide => (
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
                            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                                <User className="mr-2 h-4 w-4" />
                                Ver Perfil y Ofertar
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            {!isLoading && filteredGuides.length === 0 && (
                <Card className="col-span-full text-center p-8">
                    <CardTitle>No se encontraron guías</CardTitle>
                    <CardDescription>Prueba con otros filtros de búsqueda.</CardDescription>
                </Card>
            )}
        </div>
    );
}
