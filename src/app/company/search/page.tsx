"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, DollarSign, Star, User } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockGuides } from "@/lib/data";

export default function SearchGuidesPage() {
    const [startDate, setStartDate] = React.useState<Date | undefined>();
    const [endDate, setEndDate] = React.useState<Date | undefined>();

    const specialties = [...new Set(mockGuides.flatMap(g => g.specialties))];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Find Your Perfect Guide</CardTitle>
                    <CardDescription>Filter guides by availability and specialty to match your needs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                        
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a specialty" />
                            </SelectTrigger>
                            <SelectContent>
                                {specialties.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                            </SelectContent>
                        </Select>

                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Search Guides</Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockGuides.map(guide => (
                    <Card key={guide.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={guide.avatar} alt={guide.name} />
                                <AvatarFallback>{guide.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="font-headline">{guide.name}</CardTitle>
                                <CardDescription>{guide.email}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {guide.specialties.map(spec => (
                                    <Badge key={spec} variant="outline">{spec}</Badge>
                                ))}
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    <span>{guide.rate} / day</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-primary" />
                                    <span>5.0 (12 reviews)</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                                <User className="mr-2 h-4 w-4" />
                                View Profile & Offer
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
