
"use client"
import React from "react";
import Link from "next/link";
import * as XLSX from 'xlsx';
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RateEntity } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { Commitment } from '@/lib/types';

type CommitmentHistory = Omit<Commitment, 'startDate' | 'endDate' | 'id'> & {
    id: number;
    start_date: string;
    end_date: string;
}

export default function CommitmentsHistoryPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [history, setHistory] = React.useState<CommitmentHistory[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchHistory = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('commitments')
                .select(`
                    id,
                    job_type,
                    start_date,
                    end_date,
                    company_rating,
                    company:companies (
                        id,
                        name,
                        email
                    )
                `)
                .eq('guide_id', user.id)
                .lt('end_date', today)
                .order('start_date', { ascending: false });

            if (error) throw error;

            if (data) {
                setHistory(data as CommitmentHistory[]);
            }

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({ title: "Error", description: `No se pudo cargar el historial: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [supabase, toast]);

    React.useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    const handleRateCompany = async (commitmentId: number, rating: number) => {
        const { error } = await supabase
            .from('commitments')
            .update({ company_rating: rating })
            .eq('id', commitmentId);

        if (error) {
            toast({ title: "Error", description: "No se pudo guardar la calificación.", variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Calificación guardada correctamente." });
            fetchHistory();
        }
    };

    const handleExport = () => {
        const dataToExport = history.map(item => ({
            'Empresa': item.company.name,
            'Email Empresa': item.company.email,
            'Trabajo': item.job_type,
            'Fecha Inicio': format(new Date(item.start_date.replace(/-/g, '/')), "yyyy-MM-dd"),
            'Fecha Fin': format(new Date(item.end_date.replace(/-/g, '/')), "yyyy-MM-dd"),
            'Calificación': item.company_rating || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
        XLSX.writeFile(workbook, "historial_compromisos.xlsx");
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Historial de Compromisos</CardTitle>
                    <CardDescription>Revisa y califica tus trabajos pasados.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/guide/commitments">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                    <Button onClick={handleExport} disabled={history.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Trabajo</TableHead>
                            <TableHead className="text-right">Calificación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Cargando historial...</TableCell>
                            </TableRow>
                        ) : history.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-medium">{item.company.name}</div>
                                    <div className="text-sm text-muted-foreground">{item.company.email}</div>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(item.start_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })} - {format(new Date(item.end_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell><Badge variant="secondary">{item.job_type}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <RateEntity
                                        entityName={item.company.name ?? 'Empresa'}
                                        currentRating={item.company_rating ?? undefined}
                                        onSave={(rating) => handleRateCompany(item.id, rating)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoading && history.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No tienes trabajos históricos.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
