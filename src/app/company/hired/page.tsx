
"use client"
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockGuides as initialMockGuides } from "@/lib/data";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { RateEntity } from "@/components/star-rating";
import { Guide } from "@/lib/types";

export default function HiredGuidesPage() {
    const [hiredGuides, setHiredGuides] = React.useState<Guide[]>(() => 
        initialMockGuides.filter(g => g.commitments.length > 0)
    );

    const handleRateGuide = (guideId: string, commitmentId: string, rating: number) => {
        setHiredGuides(currentGuides => 
            currentGuides.map(guide => {
                if (guide.id === guideId) {
                    return {
                        ...guide,
                        commitments: guide.commitments.map(c => 
                            c.id === commitmentId ? { ...c, guideRating: rating } : c
                        ),
                    };
                }
                return guide;
            })
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tus Guías Contratados</CardTitle>
                <CardDescription>Una lista de todos los guías turísticos contratados por tu empresa, pasados y futuros.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guía</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Trabajo</TableHead>
                            <TableHead>Especialidades</TableHead>
                            <TableHead className="text-right">Estado/Calificación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hiredGuides.flatMap(guide => 
                            guide.commitments.map(commitment => (
                                <TableRow key={commitment.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={guide.avatar} alt={guide.name} />
                                                <AvatarFallback>{guide.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{guide.name}</div>
                                                <div className="text-sm text-muted-foreground">{guide.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(commitment.startDate, "d MMM, yyyy", { locale: es })} - {format(commitment.endDate, "d MMM, yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>{commitment.jobType}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {guide.specialties.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isPast(commitment.endDate) ? (
                                            <RateEntity 
                                                entityName={guide.name} 
                                                currentRating={commitment.guideRating}
                                                onSave={(rating) => handleRateGuide(guide.id, commitment.id, rating)}
                                            />
                                        ) : (
                                            <Badge variant="outline">Próximo</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
