
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

type JobGroup = {
    job_type: string | null;
    start_date: string;
    end_date: string;
    guides: CommitmentHistory[];
}

export default function HiredHistoryPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [history, setHistory] = React.useState<CommitmentHistory[]>([]);
    const [groupedHistory, setGroupedHistory] = React.useState<JobGroup[]>([]);
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
                .select('id, job_type, start_date, end_date, guide_rating, guide:guides(id, name, email, phone, avatar)')
                .eq('company_id', user.id)
                .lt('end_date', today)
                .order('start_date', { ascending: false });

            if (error) throw error;

            if (data) {
                const historyData = data as CommitmentHistory[];
                setHistory(historyData);

                const grouped = historyData.reduce((acc, item) => {
                    const key = `${item.job_type}-${item.start_date}-${item.end_date}`;
                    if (!acc[key]) {
                        acc[key] = {
                            job_type: item.job_type,
                            start_date: item.start_date,
                            end_date: item.end_date,
                            guides: [],
                        };
                    }
                    acc[key].guides.push(item);
                    return acc;
                }, {} as Record<string, JobGroup>);

                setGroupedHistory(Object.values(grouped));
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

    const handleRateGuide = async (commitmentId: string, rating: number, comment: string) => {
        const updateData: { guide_rating: number, guide_rating_comment?: string } = { guide_rating: rating };
        if (comment) {
            updateData.guide_rating_comment = comment;
        }

        const { error } = await supabase
            .from('commitments')
            .update(updateData)
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
            'Fecha Inicio': format(new Date(item.start_date.replace(/-/g, '/')), "yyyy-MM-dd"),
            'Fecha Fin': format(new Date(item.end_date.replace(/-/g, '/')), "yyyy-MM-dd"),
            'Calificación': item.guide_rating || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
        XLSX.writeFile(workbook, "historial_guias_contratados.xlsx");
    };
    
    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-muted-foreground py-8">Cargando historial...</p>;
        }

        if (groupedHistory.length === 0) {
            return <p className="text-center text-muted-foreground py-8">No tienes trabajos históricos.</p>;
        }

        return (
            <Accordion type="single" collapsible className="w-full">
                {groupedHistory.map((job, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                            <div className="flex flex-col sm:flex-row sm:items-center text-left sm:gap-4">
                                <span className="font-semibold text-base">{job.job_type || 'Trabajo sin título'}</span>
                                <span className="text-sm text-muted-foreground">
                                    {format(new Date(job.start_date.replace(/-/g, '/')), "d MMM yyyy", { locale: es })} - {format(new Date(job.end_date.replace(/-/g, '/')), "d MMM yyyy", { locale: es })}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                             <div className="md:hidden space-y-4">
                                {job.guides.map(item => (
                                    <Card key={item.id}>
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <Avatar className="w-12 h-12">
                                                <AvatarImage src={item.guide.avatar ?? ''} alt={item.guide.name ?? ''} />
                                                <AvatarFallback>{item.guide.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{item.guide.name}</CardTitle>
                                                <CardDescription>{item.guide.phone || 'Teléfono no proporcionado'}</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <RateEntity
                                                entityName={item.guide.name ?? 'Guía'}
                                                currentRating={item.guide_rating ?? undefined}
                                                onSave={(rating, comment) => handleRateGuide(item.id, rating, comment)}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Guía</TableHead>
                                            <TableHead className="text-right">Calificación</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {job.guides.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-4">
                                                        <Avatar>
                                                            <AvatarImage src={item.guide.avatar ?? ''} alt={item.guide.name ?? ''} />
                                                            <AvatarFallback>{item.guide.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{item.guide.name}</div>
                                                            <div className="text-sm text-muted-foreground">{item.guide.phone || 'Teléfono no proporcionado'}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <RateEntity
                                                        entityName={item.guide.name ?? 'Guía'}
                                                        currentRating={item.guide_rating ?? undefined}
                                                        onSave={(rating, comment) => handleRateGuide(item.id, rating, comment)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Historial de Guías Contratados</CardTitle>
                    <CardDescription>Revisa y califica los trabajos pasados, agrupados por evento.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto pt-4 sm:pt-0">
                    <Button variant="outline" asChild>
                        <Link href="/company/offers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                    <Button onClick={handleExport} disabled={history.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
