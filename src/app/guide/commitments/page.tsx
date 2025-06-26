
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { History, User as UserIcon, Phone, Smartphone, MapPin, PhoneCall } from "lucide-react";
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

function CommitmentDetailsDialog({ commitment, isOpen, onOpenChange }: { commitment: Commitment, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
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
                            {format(commitment.startDate, "d 'de' MMMM, yyyy", { locale: es })} - {format(commitment.endDate, "d 'de' MMMM, yyyy", { locale: es })}
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

export default function CommitmentsPage() {
    const { toast } = useToast();
    const [commitments, setCommitments] = React.useState<Commitment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
    const [selectedCommitment, setSelectedCommitment] = React.useState<Commitment | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);

    const fetchCommitments = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch commitments
            const { data: commitmentsData, error: commitmentsError } = await supabase
                .from('commitments')
                .select(`
                    id,
                    job_type,
                    start_date,
                    end_date,
                    guide_rating,
                    company_rating,
                    offer_id,
                    company:companies(*)
                `)
                .eq('guide_id', user.id)
                .gte('end_date', today)
                .order('start_date', { ascending: true });

            if (commitmentsError) throw commitmentsError;
            if (!commitmentsData) {
                setCommitments([]);
                setIsLoading(false);
                return;
            }

            // 2. Fetch related offers
            const offerIds = commitmentsData.map(c => c.offer_id).filter((id): id is number => id !== null);
            const offersMap = new Map<number, { description: string | null; contact_person: string | null; contact_phone: string | null; }>();

            if (offerIds.length > 0) {
                const { data: offersData, error: offersError } = await supabase
                    .from('offers')
                    .select('id, description, contact_person, contact_phone')
                    .in('id', offerIds);
                
                if (offersError) throw offersError;
                if (offersData) {
                    offersData.forEach(o => offersMap.set(o.id, { 
                        description: o.description,
                        contact_person: o.contact_person,
                        contact_phone: o.contact_phone
                     }));
                }
            }
            
            // 3. Combine data
            const transformedData = await Promise.all(commitmentsData.map(async (c) => {
                if (!c.company) {
                    console.warn(`El compromiso con id ${c.id} no tiene una empresa asociada o no se pudo cargar.`);
                    return null;
                }
                
                const company = c.company as Company;
                const { rating, reviews } = await getCompanyRating(company.id);
                const offerDetails = c.offer_id ? offersMap.get(c.offer_id) : null;

                return {
                    ...c,
                    startDate: new Date(c.start_date!.replace(/-/g, '/')),
                    endDate: new Date(c.end_date!.replace(/-/g, '/')),
                    company: { ...company, rating, reviews },
                    offer: offerDetails,
                };
            }));
            setCommitments(transformedData.filter(Boolean) as unknown as Commitment[]);

        } catch (error) {
            console.error("Error al cargar compromisos:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({ 
                title: "Error", 
                description: `No se pudieron cargar los compromisos: ${errorMessage}`, 
                variant: "destructive" 
            });
        } finally {
            setIsLoading(false);
        }
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

    const handleViewDetails = (commitment: Commitment) => {
        setSelectedCommitment(commitment);
        setIsDetailsDialogOpen(true);
    };

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-muted-foreground py-8">Cargando...</p>;
        }

        if (commitments.length === 0) {
            return <p className="text-center text-muted-foreground py-8">No tienes compromisos próximos.</p>;
        }

        return (
            <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {commitments.map((commitment) => (
                        <Card key={commitment.id}>
                            <CardHeader>
                                <CardTitle className="text-base">{commitment.company.name}</CardTitle>
                                <CardDescription>{commitment.offer?.contact_phone || 'Teléfono no disponible'}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <button onClick={() => handleViewDetails(commitment)} className="w-full p-0 m-0 border-0 bg-transparent text-left cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                                    <Badge variant="default" className="w-full justify-center bg-primary/20 text-primary-foreground hover:bg-primary/30 pointer-events-none">{commitment.job_type}</Badge>
                                </button>
                                <div>
                                    <span className="font-semibold">Fechas: </span>
                                    {format(commitment.startDate, "d MMM, yyyy", { locale: es })} - {format(commitment.endDate, "d MMM, yyyy", { locale: es })}
                                </div>
                                <div>
                                    <span className="font-semibold">Estado: </span>
                                     {isPast(commitment.endDate) ? (
                                        <Badge variant="outline">Finalizado</Badge>
                                    ) : (
                                        <Badge variant="outline">Próximo</Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col items-center gap-2">
                                {isPast(commitment.endDate) && (
                                    <RateEntity 
                                        entityName={commitment.company.name} 
                                        currentRating={commitment.company_rating ?? undefined}
                                        onSave={(rating) => handleRateCompany(commitment.id, rating)}
                                    />
                                )}
                                <Button variant="outline" size="sm" onClick={() => handleViewProfile(commitment.company as Company)} className="w-full">
                                    Ver Perfil de Empresa
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
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
                            {commitments.map((commitment) => (
                                <TableRow key={commitment.id}>
                                    <TableCell>
                                        <div className="font-medium">{commitment.company.name}</div>
                                        <div className="text-sm text-muted-foreground">{commitment.offer?.contact_phone || 'Teléfono no disponible'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {format(commitment.startDate, "d MMM, yyyy", { locale: es })} - {format(commitment.endDate, "d MMM, yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <button onClick={() => handleViewDetails(commitment)} className="p-0 m-0 border-0 bg-transparent text-left cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                                            <Badge variant="default" className="bg-primary/20 text-primary-foreground hover:bg-primary/30 pointer-events-none">{commitment.job_type}</Badge>
                                        </button>
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
                        </TableBody>
                    </Table>
                </div>
            </>
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Mis Compromisos Próximos</CardTitle>
                    <CardDescription>Una lista de todos tus trabajos programados y futuros.</CardDescription>
                </div>
                 <Link href="/guide/commitments/history" passHref>
                    <Button variant="outline" className="mt-4 sm:mt-0 w-full sm:w-auto">
                        <History className="mr-2 h-4 w-4" />
                        Ver Historial
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
            {selectedCommitment && <CommitmentDetailsDialog commitment={selectedCommitment} isOpen={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} />}
            {selectedCompany && <CompanyProfileDialog company={selectedCompany} isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />}
        </Card>
    );
}
