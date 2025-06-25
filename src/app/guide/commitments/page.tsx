"use client"
import React from 'react';
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
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { RateEntity } from '@/components/star-rating';
import { Commitment } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ID del guía logueado (hardcodeado para el ejemplo)
const LOGGED_IN_GUIDE_ID = "guide1";

export default function CommitmentsPage() {
    const { toast } = useToast();
    const [commitments, setCommitments] = React.useState<Commitment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchCommitments = React.useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('commitments')
            .select(`
                id,
                job_type,
                start_date,
                end_date,
                guide_rating,
                company_rating,
                company:companies (
                    id,
                    name,
                    email
                )
            `)
            .eq('guide_id', LOGGED_IN_GUIDE_ID);
        
        if (data) {
            const transformedData = data.map(c => ({
                ...c,
                startDate: new Date(c.start_date!),
                endDate: new Date(c.end_date!),
            })) as unknown as Commitment[];
            setCommitments(transformedData);
        } else {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar los compromisos.", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);

    React.useEffect(() => {
        fetchCommitments();
    }, [fetchCommitments]);

    const handleRateCompany = async (commitmentId: string, rating: number) => {
        const { error } = await supabase
            .from('commitments')
            .update({ company_rating: rating })
            .eq('id', commitmentId);

        if (error) {
            toast({ title: "Error", description: "No se pudo guardar la calificación.", variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Calificación guardada correctamente." });
            fetchCommitments(); // Recargar datos para mostrar la nueva calificación
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mis Compromisos</CardTitle>
                <CardDescription>Una lista de todos tus trabajos programados, pasados y futuros.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Trabajo</TableHead>
                            <TableHead className="text-right">Estado/Calificación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : commitments.map((commitment) => (
                            <TableRow key={commitment.id}>
                                <TableCell>
                                    <div className="font-medium">{commitment.company.name}</div>
                                    <div className="text-sm text-muted-foreground">{commitment.company.email}</div>
                                </TableCell>
                                <TableCell>
                                    {format(commitment.startDate, "d MMM, yyyy", { locale: es })} - {format(commitment.endDate, "d MMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="default" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">{commitment.job_type}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {isPast(commitment.endDate) ? (
                                        <RateEntity 
                                            entityName={commitment.company.name} 
                                            currentRating={commitment.company_rating ?? undefined}
                                            onSave={(rating) => handleRateCompany(commitment.id, rating)}
                                        />
                                    ) : (
                                        <Badge variant="outline">Próximo</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoading && commitments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No tienes compromisos próximos.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
