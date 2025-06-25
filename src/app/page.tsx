import Link from 'next/link';
import { ArrowRight, Briefcase, Building, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <Button variant="ghost" asChild>
          <Link href="#">Login</Link>
        </Button>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight text-foreground">
            Find Your Next Tour Guide. Seamlessly.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            TourLead Connect is the premier platform for tour companies to discover and hire professional guides for their next adventure.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/company">
                Hire a Guide <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/guide">Join as a Guide</Link>
            </Button>
          </div>
        </section>

        <section className="bg-secondary/50 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline text-foreground">Are you a Guide or a Company?</h2>
              <p className="mt-2 text-muted-foreground">Choose your path and unlock a world of opportunities.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Link href="/guide" className="group">
                <Card className="h-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-4 font-headline">
                      <div className="p-3 rounded-md bg-primary/20 text-accent">
                        <Briefcase className="h-8 w-8 text-primary" />
                      </div>
                      For Tour Guides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Showcase your skills, set your availability, and get hired by top tour companies. Manage your schedule and offers all in one place.</p>
                    <div className="mt-4 font-semibold text-primary flex items-center">
                      Start Your Journey <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
                      For Companies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Access a curated network of professional tour guides. Search by specialty and availability, send offers, and manage your hired talent.</p>
                    <div className="mt-4 font-semibold text-primary flex items-center">
                      Find Your Talent <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline text-foreground">Why TourLead Connect?</h2>
              <p className="mt-2 text-muted-foreground">Features designed for seamless collaboration.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-accent text-accent-foreground mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-semibold">Verified Professionals</h3>
                <p className="text-muted-foreground mt-2">Connect with a network of vetted tour guides and reputable companies.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-accent text-accent-foreground mb-4">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-semibold">Advanced Search</h3>
                <p className="text-muted-foreground mt-2">Filter guides by location, specialty, language, and availability to find the perfect match.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-accent text-accent-foreground mb-4">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-semibold">Effortless Booking</h3>
                <p className="text-muted-foreground mt-2">Send job offers, manage contracts, and track your schedule all within the app.</p>
              </div>
            </div>
        </section>
      </main>

      <footer className="bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TourLead Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
