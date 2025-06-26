
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
import { Star, UserCheck } from "lucide-react";
import type { Guide } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReputationData = {
    job_type: string | null;
    company_rating: number | null;
    guide: Guide | null;
};

function GuideProfileDialog({ guide, isOpen, onOpenChange }: { guide: Guide, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!guide) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage src={guide.avatar ?? ''} alt={guide.name ?? ''} />
                        <AvatarFallback>{guide.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <DialogTitle className="text-2xl">{guide.name}</DialogTitle>
                        <DialogDescription>
                            {guide.email} {guide.phone && `• ${guide.phone}`}
                        </DialogDescription>
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

export default function ReputationPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [reputationData, setReputationData] = React.useState<ReputationData[]>([]);
    const [averageRating, setAverageRating] = React.useState(0);
    const [totalReviews, setTotalReviews] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedGuide, setSelectedGuide] = React.useState<Guide | null>(null);
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
                    .select('job_type, company_rating, guide_rating, guide:guides(*)')
                    .eq('company_id', user.id)
                    .not('company_rating', 'is', null);

                if (error) throw error;

                if (data) {
                    const ratedCommitments = data.filter(c => c.company_rating !== null);
                    const totalRating = ratedCommitments.reduce((acc, curr) => acc + (curr.company_rating || 0), 0);
                    const avgRating = ratedCommitments.length > 0 ? totalRating / ratedCommitments.length : 0;
                    setAverageRating(avgRating);
                    setTotalReviews(ratedCommitments.length);

                    const displayableData = data.filter(c => c.company_rating !== null && c.guide_rating !== null && c.guide);
                    setReputationData(displayableData as ReputationData[]);
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

    const handleViewProfile = (guide: Guide) => {
        setSelectedGuide(guide);
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
                        Aquí solo se muestran las evaluaciones de los guías a los que tú también has calificado. Para ver una evaluación, asegúrate de calificar al guía en la sección de 'Historial'.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Guía</TableHead>
                                <TableHead>Trabajo</TableHead>
                                <TableHead className="text-right">Calificación Recibida</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Cargando evaluaciones...</TableCell>
                                </TableRow>
                            ) : reputationData.length > 0 ? (
                                reputationData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        {item.guide ? (
                                            <button
                                                onClick={() => handleViewProfile(item.guide!)}
                                                className="text-left font-medium text-primary hover:underline"
                                            >
                                                {item.guide.name || 'Guía Desconocido'}
                                            </button>
                                        ) : (
                                            'Guía Desconocido'
                                        )}
                                    </TableCell>
                                    <TableCell>{item.job_type || 'No especificado'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <StarRatingDisplay rating={item.company_rating!} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No tienes evaluaciones visibles. Califica a un guía para ver su evaluación.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedGuide && (
                <GuideProfileDialog
                    guide={selectedGuide}
                    isOpen={isProfileDialogOpen}
                    onOpenChange={setIsProfileDialogOpen}
                />
            )}
        </div>
    );
}
