
"use client"

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelSubscription } from '@/app/actions/subscriptions';
import { Badge } from '@/components/ui/badge';

const supabase = createClient();

type SubscriptionRecord = {
    id: string; // Corrected from number to string to handle UUIDs
    start_date: string;
    end_date: string;
    company_id: string;
    admin_id: string;
    canceled_by_admin_id: string | null;
    companyName?: string;
    adminName?: string;
    cancelingAdminName?: string | null;
}

export default function AuditPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [auditLog, setAuditLog] = React.useState<SubscriptionRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCanceling, setIsCanceling] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedSubscription, setSelectedSubscription] = React.useState<SubscriptionRecord | null>(null);

    const fetchAuditLog = React.useCallback(async () => {
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
                    cancelingAdminName: sub.canceled_by_admin_id ? (companiesMap.get(sub.canceled_by_admin_id) || 'Admin Desconocido') : null,
                }));
                setAuditLog(log as SubscriptionRecord[]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({ title: "Error", description: `No se pudo cargar el registro de auditoría: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [router, toast]);
    
    React.useEffect(() => {
        fetchAuditLog();
    }, [fetchAuditLog]);

    const handleOpenCancelDialog = (subscription: SubscriptionRecord) => {
        setSelectedSubscription(subscription);
        setIsAlertOpen(true);
    };

    const handleCancelSubscriptionAction = async () => {
        if (!selectedSubscription) return;
        setIsCanceling(true);

        const formData = new FormData();
        formData.append('subscriptionId', selectedSubscription.id);

        const result = await cancelSubscription(formData);
        
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            fetchAuditLog();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        
        setIsAlertOpen(false);
        setSelectedSubscription(null);
        setIsCanceling(false);
    };

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
        <>
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
                                <TableHead>Periodo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Información</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLog.length > 0 ? (
                                auditLog.map(log => {
                                    const isCancelled = !!log.canceled_by_admin_id;
                                    const isActive = !isPast(new Date(log.end_date.replace(/-/g, '/')));
                                    
                                    return (
                                        <TableRow key={log.id} className={isCancelled ? 'bg-destructive/10 hover:bg-destructive/20' : ''}>
                                            <TableCell className="font-medium">{log.companyName}</TableCell>
                                            <TableCell>
                                                {format(new Date(log.start_date.replace(/-/g, '/')), "d MMM yyyy", { locale: es })} - {format(new Date(log.end_date.replace(/-/g, '/')), "d MMM yyyy", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                {isCancelled ? (
                                                    <Badge variant="destructive">Cancelada</Badge>
                                                ) : isActive ? (
                                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Activa</Badge>
                                                ) : (
                                                    <Badge variant="outline">Expirada</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>Creada por: {log.adminName}</div>
                                                {isCancelled && log.cancelingAdminName && (
                                                    <div className="text-xs text-muted-foreground">Cancelada por: {log.cancelingAdminName}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!isCancelled && isActive && (
                                                    <Button variant="destructive" size="sm" onClick={() => handleOpenCancelDialog(log)}>
                                                        Cancelar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
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
            
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de que quieres cancelar esta suscripción?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La fecha de finalización de la suscripción para <strong>{selectedSubscription?.companyName}</strong> se establecerá en la fecha de hoy.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCanceling}>No, mantener</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSubscriptionAction} disabled={isCanceling} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sí, cancelar suscripción
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
