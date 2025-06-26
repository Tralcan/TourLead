
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
import { RateEntity, StarRatingDisplay } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, User as UserIcon, Phone, Smartphone, MapPin } from "lucide-react";
import { Company } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const supabase = createClient();

async function getCompanyRating(companyId: string) {
    const { data, error } = await supabase
        .from('commitments')
        .select('company_rating')
        .eq('company_id', companyId)
        .not('company_rating', 'is', null);

    if (error || !data || data.length === 0) {
        return { rating: 0, reviews: 0 };
    }

    const totalRating = data.reduce((acc, curr) => acc + (curr.company_rating || 0), 0);
    const averageRating = totalRating / data.length;
    return { rating: averageRating, reviews: data.length };
}

type CommitmentHistory = {
    id: number;
    job_type: string | null;
    start_date: string;
    end_date: string;
    company_rating: number | null;
    company: Company;
}

function CompanyProfileDialog({ company, isOpen, onOpenChange }: { company: Company, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!company) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage src={company.avatar ?? ''} alt={company.name ?? ''} />
                        <AvatarFallback>{company.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <DialogTitle className="text-2xl">{company.name}</DialogTitle>
                        <DialogDescription>
                            {company.email}
                        </DialogDescription>
                         <StarRatingDisplay rating={company.rating ?? 0} reviews={company.reviews} />
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {company.details && <p className="text-sm text-muted-foreground">{company.details}</p>}
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Especialidades</h4>
                        <div className="flex flex-wrap gap-2">
                             {company.specialties?.length ? company.specialties.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>) : <p className="text-sm text-muted-foreground">No especificado</p>}
                        </div>
                    </div>
                     {(company.contact_person || company.phone_mobile || company.phone_landline || company.address) && (
                        <div className="border-t pt-4 mt-4 space-y-3">
                            {company.contact_person && (
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{company.contact_person}</span>
                                </div>
                            )}
                            {company.phone_mobile && (
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{company.phone_mobile}</span>
                                </div>
                            )}
                            {company.phone_landline && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{company.phone_landline}</span>
                                </div>
                            )}
                            {company.address && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{company.address}</span>
                                </div>
                            )}
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

export default function CommitmentsHistoryPage() {
    const { toast } = useToast();
    const [history, setHistory] = React.useState<CommitmentHistory[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

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
                    company:companies(*)
                `)
                .eq('guide_id', user.id)
                .lt('end_date', today)
                .order('start_date', { ascending: false });

            if (error) throw error;

            if (data) {
                 const transformedData = await Promise.all(data.map(async (c) => {
                    const company = c.company as Company;
                    const { rating, reviews } = await getCompanyRating(company.id);
                    return {
                        ...c,
                        company: { ...company, rating, reviews }
                    }
                }));
                setHistory(transformedData as CommitmentHistory[]);
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
    
    const handleViewProfile = (company: Company) => {
        setSelectedCompany(company);
        setIsProfileDialogOpen(true);
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
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Cargando historial...</TableCell>
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
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => handleViewProfile(item.company)}>
                                        Ver Perfil
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoading && history.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No tienes trabajos históricos.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
            {selectedCompany && (
                <CompanyProfileDialog
                    company={selectedCompany}
                    isOpen={isProfileDialogOpen}
                    onOpenChange={setIsProfileDialogOpen}
                />
            )}
        </Card>
    );
}
