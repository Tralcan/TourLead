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

const guide = mockGuides[0]; // Assuming logged in as Alice Johnson

export default function CommitmentsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Commitments</CardTitle>
                <CardDescription>A list of all your scheduled and confirmed jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Job Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guide.commitments.map((commitment) => (
                            <TableRow key={commitment.id}>
                                <TableCell className="font-medium">{commitment.company.name}</TableCell>
                                <TableCell>{commitment.company.email}</TableCell>
                                <TableCell>
                                    {format(commitment.startDate, "MMM d, yyyy")} - {format(commitment.endDate, "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="default" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">{commitment.jobType}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                         {guide.commitments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    You have no upcoming commitments.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
