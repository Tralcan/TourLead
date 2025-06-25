
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RateEntity } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";

type GuideInfo = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatar: string | null;
}

type CommitmentHistory = {
    id: string;
    guide: GuideInfo;
    job_type: string | null;
    start_date: string;
    end_date: string;
    guide_rating?: number | null;
}

export default function HiredHistoryPage() {
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
            const today = new Date().toISOString();
            const { data, error } = await supabase
                .from('commitments')
                .select('id, job_type, start_date, end_date, guide_rating, guide:guides(id, name, email, phone, avatar)')
                .eq('company_id', user.id)
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

    const handleRateGuide = async (commitmentId: string, rating: number) => {
        const { error } = await supabase
            .from('commitments')
            .update({ guide_rating: rating })
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
            'Nombre Guía': item.guide.name,
            'Email Guía': item.guide.email,
            'Teléfono Guía': item.guide.phone,
            'Trabajo': item.job_type,
            'Fecha Inicio': format(new Date(item.start_date), "yyyy-MM-dd"),
            'Fecha Fin': format(new Date(item.end_date), "yyyy-MM-dd"),
            'Calificación': item.guide_rating || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
        XLSX.writeFile(workbook, "historial_guias_contratados.xlsx");
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Historial de Guías Contratados</CardTitle>
                    <CardDescription>Revisa y califica los trabajos pasados.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/company/hired">
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
                            <TableHead>Guía</TableHead>
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
                                <TableCell><Badge variant="secondary">{item.job_type}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <RateEntity
                                        entityName={item.guide.name ?? 'Guía'}
                                        currentRating={item.guide_rating ?? undefined}
                                        onSave={(rating) => handleRateGuide(item.id, rating)}
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
