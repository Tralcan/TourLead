
"use client"
import React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, ShieldCheck, Loader2 } from "lucide-react";
import { StarRatingDisplay } from "@/components/star-rating";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelPendingOffersForJob } from '@/app/actions/offers';

const supabase = createClient();

async function getGuideRating(guideId: string) {
    const { data, error } = await supabase
        .from('commitments')
        .select('guide_rating')
        .eq('guide_id', guideId)
        .not('guide_rating', 'is', null);

    if (error) {
        return { rating: 0, reviews: 0 };
    }
    
    if (!data || data.length === 0) {
        return { rating: 0, reviews: 0 };
    }

    const totalRating = data.reduce((acc, curr) => acc + (curr.guide_rating || 0), 0);
    const averageRating = totalRating / data.length;
    const result = { rating: parseFloat(averageRating.toFixed(1)), reviews: data.length };
    return result;
}

type GuideInfo = {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    specialties: string[] | null;
    languages: string[] | null;
    phone: string | null;
    summary: string | null;
    rate: number | null;
    rating?: number;
    reviews?: number;
    career?: string | null;
    institution?: string | null;
    is_certified?: boolean | null;
}

type GuideStatus = {
    id: string; // commitment or offer id
    status: 'Aceptado' | 'Pendiente';
    guide: GuideInfo;
    job_type: string | null;
    start_date: string;
    end_date: string;
}

type JobGroup = {
    job_type: string | null;
    start_date: string;
    end_date: string;
    guides: GuideStatus[];
    hasPending: boolean;
}

