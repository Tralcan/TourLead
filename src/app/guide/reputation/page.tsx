
"use client";

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
import { StarRatingDisplay } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, UserCheck, User as UserIcon, Phone, Smartphone, MapPin } from "lucide-react";
import type { Company } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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


type ReputationData = {
    job_type: string | null;
    guide_rating: number | null;
    company: Company | null;
    end_date: string;
};


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

export default function ReputationPage() {
    const { toast } = useToast();
    const [reputationData, setReputationData] = React.useState<ReputationData[]>([]);
    const [averageRating, setAverageRating] = React.useState(0);
    const [totalReviews, setTotalReviews] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchReputation = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('commitments')
                    .select('job_type, guide_rating, company_rating, end_date, company:companies(*)')
                    .eq('guide_id', user.id)
                    .not('guide_rating', 'is', null)
                    .order('end_date', { ascending: false });

                if (error) throw error;

                if (data) {
                    const ratedCommitments = data.filter(c => c.guide_rating !== null);
                    const totalRating = ratedCommitments.reduce((acc, curr) => acc + (curr.guide_rating || 0), 0);
                    const avgRating = ratedCommitments.length > 0 ? totalRating / ratedCommitments.length : 0;
                    setAverageRating(avgRating);
                    setTotalReviews(ratedCommitments.length);

                    const displayableData = data.filter(c => c.guide_rating !== null && c.company_rating !== null && c.company);
                    const finalData = await Promise.all(displayableData.map(async (item) => {
                        const company = item.company as Company;
                        const { rating, reviews } = await getCompanyRating(company.id);
                        return {
                            ...item,
                            company: { ...company, rating, reviews },
                        };
                    }));
                    setReputationData(finalData as ReputationData[]);
                }
            } catch (error) {
                console.error(error);
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                toast({ title: "Error", description: `No se pudo cargar tu reputación: ${errorMessage}`, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchReputation();
    }, [supabase, toast]);

    const handleViewProfile = (company: Company) => {
        setSelectedCompany(company);
        setIsProfileDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</div>
                         <p className="text-xs text-muted-foreground">
                            De un total de {totalReviews} {totalReviews === 1 ? 'evaluación' : 'evaluaciones'}.
                         </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Evaluaciones Visibles</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reputationData.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Basado en la calificación mútua.
                        </p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Evaluaciones Recibidas</CardTitle>
                    <CardDescription>
                        Aquí solo se muestran las evaluaciones de las empresas a las que tú también has calificado. Para ver una evaluación, asegúrate de calificar a la empresa en la sección de 'Mis Compromisos'.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Trabajo</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Calificación Recibida</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Cargando evaluaciones...</TableCell>
                                </TableRow>
                            ) : reputationData.length > 0 ? (
                                reputationData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        {item.company?.name || 'Empresa Desconocida'}
                                    </TableCell>
                                    <TableCell>{item.job_type || 'No especificado'}</TableCell>
                                    <TableCell>
                                        {format(new Date(item.end_date.replace(/-/g, '/')), "d MMM, yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <StarRatingDisplay rating={item.guide_rating!} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.company && (
                                            <Button variant="outline" size="sm" onClick={() => handleViewProfile(item.company!)}>
                                                Ver Perfil
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No tienes evaluaciones visibles. Califica a una empresa para ver su evaluación.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedCompany && (
                <CompanyProfileDialog
                    company={selectedCompany}
                    isOpen={isProfileDialogOpen}
                    onOpenChange={setIsProfileDialogOpen}
                />
            )}
        </div>
    );
}
