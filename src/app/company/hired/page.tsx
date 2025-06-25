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

// This would be filtered based on the logged-in company's hires
const hiredGuides = mockGuides.filter(g => g.commitments.length > 0);

export default function HiredGuidesPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Hired Guides</CardTitle>
                <CardDescription>A list of all tour guides currently contracted by your company.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guide</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Booked Dates</TableHead>
                            <TableHead>Job Details</TableHead>
                            <TableHead>Specialties</TableHead>
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
                                        {format(commitment.startDate, "MMM d, yyyy")} - {format(commitment.endDate, "MMM d, yyyy")}
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
