'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CalendarDays, Mail, User, PanelLeft, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from '@/components/logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const navItems = [
    { href: '/guide/commitments', icon: CalendarCheck, label: 'Mis Compromisos' },
    { href: '/guide/availability', icon: CalendarDays, label: 'Mi Disponibilidad' },
    { href: '/guide/offers', icon: Mail, label: 'Ofertas de Trabajo' },
    { href: '/guide/profile', icon: User, label: 'Mi Perfil' },
];

export default function GuideLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
      <TooltipProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                    <Logo />
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
                                <UserCircle className="h-6 w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Configuración</DropdownMenuItem>
                            <DropdownMenuItem>Soporte</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
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
