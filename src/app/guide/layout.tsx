'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarCheck, CalendarDays, Mail, User, PanelLeft, UserCircle, Mountain, LogOut, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
    { href: '/guide/commitments', icon: CalendarCheck, label: 'Mis Compromisos' },
    { href: '/guide/availability', icon: CalendarDays, label: 'Mi Disponibilidad' },
    { href: '/guide/offers', icon: Mail, label: 'Ofertas de Trabajo' },
    { href: '/guide/reputation', icon: Star, label: 'Mi Reputación' },
    { href: '/guide/profile', icon: User, label: 'Mi Perfil' },
];

const supabase = createClient();

export default function GuideLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = React.useState<SupabaseUser | null>(null);
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [pendingOffersCount, setPendingOffersCount] = React.useState(0);

    React.useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                try {
                    setIsLoading(true);
                    if (session) {
                        const { data: guideProfile, error: selectError } = await supabase
                            .from('guides')
                            .select('id, avatar')
                            .eq('id', session.user.id)
                            .single();

                        if(selectError && selectError.code !== 'PGRST116') {
                            console.error("GuideLayout: Error checking for profile:", selectError);
                            throw selectError;
                        }

                        if (guideProfile) {
                            setAvatarUrl(guideProfile.avatar);
                        } else {
                           const { error: insertError } = await supabase.from('guides').insert({
                                id: session.user.id,
                                email: session.user.email,
                                name: session.user.user_metadata?.full_name || 'Nuevo Guía',
                                avatar: session.user.user_metadata?.avatar_url
                            });
                            setAvatarUrl(session.user.user_metadata?.avatar_url);
                            
                            if (insertError) {
                                console.error("GuideLayout: Error creating new profile:", insertError);
                                throw insertError;
                            }
                        }

                        const { count, error: countError } = await supabase
                            .from('offers')
                            .select('id', { count: 'exact', head: true })
                            .eq('guide_id', session.user.id)
                            .eq('status', 'pending');

                        if (countError) {
                            console.error("Error fetching pending offers count:", countError);
                        } else {
                            setPendingOffersCount(count ?? 0);
                        }

                        setUser(session.user);

                    } else {
                        router.push('/login');
                        setPendingOffersCount(0);
                    }
                } catch (error) {
                    console.error("GuideLayout: An error occurred in onAuthStateChange logic:", error);
                    router.push('/login');
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router, pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Cargando panel de guía...</p>
            </div>
        )
    }

    return (
      <TooltipProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 md:h-8 md:w-8"
                            >
                                <Mountain className="h-5 w-5" />
                                <span className="sr-only">TourLead Connect</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">Página Principal</TooltipContent>
                    </Tooltip>
                    {navItems.map((item) => (
                        <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={item.href}
                                    className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                                        pathname.startsWith(item.href)
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="sr-only">{item.label}</span>
                                     {item.label === 'Ofertas de Trabajo' && pendingOffersCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                                    )}
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                    ))}
                </nav>
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Alternar Menú</span>
                    </Button>
                    <div className="flex-1">
                        <h1 className="font-headline text-lg font-semibold">
                            {navItems.find(item => pathname.startsWith(item.href))?.label || 'Panel'}
                        </h1>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <UserCircle className="h-6 w-6" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{user?.email || "Mi Cuenta"}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/guide/profile')}>Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Soporte</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
      </TooltipProvider>
    );
}
