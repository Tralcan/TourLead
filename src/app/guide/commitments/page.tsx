
"use client"
import React from 'react';
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
import { mockGuides } from "@/lib/data";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { RateEntity } from '@/components/star-rating';
import { Commitment } from '@/lib/types';


export default function CommitmentsPage() {
    // Assuming logged in as Alice Johnson (mockGuides[0])
    const [commitments, setCommitments] = React.useState<Commitment[]>(mockGuides[0].commitments);

    const handleRateCompany = (commitmentId: string, rating: number) => {
        setCommitments(currentCommitments => 
            currentCommitments.map(c => 
                c.id === commitmentId ? { ...c, companyRating: rating } : c
            )
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mis Compromisos</CardTitle>
                <CardDescription>Una lista de todos tus trabajos programados, pasados y futuros.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Trabajo</TableHead>
                            <TableHead className="text-right">Estado/Calificación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {commitments.map((commitment) => (
                            <TableRow key={commitment.id}>
                                <TableCell>
                                    <div className="font-medium">{commitment.company.name}</div>
                                    <div className="text-sm text-muted-foreground">{commitment.company.email}</div>
                                </TableCell>
                                <TableCell>
                                    {format(commitment.startDate, "d MMM, yyyy", { locale: es })} - {format(commitment.endDate, "d MMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="default" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">{commitment.jobType}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {isPast(commitment.endDate) ? (
                                        <RateEntity 
                                            entityName={commitment.company.name} 
                                            currentRating={commitment.companyRating}
                                            onSave={(rating) => handleRateCompany(commitment.id, rating)}
                                        />
                                    ) : (
                                        <Badge variant="outline">Próximo</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                         {commitments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No tienes compromisos próximos.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
