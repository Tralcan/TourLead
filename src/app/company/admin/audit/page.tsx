
"use client"

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type SubscriptionRecord = {
    id: number;
    start_date: string;
    end_date: string;
    company_id: string;
    admin_id: string;
    companyName?: string;
    adminName?: string;
}

export default function AuditPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [auditLog, setAuditLog] = React.useState<SubscriptionRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function checkAdminAndFetchLog() {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }
            
            const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('user_id')
                .eq('user_id', user.id)
                .single();

            if (adminError || !adminData) {
                toast({ title: "Acceso denegado", description: "No tienes permisos para ver esta página.", variant: "destructive" });
                router.push('/company/hired');
                return;
            }

            try {
                const [subscriptionsRes, companiesRes] = await Promise.all([
                    supabase.from('subscriptions').select('*').order('start_date', { ascending: false }),
                    supabase.from('companies').select('id, name')
                ]);

                const { data: subscriptionsData, error: subscriptionsError } = subscriptionsRes;
                if (subscriptionsError) throw subscriptionsError;

                const { data: companiesData, error: companiesError } = companiesRes;
                if (companiesError) throw companiesError;

                if (subscriptionsData && companiesData) {
                    const companiesMap = new Map(companiesData.map(c => [c.id, c.name]));
                    const log = subscriptionsData.map(sub => ({
                        ...sub,
                        companyName: companiesMap.get(sub.company_id) || 'Empresa Desconocida',
                        adminName: companiesMap.get(sub.admin_id) || 'Admin Desconocido',
                    }));
                    setAuditLog(log);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                toast({ title: "Error", description: `No se pudo cargar el registro de auditoría: ${errorMessage}`, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }

        checkAdminAndFetchLog();
    }, [router, toast]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cargando auditoría...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Cargando registros de suscripciones.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Auditoría de Suscripciones</CardTitle>
                    <CardDescription>Un historial de todas las suscripciones creadas en la plataforma.</CardDescription>
                </div>
                 <Button variant="outline" asChild>
                    <Link href="/company/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa Suscrita</TableHead>
                            <TableHead>Fecha de Inicio</TableHead>
                            <TableHead>Fecha de Fin</TableHead>
                            <TableHead>Suscripción Creada Por</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : auditLog.length > 0 ? (
                            auditLog.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.companyName}</TableCell>
                                    <TableCell>{format(new Date(log.start_date.replace(/-/g, '/')), "PPP", { locale: es })}</TableCell>
                                    <TableCell>{format(new Date(log.end_date.replace(/-/g, '/')), "PPP", { locale: es })}</TableCell>
                                    <TableCell>{log.adminName}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No hay registros de suscripción.
                                    <br />
                                    <span className="text-xs">(Si el problema persiste, revisa las políticas de lectura RLS en Supabase.)</span>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
