
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

type ReputationData = {
    job_type: string | null;
    guide_rating: number | null;
    company: { name: string | null } | null;
};

export default function ReputationPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [reputationData, setReputationData] = React.useState<ReputationData[]>([]);
    const [averageRating, setAverageRating] = React.useState(0);
    const [totalReviews, setTotalReviews] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);

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
                    .select('job_type, guide_rating, company_rating, company:companies(name)')
                    .eq('guide_id', user.id)
                    .not('guide_rating', 'is', null);

                if (error) throw error;

                if (data) {
                    const ratedCommitments = data.filter(c => c.guide_rating !== null);
                    const totalRating = ratedCommitments.reduce((acc, curr) => acc + (curr.guide_rating || 0), 0);
                    const avgRating = ratedCommitments.length > 0 ? totalRating / ratedCommitments.length : 0;
                    setAverageRating(avgRating);
                    setTotalReviews(ratedCommitments.length);

                    const displayableData = data.filter(c => c.guide_rating !== null && c.company_rating !== null);
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
                                    <TableCell className="font-medium">{item.company?.name || 'Empresa Desconocida'}</TableCell>
                                    <TableCell>{item.job_type || 'No especificado'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <StarRatingDisplay rating={item.guide_rating!} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No tienes evaluaciones visibles. Califica a una empresa para ver su evaluación.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
