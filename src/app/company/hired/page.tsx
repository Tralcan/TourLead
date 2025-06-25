
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

type HiredGuide = {
    id: string;
    guide: {
        id: string;
        name: string | null;
        email: string | null;
        avatar: string | null;
        specialties: string[] | null;
    };
    job_type: string | null;
    start_date: string;
    end_date: string;
    guide_rating?: number | null;
}

export default function HiredGuidesPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [hiredGuides, setHiredGuides] = React.useState<HiredGuide[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchHiredGuides = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('commitments')
            .select(`
                id,
                job_type,
                start_date,
                end_date,
                guide_rating,
                guide:guides (
                    id,
                    name,
                    email,
                    avatar,
                    specialties
                )
            `)
            .eq('company_id', user.id);

        if (data) {
            setHiredGuides(data as HiredGuide[]);
        } else {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar los guías contratados.", variant: "destructive" });
        }
        setIsLoading(false);
    }, [supabase, toast]);

    React.useEffect(() => {
        fetchHiredGuides();
    }, [fetchHiredGuides]);

    const handleRateGuide = async (commitmentId: string, rating: number) => {
        const { error } = await supabase
            .from('commitments')
            .update({ guide_rating: rating })
            .eq('id', commitmentId);

        if (error) {
            toast({ title: "Error", description: "No se pudo guardar la calificación.", variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Calificación guardada correctamente." });
            fetchHiredGuides(); 
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tus Guías Contratados</CardTitle>
                <CardDescription>Una lista de todos los guías turísticos contratados por tu empresa, pasados y futuros.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guía</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Trabajo</TableHead>
                            <TableHead>Especialidades</TableHead>
                            <TableHead className="text-right">Estado/Calificación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : hiredGuides.map(commitment => (
                            <TableRow key={commitment.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={commitment.guide.avatar ?? ''} alt={commitment.guide.name ?? ''} />
                                            <AvatarFallback>{commitment.guide.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{commitment.guide.name}</div>
                                            <div className="text-sm text-muted-foreground">{commitment.guide.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(commitment.start_date), "d MMM, yyyy", { locale: es })} - {format(new Date(commitment.end_date), "d MMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>{commitment.job_type}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {commitment.guide.specialties?.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {isPast(new Date(commitment.end_date)) ? (
                                        <RateEntity 
                                            entityName={commitment.guide.name ?? 'Guía'} 
                                            currentRating={commitment.guide_rating ?? undefined}
                                            onSave={(rating) => handleRateGuide(commitment.id, rating)}
                                        />
                                    ) : (
                                        <Badge variant="outline">Próximo</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoading && hiredGuides.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No has contratado guías.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
