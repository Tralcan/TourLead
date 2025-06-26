
import Link from 'next/link';
import { ArrowRight, Briefcase, Building, MapPin, Users, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { createClient } from '@/lib/supabase/server';
import { eachDayOfInterval, format, parseISO, isBefore, startOfToday } from 'date-fns';

export default async function Home() {
  const supabase = createClient();
  const today = startOfToday();

  // Fetch guides with complete profiles
  const { count: guideCount } = await supabase
    .from('guides')
    .select('id', { count: 'exact', head: true })
    .not('summary', 'is', null)
    .neq('summary', '')
    .not('specialties', 'is', null)
    .neq('specialties', '{}')
    .not('languages', 'is', null)
    .neq('languages', '{}')
    .gt('rate', 0);
  
  // Step 1: Fetch all commitments to build a set of unavailable person-days
  const { data: commitmentsData } = await supabase
    .from('commitments')
    .select('guide_id, start_date, end_date');

  // Step 2: Create a Set of all committed person-days for fast lookups.
  // The key is a string: "guideId_YYYY-MM-DD"
  const committedPersonDays = new Set<string>();
  if (commitmentsData) {
      for (const commitment of commitmentsData) {
          // Skip if data is incomplete
          if (!commitment.guide_id || !commitment.start_date || !commitment.end_date) continue;
          
          try {
              const daysInCommitment = eachDayOfInterval({
                  start: parseISO(commitment.start_date),
                  end: parseISO(commitment.end_date)
              });

              for (const day of daysInCommitment) {
                  committedPersonDays.add(`${commitment.guide_id}_${format(day, 'yyyy-MM-dd')}`);
              }
          } catch(e) {
              console.error(`Invalid date range in commitment table: start=${commitment.start_date}, end=${commitment.end_date}`);
          }
      }
  }

  // Step 3: Fetch all guides' availability
  const { data: availabilityData } = await supabase
    .from('guides')
    .select('id, availability');

  // Step 4: Calculate total net available person-days
  let netAvailablePersonDays = 0;
  if (availabilityData) {
    for (const guide of availabilityData) {
        if (guide.availability && Array.isArray(guide.availability)) {
            for (const dayString of guide.availability) {
                try {
                    const day = parseISO(dayString);
                    // Check 1: Is the day today or in the future?
                    if (!isBefore(day, today)) {
                        const formattedDay = format(day, 'yyyy-MM-dd');
                        // Check 2: Is this specific guide committed on this specific day?
                        if (!committedPersonDays.has(`${guide.id}_${formattedDay}`)) {
                            netAvailablePersonDays++;
                        }
                    }
                } catch(e) {
                    // Ignore potential invalid date formats in the DB array.
                }
            }
        }
    }
  }
  
  const displayGuideCount = guideCount ?? 0;
  const displayTotalDays = netAvailablePersonDays;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <Button variant="ghost" asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Link>
        </Button>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight text-foreground">
            Encuentra tu Próximo Guía Turístico. Sin Complicaciones.
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
            TourLead Connect es la plataforma principal para que las empresas de tours descubran y contraten guías profesionales para su próxima aventura.
          </p>
          <div className="mt-6 max-w-3xl mx-auto">
            <p className="text-muted-foreground">
              Explora una red de <strong className="text-foreground font-semibold">{displayGuideCount.toLocaleString('es-CL')} guías profesionales</strong> con más de <strong className="text-foreground font-semibold">{displayTotalDays.toLocaleString('es-CL')} días de disponibilidad combinada</strong>.
            </p>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/company">
                Contratar un Guía <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/guide">Unirse como Guía</Link>
            </Button>
          </div>
        </section>

        <section className="bg-secondary/50 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline text-foreground">¿Eres Guía o Empresa?</h2>
              <p className="mt-2 text-muted-foreground">Elige tu camino y desbloquea un mundo de oportunidades.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Link href="/guide" className="group">
                <Card className="h-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-4 font-headline">
                      <div className="p-3 rounded-md bg-primary/20 text-accent">
                        <Briefcase className="h-8 w-8 text-primary" />
                      </div>
                      Para Guías Turísticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Muestra tus habilidades, establece tu disponibilidad y sé contratado por las mejores empresas de tours. Gestiona tu agenda y ofertas en un solo lugar.</p>
                    <div className="mt-4 font-semibold text-primary flex items-center">
                      Comienza tu Viaje <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/company" className="group">
                <Card className="h-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-4 font-headline">
                      <div className="p-3 rounded-md bg-primary/20 text-accent">
                        <Building className="h-8 w-8 text-primary" />
                      </div>
                      Para Empresas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Accede a una red seleccionada de guías turísticos profesionales. Busca por especialidad y disponibilidad, envía ofertas y gestiona tu talento contratado.</p>
                    <div className="mt-4 font-semibold text-primary flex items-center">
                      Encuentra tu Talento <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline text-foreground">¿Por qué TourLead Connect?</h2>
              <p className="mt-2 text-muted-foreground">Funcionalidades diseñadas para una colaboración fluida.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-accent text-accent-foreground mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-semibold">Profesionales Verificados</h3>
                <p className="text-muted-foreground mt-2">Conéctate con una red de guías turísticos verificados y empresas de renombre.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-accent text-accent-foreground mb-4">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-semibold">Búsqueda Avanzada</h3>
                <p className="text-muted-foreground mt-2">Filtra guías por ubicación, especialidad, idioma y disponibilidad para encontrar la pareja perfecta.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-accent text-accent-foreground mb-4">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-semibold">Reservas sin Esfuerzo</h3>
                <p className="text-muted-foreground mt-2">Envía ofertas de trabajo, gestiona contratos y sigue tu agenda, todo dentro de la aplicación.</p>
              </div>
            </div>
        </section>
      </main>

      <footer className="bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TourLead Connect. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
