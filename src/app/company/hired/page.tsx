
"use client"
import React from "react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History } from "lucide-react";
import { StarRatingDisplay } from "@/components/star-rating";

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

type GuideInfo = {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    specialties: string[] | null;
    languages: string[] | null;
    phone: string | null;
    summary: string | null;
    rate: number | null;
    rating?: number;
    reviews?: number;
}

type GuideStatus = {
    id: string; // commitment or offer id
    status: 'Aceptado' | 'Pendiente';
    guide: GuideInfo;
    job_type: string | null;
    start_date: string;
    end_date: string;
}

function GuideProfileDialog({ guide, isOpen, onOpenChange }: { guide: GuideInfo, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
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
                    {guide.rate && (
                        <div>
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

export default function HiredGuidesPage() {
    const { toast } = useToast();
    const [guidesList, setGuidesList] = React.useState<GuideStatus[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedGuide, setSelectedGuide] = React.useState<GuideInfo | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchGuides = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const today = new Date().toISOString().split('T')[0];

                const [commitmentsRes, offersRes] = await Promise.all([
                    supabase.from('commitments').select('id, job_type, start_date, end_date, guide:guides(*)').eq('company_id', user.id).gte('end_date', today),
                    supabase.from('offers').select('id, job_type, start_date, end_date, guide:guides(*)').eq('company_id', user.id).eq('status', 'pending').gte('end_date', today)
                ]);
                
                const { data: commitmentsData, error: commitmentsError } = commitmentsRes;
                if (commitmentsError) throw new Error(`Error al cargar contrataciones: ${commitmentsError.message}`);
                
                const { data: offersData, error: offersError } = offersRes;
                if (offersError) throw new Error(`Error al cargar ofertas: ${offersError.message}`);

                const acceptedGuides: GuideStatus[] = await Promise.all((commitmentsData || []).map(async item => {
                    const guide = item.guide as GuideInfo;
                    const { rating, reviews } = await getGuideRating(guide.id);
                    return {
                        id: item.id.toString(),
                        status: 'Aceptado',
                        job_type: item.job_type,
                        start_date: item.start_date,
                        end_date: item.end_date,
                        guide: { ...guide, rating, reviews },
                    };
                }));

                const pendingGuides: GuideStatus[] = await Promise.all((offersData || []).map(async item => {
                    const guide = item.guide as GuideInfo;
                    const { rating, reviews } = await getGuideRating(guide.id);
                    return {
                        id: item.id.toString(),
                        status: 'Pendiente',
                        job_type: item.job_type,
                        start_date: item.start_date,
                        end_date: item.end_date,
                        guide: { ...guide, rating, reviews },
                    };
                }));

                setGuidesList([...acceptedGuides, ...pendingGuides].sort((a,b) => new Date(a.start_date.replace(/-/g, '/')).getTime() - new Date(b.start_date.replace(/-/g, '/')).getTime()));

            } catch (error) {
                console.error(error);
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                toast({ title: "Error", description: `No se pudieron cargar los datos: ${errorMessage}`, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchGuides();
    }, [supabase, toast]);
    
    const handleViewProfile = (guide: GuideInfo) => {
        setSelectedGuide(guide);
        setIsProfileDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Gestión de Guías</CardTitle>
                    <CardDescription>Revisa el estado de tus ofertas y gestiona a los guías que has contratado.</CardDescription>
                </div>
                <Link href="/company/hired/history" passHref>
                    <Button variant="outline">
                        <History className="mr-2 h-4 w-4" />
                        Ver Historial
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guía</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Trabajo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : guidesList.map(item => (
                            <TableRow key={`${item.status}-${item.id}`}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={item.guide.avatar ?? ''} alt={item.guide.name ?? ''} />
                                            <AvatarFallback>{item.guide.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{item.guide.name}</div>
                                            {item.status === 'Aceptado' && item.guide.phone && (
                                                <div className="text-sm text-muted-foreground">{item.guide.phone}</div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(item.start_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })} - {format(new Date(item.end_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>{item.job_type}</TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'Aceptado' ? 'default' : 'outline'}>{item.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.status === 'Aceptado' && (
                                        <Button variant="outline" size="sm" onClick={() => handleViewProfile(item.guide)}>Ver Perfil</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoading && guidesList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No tienes ofertas pendientes ni guías contratados para fechas futuras.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
            {selectedGuide && <GuideProfileDialog guide={selectedGuide} isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />}
        </Card>
    );
}
