
"use client"

import * as React from "react"
import { isBefore, startOfToday, eachDayOfInterval } from "date-fns"
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client";

// Helper to parse YYYY-MM-DD string as a local Date object, avoiding timezone shifts.
const parseDateStringAsLocal = (dateString: string): Date => {
    const parts = dateString.split(/[-T]/); // Split by hyphen or 'T'
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
};

// Helper to format a local Date object into a YYYY-MM-DD string, avoiding timezone issues.
const formatLocalDate = (date: Date): string => {
  const d = new Date(date);
  // We use UTC methods to prevent the date from shifting due to the user's local timezone.
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AvailabilityPage() {
  const today = startOfToday();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [days, setDays] = React.useState<Date[] | undefined>([]);
  const [bookedDays, setBookedDays] = React.useState<Date[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAvailability() {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        const { data: guideData, error: guideError } = await supabase
            .from('guides')
            .select('availability')
            .eq('id', user.id)
            .single();

        if (guideData?.availability) {
            setDays(guideData.availability.map((d:string) => parseDateStringAsLocal(d)));
        }
        if(guideError) console.error("Error fetching availability:", guideError);

        const { data: commitmentsData, error: commitmentsError } = await supabase
            .from('commitments')
            .select('start_date, end_date')
            .eq('guide_id', user.id)
            .gt('end_date', new Date().toISOString());
        
        if (commitmentsData) {
            const allBookedDays = commitmentsData.flatMap(c => 
                eachDayOfInterval({ start: parseDateStringAsLocal(c.start_date!), end: parseDateStringAsLocal(c.end_date!) })
            );
            setBookedDays(allBookedDays);
        }
        if(commitmentsError) console.error("Error fetching commitments:", commitmentsError);
        setIsLoading(false);
    }
    fetchAvailability();
  }, [supabase]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión.", variant: "destructive" });
        return;
    }

    const stringDates = days?.map(day => formatLocalDate(day));
    
    const { error } = await supabase
      .from('guides')
      .update({ availability: stringDates })
      .eq('id', user.id);

    if (error) {
        toast({
            title: "Error al Guardar",
            description: "No se pudo actualizar tu calendario.",
            variant: "destructive"
        })
    } else {
        toast({
            title: "Disponibilidad Guardada",
            description: "Tu calendario ha sido actualizado correctamente.",
        })
        router.push('/guide/commitments');
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Gestiona tu Disponibilidad</CardTitle>
            <CardDescription>Selecciona las fechas en las que estás disponible para trabajar. Las fechas reservadas se muestran en gris.</CardDescription>
        </CardHeader>
      <CardContent className="flex justify-center">
        {isLoading ? <p>Cargando calendario...</p> : (
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
        )}
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
