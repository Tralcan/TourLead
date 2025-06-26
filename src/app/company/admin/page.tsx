
"use client"

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { type Company } from '@/lib/types';
import { createSubscription } from '@/app/actions/subscriptions';

const supabase = createClient();

const subscriptionFormSchema = z.object({
  companyId: z.string({ required_error: "Debes seleccionar una empresa." }),
  startDate: z.date({ required_error: "La fecha de inicio es requerida." }),
  endDate: z.date({ required_error: "La fecha de fin es requerida." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
  path: ["endDate"],
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

export default function AdminPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<SubscriptionFormValues>({
        resolver: zodResolver(subscriptionFormSchema),
        mode: 'onChange',
    });

    React.useEffect(() => {
        async function checkAdminAndFetchCompanies() {
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

            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('*')
                .order('name', { ascending: true });
            
            if (companiesError) {
                toast({ title: "Error", description: "No se pudieron cargar las empresas.", variant: "destructive" });
            } else {
                setCompanies(companiesData as Company[]);
            }
            
            setIsLoading(false);
        }

        checkAdminAndFetchCompanies();
    }, [router, toast]);

    async function onSubmit(data: SubscriptionFormValues) {
        setIsSubmitting(true);
        const result = await createSubscription(data);

        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            form.reset();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cargando panel de administración...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Verificando permisos y cargando datos.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Panel de Administración de Suscripciones</CardTitle>
                <CardDescription>Crea o renueva suscripciones para las empresas de la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="companyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Empresa</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona una empresa para suscribir" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {companies.map(company => (
                                                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Inicio</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Elige una fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                            locale={es}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                             <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Fin</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Elige una fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                form.getValues("startDate") ? date < form.getValues("startDate") : false
                                            }
                                            initialFocus
                                            locale={es}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Creando..." : "Crear Suscripción"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
