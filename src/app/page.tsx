
import Link from 'next/link';
import { ArrowRight, Briefcase, Building, MapPin, Users, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { createClient } from '@/lib/supabase/server';

const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

export default async function Home() {
  const supabase = createClient();
  
  // 1. Fetch guides with complete profiles
  const { data: completeGuides, error: guidesError } = await supabase
    .from('guides')
    .select('id, specialties, languages')
    .not('summary', 'is', null)
    .neq('summary', '')
    .not('specialties', 'is', null)
    .neq('specialties', '{}')
    .not('languages', 'is', null)
    .neq('languages', '{}')
    .gt('rate', 0);
  
  const guideCount = completeGuides?.length ?? 0;
  
  // 2. Calculate stats
  let specialtyCombinationCount = 0;
  const allLanguages = new Set<string>();

  if (completeGuides) {
      for (const guide of completeGuides) {
          const numSpecialties = guide.specialties?.length ?? 0;
          specialtyCombinationCount += factorial(numSpecialties);

          if (guide.languages) {
              for (const language of guide.languages) {
                  allLanguages.add(language);
              }
          }
      }
  }

  const languageCount = allLanguages.size;
  
  const displayGuideCount = guideCount;
  const displaySpecialtyCount = specialtyCombinationCount;
  const displayLanguageCount = languageCount;

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
              Explora una red de <strong className="text-foreground font-semibold">{displayGuideCount.toLocaleString('es-CL')} guías profesionales</strong> con más de <strong className="text-foreground font-semibold">{displaySpecialtyCount.toLocaleString('es-CL')} combinaciones de especialidades</strong> y más de <strong className="text-foreground font-semibold">{displayLanguageCount.toLocaleString('es-CL')} idiomas</strong>.
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
