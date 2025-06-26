
"use client"
import React from 'react';
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
import { Button } from "@/components/ui/button";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { History, User as UserIcon, Phone, Smartphone, MapPin } from "lucide-react";
import { RateEntity, StarRatingDisplay } from '@/components/star-rating';
import { Commitment, Company } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

export default function CommitmentsPage() {
    const { toast } = useToast();
    const [commitments, setCommitments] = React.useState<Commitment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

    const fetchCommitments = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('commitments')
            .select(`
                id,
                job_type,
                start_date,
                end_date,
                guide_rating,
                company_rating,
                company:companies(*)
            `)
            .eq('guide_id', user.id)
            .gte('end_date', today)
            .order('start_date', { ascending: true });
        
        if (data) {
            const transformedData = await Promise.all(data.map(async (c) => {
                const company = c.company as Company;
                const { rating, reviews } = await getCompanyRating(company.id);
                return {
                    ...c,
                    startDate: new Date(c.start_date!.replace(/-/g, '/')),
                    endDate: new Date(c.end_date!.replace(/-/g, '/')),
                    company: { ...company, rating, reviews }
                }
            }));
            setCommitments(transformedData as unknown as Commitment[]);
        } else {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar los compromisos.", variant: "destructive" });
        }
        setIsLoading(false);
    }, [supabase, toast]);

    React.useEffect(() => {
        fetchCommitments();
    }, [fetchCommitments]);

    const handleRateCompany = async (commitmentId: number, rating: number) => {
        const { error } = await supabase
            .from('commitments')
            .update({ company_rating: rating })
            .eq('id', commitmentId);

        if (error) {
            toast({ title: "Error", description: "No se pudo guardar la calificación.", variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Calificación guardada correctamente." });
            fetchCommitments();
        }
    };
    
    const handleViewProfile = (company: Company) => {
        setSelectedCompany(company);
        setIsProfileDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Mis Compromisos Próximos</CardTitle>
                    <CardDescription>Una lista de todos tus trabajos programados y futuros.</CardDescription>
                </div>
                 <Link href="/guide/commitments/history" passHref>
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
                            <TableHead>Empresa</TableHead>
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
                                <TableCell>
                                    {isPast(commitment.endDate) ? (
                                        <Badge variant="outline">Finalizado</Badge>
                                    ) : (
                                        <Badge variant="outline">Próximo</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {isPast(commitment.endDate) ? (
                                            <RateEntity 
                                                entityName={commitment.company.name} 
                                                currentRating={commitment.company_rating ?? undefined}
                                                onSave={(rating) => handleRateCompany(commitment.id, rating)}
                                            />
                                        ) : null}
                                        <Button variant="outline" size="sm" onClick={() => handleViewProfile(commitment.company as Company)}>
                                            Ver Perfil
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoading && commitments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No tienes compromisos próximos.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
            {selectedCompany && <CompanyProfileDialog company={selectedCompany} isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />}
        </Card>
    );
}
