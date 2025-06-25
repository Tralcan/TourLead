"use client"

import * as React from "react"
import { addDays, isBefore, startOfToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const bookedDays = [addDays(new Date(), 5), addDays(new Date(), 6)];

export default function AvailabilityPage() {
  const today = startOfToday();
  const { toast } = useToast();
  const [days, setDays] = React.useState<Date[] | undefined>(
    [addDays(today, 10), addDays(today, 12), addDays(today, 20)]
  );

  const handleSave = () => {
    toast({
        title: "Availability Saved",
        description: "Your calendar has been updated successfully.",
    })
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Manage Your Availability</CardTitle>
            <CardDescription>Select the dates you are available to work. Booked dates are shown in gray.</CardDescription>
        </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="multiple"
          selected={days}
          onSelect={setDays}
          className="rounded-md border"
          numberOfMonths={2}
          disabled={(date) => isBefore(date, today) || bookedDays.some(bookedDate => new Date(date).toDateString() === new Date(bookedDate).toDateString())}
          modifiers={{
            booked: bookedDays,
          }}
          modifiersStyles={{
            booked: {
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
              cursor: "not-allowed",
              opacity: 0.5
            },
          }}
        />
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Availability</Button>
        <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-primary" />
                <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-muted" />
                <span>Booked</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border bg-background" />
                <span>Not Available</span>
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}
