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
import { supabase } from "@/lib/supabase/client"

const profileFormSchema = z.object({
  name: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce una dirección de correo electrónico válida."),
  specialties: z.string().min(1, "Por favor, enumera al menos una especialidad."),
  details: z.string().max(500, "Los detalles no pueden exceder los 500 caracteres.").min(10, "Por favor, proporciona más detalles."),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// ID de la compañía logueada (hardcodeado para el ejemplo)
const LOGGED_IN_COMPANY_ID = "comp1";

export default function CompanyProfilePage() {
    const { toast } = useToast()
    const [defaultValues, setDefaultValues] = React.useState<Partial<ProfileFormValues>>({});

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        values: defaultValues,
        mode: "onChange",
    })

    React.useEffect(() => {
        async function fetchCompanyData() {
            const { data, error } = await supabase
                .from("companies")
                .select("*")
                .eq("id", LOGGED_IN_COMPANY_ID)
                .single();

            if (data) {
                const transformedData = {
                    ...data,
                    specialties: data.specialties?.join(", ") || "",
                }
                setDefaultValues(transformedData);
                form.reset(transformedData);
            } else {
                console.error(error);
                toast({ title: "Error", description: "No se pudo cargar el perfil de la empresa.", variant: "destructive" });
            }
        }
        fetchCompanyData();
    }, [form, toast]);


  async function onSubmit(data: ProfileFormValues) {
    const { error } = await supabase
      .from('companies')
      .update({
        name: data.name,
        email: data.email,
        specialties: data.specialties.split(',').map(s => s.trim()),
        details: data.details,
      })
      .eq('id', LOGGED_IN_COMPANY_ID)

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
         {Object.keys(defaultValues).length === 0 ? (
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
