
'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Search, Users, PanelLeft, UserCircle, Mountain, LogOut, Star, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";

const baseNavItems = [
    { href: '/company/hired', icon: Users, label: 'Gestión de Guías' },
    { href: '/company/search', icon: Search, label: 'Buscar Guías' },
    { href: '/company/offers', icon: Mail, label: 'Ofertas Vigentes' },
    { href: '/company/reputation', icon: Star, label: 'Reputación' },
    { href: '/company/profile', icon: Building2, label: 'Perfil de la Empresa' },
];

const adminNavItem = { href: '/company/admin', icon: Shield, label: 'Administración' };

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const navItems = React.useMemo(() => {
        return isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;
    }, [isAdmin]);

    React.useEffect(() => {
        const checkUserStatus = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                setUser(user);

                const { data: companyProfile, error: selectError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('id', user.id)
                    .single();
                
                if(selectError && selectError.code !== 'PGRST116') {
                    console.error("[CompanyLayout] Error al verificar el perfil de la empresa:", selectError);
                }

                if (!companyProfile) {
                   const { error: insertError } = await supabase.from('companies').insert({
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.full_name || 'Nueva Empresa',
                    });
                    if (insertError) {
                        console.error("[CompanyLayout] Error al crear un nuevo perfil de empresa:", insertError);
                    }
                }
                
                const { data: adminData, error: adminError } = await supabase
                    .from('admins')
                    .select('user_id')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .single();
                
                if (adminError && adminError.code !== 'PGRST116') {
                     console.error("[CompanyLayout] Error al verificar los privilegios de administrador:", adminError);
                }

                setIsAdmin(!!adminData);
            } else {
                router.push('/login');
            }
            setIsLoading(false);
        };

        checkUserStatus().catch(error => {
            console.error("[CompanyLayout] Ocurrió un error CRÍTICO durante la verificación inicial del usuario:", error);
            setIsLoading(false); // Make sure loading stops on critical error
            router.push('/login');
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setIsAdmin(false);
                    router.push('/login');
                } else if (session?.user) {
                    setUser(session.user);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router, supabase]);
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Cargando panel de empresa...</p>
            </div>
        )
    }

    if (!user) {
        return null;
    }

    const MobileNav = (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Alternar Menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                    <Logo onClick={() => setIsMobileMenuOpen(false)} />
                    {navItems.map((item) => (
                         <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-4 px-2.5 ${
                                pathname.startsWith(item.href)
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );

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
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                                        pathname.startsWith(item.href)
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="sr-only">{item.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                    ))}
                </nav>
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    {MobileNav}
                    <div className="flex-1">
                        <h1 className="font-headline text-lg font-semibold hidden sm:block">
                            {navItems.find(item => pathname.startsWith(item.href))?.label || 'Panel'}
                        </h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <UserCircle className="h-6 w-6" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{user?.email || "Mi Cuenta"}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/company/profile')}>Perfil</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push('/support')}>Soporte</DropdownMenuItem>
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
