"use client"

import * as React from "react"
import { addDays, isBefore, startOfToday } from "date-fns"
import { es } from "date-fns/locale";
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
        title: "Disponibilidad Guardada",
        description: "Tu calendario ha sido actualizado correctamente.",
    })
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Gestiona tu Disponibilidad</CardTitle>
            <CardDescription>Selecciona las fechas en las que estás disponible para trabajar. Las fechas reservadas se muestran en gris.</CardDescription>
        </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="multiple"
          selected={days}
          onSelect={setDays}
          className="rounded-md border"
          numberOfMonths={2}
          locale={es}
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
        <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">Guardar Disponibilidad</Button>
        <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-primary" />
                <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-muted" />
                <span>Reservado</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border bg-background" />
                <span>No Disponible</span>
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}
