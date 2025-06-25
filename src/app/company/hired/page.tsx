
"use client"
import React from "react";
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
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { RateEntity } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
}

type GuideStatus = {
    id: string; // commitment or offer id
    status: 'Aceptado' | 'Pendiente';
    guide: GuideInfo;
    job_type: string | null;
    start_date: string;
    end_date: string;
    guide_rating?: number | null;
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
                    <div>
                        <DialogTitle className="text-2xl">{guide.name}</DialogTitle>
                        <DialogDescription>
                            {guide.email} {guide.phone && `• ${guide.phone}`}
                        </DialogDescription>
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
    const supabase = createClient();
    const [guidesList, setGuidesList] = React.useState<GuideStatus[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedGuide, setSelectedGuide] = React.useState<GuideInfo | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

    const fetchGuides = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const [commitmentsRes, offersRes] = await Promise.all([
                supabase.from('commitments').select('id, job_type, start_date, end_date, guide_rating, guide:guides(*)').eq('company_id', user.id),
                supabase.from('offers').select('id, job_type, start_date, end_date, guide:guides(*)').eq('company_id', user.id).eq('status', 'pending')
            ]);
            
            const { data: commitmentsData, error: commitmentsError } = commitmentsRes;
            if (commitmentsError) throw new Error(`Error al cargar contrataciones: ${commitmentsError.message}`);
            
            const { data: offersData, error: offersError } = offersRes;
            if (offersError) throw new Error(`Error al cargar ofertas: ${offersError.message}`);

            const acceptedGuides: GuideStatus[] = (commitmentsData || []).map(item => ({
                id: item.id.toString(),
                status: 'Aceptado',
                job_type: item.job_type,
                start_date: item.start_date,
                end_date: item.end_date,
                guide_rating: item.guide_rating,
                guide: item.guide as GuideInfo,
            }));

            const pendingGuides: GuideStatus[] = (offersData || []).map(item => ({
                id: item.id.toString(),
                status: 'Pendiente',
                job_type: item.job_type,
                start_date: item.start_date,
                end_date: item.end_date,
                guide: item.guide as GuideInfo,
            }));

            setGuidesList([...acceptedGuides, ...pendingGuides]);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({ title: "Error", description: `No se pudieron cargar los datos: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [supabase, toast]);

    React.useEffect(() => {
        fetchGuides();
    }, [fetchGuides]);

    const handleRateGuide = async (commitmentId: string, rating: number) => {
        const { error } = await supabase
            .from('commitments')
            .update({ guide_rating: rating })
            .eq('id', commitmentId);

        if (error) {
            toast({ title: "Error", description: "No se pudo guardar la calificación.", variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Calificación guardada correctamente." });
            fetchGuides(); 
        }
    };
    
    const handleViewProfile = (guide: GuideInfo) => {
        setSelectedGuide(guide);
        setIsProfileDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Guías</CardTitle>
                <CardDescription>Revisa el estado de tus ofertas y gestiona a los guías que has contratado.</CardDescription>
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
                                            <div className="text-sm text-muted-foreground">{item.guide.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(item.start_date), "d MMM, yyyy", { locale: es })} - {format(new Date(item.end_date), "d MMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>{item.job_type}</TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'Aceptado' ? 'default' : 'outline'}>{item.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {item.status === 'Aceptado' && (
                                            <Button variant="outline" size="sm" onClick={() => handleViewProfile(item.guide)}>Ver Perfil</Button>
                                        )}
                                        {item.status === 'Aceptado' && isPast(new Date(item.end_date)) && (
                                            <RateEntity 
                                                entityName={item.guide.name ?? 'Guía'} 
                                                currentRating={item.guide_rating ?? undefined}
                                                onSave={(rating) => handleRateGuide(item.id, rating)}
                                            />
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoading && guidesList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No tienes ofertas pendientes ni guías contratados.
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