function GuideProfileDialog({ guide, isOpen, onOpenChange }: { guide: GuideInfo, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage src={guide.avatar ?? ''} alt={guide.name ?? ''} />
                        <AvatarFallback>{guide.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <DialogTitle className="text-2xl">{guide.name}</DialogTitle>
                        <DialogDescription>
                            {guide.email} {guide.phone && `• ${guide.phone}`}
                        </DialogDescription>
                        <StarRatingDisplay rating={guide.rating ?? 0} reviews={guide.reviews} />
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {guide.summary && <p className="text-sm text-muted-foreground">{guide.summary}</p>}
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Especialidades</h4>
                        <div className="flex flex-wrap gap-2">
                             {guide.specialties?.length ? guide.specialties.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>) : <p className="text-sm text-muted-foreground">No especificado</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Idiomas</h4>
                         <div className="flex flex-wrap gap-2">
                             {guide.languages?.length ? guide.languages.map(lang => <Badge key={lang} variant="secondary">{lang}</Badge>) : <p className="text-sm text-muted-foreground">No especificado</p>}
                        </div>
                    </div>
                     <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold text-sm mb-2">Información Académica</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            {guide.career && <p><span className="font-medium text-foreground">Carrera:</span> {guide.career}</p>}
                            {guide.institution && <p><span className="font-medium text-foreground">Institución:</span> {guide.institution}</p>}
                            {guide.is_certified && (
                                <div className="flex items-center gap-2 pt-1">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-foreground">Titulado</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {guide.rate && (
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Tarifa por día</h4>
                            <p className="font-semibold">${guide.rate}</p>
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

export default function HiredGuidesPage() {
    const { toast } = useToast();
    const [jobs, setJobs] = React.useState<JobGroup[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedGuide, setSelectedGuide] = React.useState<GuideInfo | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

    const [isCanceling, setIsCanceling] = React.useState(false);
    const [isCancelAlertOpen, setIsCancelAlertOpen] = React.useState(false);
    const [selectedJobForCancel, setSelectedJobForCancel] = React.useState<JobGroup | null>(null);

    const fetchGroupedJobs = React.useCallback(async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            const [commitmentsRes, offersRes] = await Promise.all([
                supabase.from('commitments').select('id, job_type, start_date, end_date, guide:guides(*)').eq('company_id', user.id).gte('end_date', today),
                supabase.from('offers').select('id, job_type, start_date, end_date, guide:guides(*)').eq('company_id', user.id).eq('status', 'pending').gte('end_date', today)
            ]);
            
            if (commitmentsRes.error) throw new Error(`Error al cargar contrataciones: ${commitmentsRes.error.message}`);
            if (offersRes.error) throw new Error(`Error al cargar ofertas: ${offersRes.error.message}`);
            
            const allItems: (GuideStatus)[] = await Promise.all([
                ...(commitmentsRes.data || []).map(async item => {
                    const guide = item.guide as GuideInfo;
                    const { rating, reviews } = await getGuideRating(guide.id);
                    return {
                        id: item.id.toString(), status: 'Aceptado' as const, ...item, guide: { ...guide, rating, reviews },
                    };
                }),
                ...(offersRes.data || []).map(async item => {
                    const guide = item.guide as GuideInfo;
                    const { rating, reviews } = await getGuideRating(guide.id);
                    return {
                        id: item.id.toString(), status: 'Pendiente' as const, ...item, guide: { ...guide, rating, reviews },
                    };
                }),
            ].flat());

            const grouped = allItems.reduce((acc, item) => {
                const key = `${item.job_type}-${item.start_date}-${item.end_date}`;
                if (!acc[key]) {
                    acc[key] = {
                        job_type: item.job_type,
                        start_date: item.start_date,
                        end_date: item.end_date,
                        guides: [],
                        hasPending: false
                    };
                }
                acc[key].guides.push(item);
                if (item.status === 'Pendiente') {
                    acc[key].hasPending = true;
                }
                return acc;
            }, {} as Record<string, JobGroup>);

            const groupedArray = Object.values(grouped).sort((a,b) => new Date(a.start_date.replace(/-/g, '/')).getTime() - new Date(b.start_date.replace(/-/g, '/')).getTime());
            
            setJobs(groupedArray);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({ title: "Error", description: `No se pudieron cargar los datos: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    React.useEffect(() => {
        fetchGroupedJobs();
    }, [fetchGroupedJobs]);

    const handleViewProfile = (guide: GuideInfo) => {
        setSelectedGuide(guide);
        setIsProfileDialogOpen(true);
    };

    const handleOpenCancelDialog = (job: JobGroup) => {
        setSelectedJobForCancel(job);
        setIsCancelAlertOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedJobForCancel) return;
        setIsCanceling(true);

        const result = await cancelPendingOffersForJob({
            jobType: selectedJobForCancel.job_type,
            startDate: selectedJobForCancel.start_date,
            endDate: selectedJobForCancel.end_date,
        });

        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            fetchGroupedJobs(); // Refetch data to update the view
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }

        setIsCanceling(false);
        setIsCancelAlertOpen(false);
        setSelectedJobForCancel(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-muted-foreground py-8">Cargando...</p>;
        }

        if (jobs.length === 0) {
            return (
                <p className="text-center text-muted-foreground py-8">
                    No tienes ofertas pendientes ni guías contratados para fechas futuras.
                </p>
            );
        }

        return (
            <Accordion type="single" collapsible className="w-full">
                {jobs.map((job, index) => (
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
                                    <Card key={`${item.status}-${item.id}`} className="w-full">
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <Avatar className="w-12 h-12">
                                                <AvatarImage src={item.guide.avatar ?? ''} alt={item.guide.name ?? ''} />
                                                <AvatarFallback>{item.guide.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{item.guide.name}</CardTitle>
                                                <CardDescription>
                                                    {item.status === 'Aceptado' && item.guide.phone ? item.guide.phone : 'Contacto no disponible'}
                                                </CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <Badge variant={item.status === 'Aceptado' ? 'default' : 'outline'} className="w-full justify-center">
                                                {item.status}
                                            </Badge>
                                        </CardContent>
                                        {item.status === 'Aceptado' && (
                                            <CardFooter>
                                                <Button variant="outline" size="sm" onClick={() => handleViewProfile(item.guide)} className="w-full">
                                                    Ver Perfil
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                            </div>

                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Guía</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {job.guides.map(item => (
                                            <TableRow key={`${item.status}-${item.id}`}>
                                                <TableCell>
                                                    <div className="flex items-center gap-4">
                                                        <Avatar>
                                                            <AvatarImage src={item.guide.avatar ?? ''} alt={item.guide.name ?? ''} />
                                                            <AvatarFallback>{item.guide.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{item.guide.name}</div>
                                                            {item.status === 'Aceptado' && item.guide.phone && (
                                                                <div className="text-sm text-muted-foreground">{item.guide.phone}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={item.status === 'Aceptado' ? 'default' : 'outline'}>{item.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.status === 'Aceptado' && (
                                                        <Button variant="outline" size="sm" onClick={() => handleViewProfile(item.guide)}>Ver Perfil</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {job.hasPending && (
                                <div className="mt-4 border-t pt-4 flex justify-end">
                                    <Button variant="destructive" onClick={() => handleOpenCancelDialog(job)}>
                                        Cancelar Ofertas Pendientes
                                    </Button>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };

    return (
        <>
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Guías</CardTitle>
                        <CardDescription>Revisa el estado de tus ofertas y gestiona a los guías que has contratado, agrupados por trabajo.</CardDescription>
                    </div>
                    <Link href="/company/hired/history" passHref>
                        <Button variant="outline">
                            <History className="mr-2 h-4 w-4" />
                            Ver Historial
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
            {selectedGuide && <GuideProfileDialog guide={selectedGuide} isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />}

            <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cancelará todas las ofertas pendientes para el trabajo "{selectedJobForCancel?.job_type}". Los guías que no hayan respondido ya no podrán aceptar la oferta. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCanceling}>No, mantener ofertas</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmCancel} disabled={isCanceling} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sí, cancelar ofertas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
