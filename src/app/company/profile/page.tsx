"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import React from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

const profileFormSchema = z.object({
  name: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce una dirección de correo electrónico válida."),
  specialties: z.string().optional(),
  details: z.string().max(500, "Los detalles no pueden exceder los 500 caracteres.").optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function CompanyProfilePage() {
    const { toast } = useToast()
    const supabase = createClient();
    const [isLoading, setIsLoading] = React.useState(true);
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: "",
            email: "",
            specialties: "",
            details: "",
        },
        mode: "onChange",
    })

    React.useEffect(() => {
        async function fetchCompanyData() {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ title: "Error", description: "Debes iniciar sesión para ver tu perfil.", variant: "destructive" });
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("companies")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) {
                form.reset({
                    ...data,
                    specialties: data.specialties?.join(", ") || "",
                });
            } else if (error) {
                console.error(error);
                toast({ title: "Error", description: "No se pudo cargar el perfil de la empresa.", variant: "destructive" });
            }
            setIsLoading(false);
        }
        fetchCompanyData();
    }, [form, supabase, toast]);


  async function onSubmit(data: ProfileFormValues) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión para actualizar tu perfil.", variant: "destructive" });
        return;
    }

    const { error } = await supabase
      .from('companies')
      .update({
        name: data.name,
        email: data.email,
        specialties: data.specialties?.split(',').map(s => s.trim()).filter(Boolean) || [],
        details: data.details,
      })
      .eq('id', user.id)

    if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
    } else {
        toast({
          title: "Perfil Actualizado",
          description: "El perfil de tu empresa se ha guardado correctamente.",
        })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de la Empresa</CardTitle>
        <CardDescription>Administra la información de tu empresa. Así es como aparecerás ante los guías.</CardDescription>
      </CardHeader>
      <CardContent>
         {isLoading ? (
          <p>Cargando perfil...</p>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu Empresa S.L." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Contacto</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contacto@tuempresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., Historia, Tours Gastronómicos, Senderismo" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ingresa las especialidades de tu empresa, separadas por comas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalles de la Empresa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos un poco sobre tu empresa"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Actualizar Perfil</Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  )
}
