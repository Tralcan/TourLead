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
import { format } from "date-fns";
import { es } from "date-fns/locale";

const guide = mockGuides[0]; // Assuming logged in as Alice Johnson

export default function CommitmentsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mis Compromisos</CardTitle>
                <CardDescription>Una lista de todos tus trabajos programados y confirmados.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Detalles del Trabajo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guide.commitments.map((commitment) => (
                            <TableRow key={commitment.id}>
                                <TableCell className="font-medium">{commitment.company.name}</TableCell>
                                <TableCell>{commitment.company.email}</TableCell>
                                <TableCell>
                                    {format(commitment.startDate, "d MMM, yyyy", { locale: es })} - {format(commitment.endDate, "d MMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="default" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">{commitment.jobType}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                         {guide.commitments.length === 0 && (
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
