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
import { mockGuides } from "@/lib/data";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// This would be filtered based on the logged-in company's hires
const hiredGuides = mockGuides.filter(g => g.commitments.length > 0);

export default function HiredGuidesPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tus Guías Contratados</CardTitle>
                <CardDescription>Una lista de todos los guías turísticos actualmente contratados por tu empresa.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guía</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Fechas Reservadas</TableHead>
                            <TableHead>Detalles del Trabajo</TableHead>
                            <TableHead>Especialidades</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hiredGuides.map((guide) => (
                            guide.commitments.map(commitment => (
                                <TableRow key={commitment.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={guide.avatar} alt={guide.name} />
                                                <AvatarFallback>{guide.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{guide.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{guide.email}</TableCell>
                                    <TableCell>
                                        {format(commitment.startDate, "d MMM, yyyy", { locale: es })} - {format(commitment.endDate, "d MMM, yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>{commitment.jobType}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {guide.specialties.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
