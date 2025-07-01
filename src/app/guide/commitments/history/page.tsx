
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { RateEntity, StarRatingDisplay } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, User as UserIcon, Phone, Smartphone, MapPin, PhoneCall } from "lucide-react";
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

type OfferDetails = {
    description: string | null;
    contact_person: string | null;
    contact_phone: string | null;
};

type CommitmentHistory = {
    id: number;
    job_type: string | null;
    start_date: string;
    end_date: string;
    company_rating: number | null;
    offer_id: number | null;
    company: Company;
    offer?: OfferDetails | null;
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

function CommitmentDetailsDialog({ commitment, isOpen, onOpenChange }: { commitment: CommitmentHistory, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!commitment) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{commitment.job_type}</DialogTitle>
                    <DialogDescription>
                        Para la empresa: {commitment.company.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Fechas</h4>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(commitment.start_date.replace(/-/g, '/')), "d 'de' MMMM, yyyy", { locale: es })} - {format(new Date(commitment.end_date.replace(/-/g, '/')), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    </div>
                    {commitment.offer?.description && (
                         <div>
                            <h4 className="font-semibold text-sm mb-2">Descripción del Trabajo</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{commitment.offer.description}</p>
                        </div>
                    )}
                     {(commitment.offer?.contact_person || commitment.offer?.contact_phone) && (
                        <div className="border-t pt-4 space-y-3">
                            <h4 className="font-semibold text-sm mb-2">Información de Contacto</h4>
                            {commitment.offer.contact_person && (
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{commitment.offer.contact_person}</span>
                                </div>
                            )}
                            {commitment.offer.contact_phone && (
                                <div className="flex items-center gap-3">
                                    <PhoneCall className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{commitment.offer.contact_phone}</span>
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
    const [guideRate, setGuideRate] = React.useState(0);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
    const [selectedCommitment, setSelectedCommitment] = React.useState<CommitmentHistory | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);

    const fetchHistory = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const { data: guideData } = await supabase.from('guides').select('rate').eq('id', user.id).single();
            setGuideRate(guideData?.rate ?? 0);
            
            const today = new Date().toISOString().split('T')[0];
            const { data: commitmentsData, error } = await supabase
                .from('commitments')
                .select(`id, job_type, start_date, end_date, company_rating, offer_id, company:companies(*)`)
                .eq('guide_id', user.id)
                .lt('end_date', today)
                .order('start_date', { ascending: false });

            if (error) throw error;
            if (!commitmentsData) {
                setHistory([]);
                setIsLoading(false);
                return;
            }

            const offerIds = commitmentsData.map(c => c.offer_id).filter((id): id is number => id !== null);
            const offersMap = new Map<number, OfferDetails>();

            if (offerIds.length > 0) {
                const { data: offersData } = await supabase
                    .from('offers')
                    .select('id, description, contact_person, contact_phone')
                    .in('id', offerIds);
                
                if (offersData) {
                    offersData.forEach(o => offersMap.set(o.id, o));
                }
            }
            
            const transformedData = await Promise.all(commitmentsData.map(async (c) => {
                const company = c.company as Company;
                const { rating, reviews } = await getCompanyRating(company.id);
                const offerDetails = c.offer_id ? offersMap.get(c.offer_id) : null;
                return {
                    ...c,
                    company: { ...company, rating, reviews },
                    offer: offerDetails,
                }
            }));
            setHistory(transformedData as CommitmentHistory[]);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({ title: "Error", description: `No se pudo cargar el historial: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    const handleRateCompany = async (commitmentId: number, rating: number, comment: string) => {
        const updateData: { company_rating: number, company_rating_comment?: string } = { company_rating: rating };
        if (comment) {
            updateData.company_rating_comment = comment;
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
    
    const handleViewProfile = (company: Company) => {
        setSelectedCompany(company);
        setIsProfileDialogOpen(true);
    };

    const handleViewDetails = (commitment: CommitmentHistory) => {
        setSelectedCommitment(commitment);
        setIsDetailsDialogOpen(true);
    };

    const handleExport = () => {
        const dataToExport = history.map(item => {
            const days = differenceInDays(new Date(item.end_date.replace(/-/g, '/')), new Date(item.start_date.replace(/-/g, '/'))) + 1;
            const totalPay = days * guideRate;
            return {
                'Empresa': item.company.name,
                'Email Empresa': item.company.email,
                'Trabajo': item.job_type,
                'Fecha Inicio': format(new Date(item.start_date.replace(/-/g, '/')), "yyyy-MM-dd"),
                'Fecha Fin': format(new Date(item.end_date.replace(/-/g, '/')), "yyyy-MM-dd"),
                'Calificación': item.company_rating || 'N/A',
                'Total Pagado': totalPay.toLocaleString('es-CL'),
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
        XLSX.writeFile(workbook, "historial_compromisos.xlsx");
    };

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-muted-foreground py-8">Cargando historial...</p>;
        }

        if (history.length === 0) {
            return <p className="text-center text-muted-foreground py-8">No tienes trabajos históricos.</p>;
        }

        return (
            <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {history.map(item => {
                        const days = differenceInDays(new Date(item.end_date.replace(/-/g, '/')), new Date(item.start_date.replace(/-/g, '/'))) + 1;
                        const totalPay = days * guideRate;
                        return(
                        <Card key={item.id}>
                            <CardHeader>
                                <button onClick={() => handleViewProfile(item.company)} className="p-0 m-0 border-0 bg-transparent text-left cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                                    <CardTitle className="text-base pointer-events-none">{item.company.name}</CardTitle>
                                </button>
                                <CardDescription>{item.company.email}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <button onClick={() => handleViewDetails(item)} className="w-full p-0 m-0 border-0 bg-transparent text-left cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                                    <Badge variant="secondary" className="w-full justify-center pointer-events-none">{item.job_type}</Badge>
                                </button>
                                <div>
                                    <span className="font-semibold">Fechas: </span>
                                    {format(new Date(item.start_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })} - {format(new Date(item.end_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })}
                                </div>
                                <div>
                                    <span className="font-semibold">Total Pagado: </span>
                                    ${totalPay.toLocaleString('es-CL')}
                                </div>
                                <div className="border-t pt-4">
                                     <RateEntity
                                        entityName={item.company.name ?? 'Empresa'}
                                        currentRating={item.company_rating ?? undefined}
                                        onSave={(rating, comment) => handleRateCompany(item.id, rating, comment)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )})}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Fechas</TableHead>
                                <TableHead>Trabajo</TableHead>
                                <TableHead className="text-right">Calificación</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map(item => {
                                const days = differenceInDays(new Date(item.end_date.replace(/-/g, '/')), new Date(item.start_date.replace(/-/g, '/'))) + 1;
                                const totalPay = days * guideRate;
                                return (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <button onClick={() => handleViewProfile(item.company)} className="p-0 m-0 border-0 bg-transparent text-left cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                                            <div className="font-medium pointer-events-none">{item.company.name}</div>
                                            <div className="text-sm text-muted-foreground pointer-events-none">{item.company.email}</div>
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(item.start_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })} - {format(new Date(item.end_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <button onClick={() => handleViewDetails(item)} className="p-0 m-0 border-0 bg-transparent text-left cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                                            <Badge variant="secondary" className="pointer-events-none">{item.job_type}</Badge>
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            <RateEntity
                                                entityName={item.company.name ?? 'Empresa'}
                                                currentRating={item.company_rating ?? undefined}
                                                onSave={(rating, comment) => handleRateCompany(item.id, rating, comment)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${totalPay.toLocaleString('es-CL')}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            </>
        );
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Historial de Compromisos</CardTitle>
                        <CardDescription>Revisa y califica tus trabajos pasados.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto pt-4 sm:pt-0">
                        <Button variant="outline" asChild>
                            <Link href="/guide/commitments">
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
             {selectedCommitment && <CommitmentDetailsDialog commitment={selectedCommitment} isOpen={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} />}
             {selectedCompany && <CompanyProfileDialog company={selectedCompany} isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />}
        </>
    );
}

