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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

const profileFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email(),
  specialties: z.string().min(1, "Por favor, enumera al menos una especialidad."),
  languages: z.string().min(1, "Por favor, enumera al menos un idioma."),
  rate: z.coerce.number().min(1, "La tarifa debe ser un número positivo."),
  avatar: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// ID del guía logueado (hardcodeado para el ejemplo)
const LOGGED_IN_GUIDE_ID = "guide1";

export default function GuideProfilePage() {
    const { toast } = useToast()
    const [defaultValues, setDefaultValues] = React.useState<Partial<ProfileFormValues>>({});

    const form = useForm<ProfileFormValues>({
      resolver: zodResolver(profileFormSchema),
      values: defaultValues, // Usar values en lugar de defaultValues para el re-render
      mode: "onChange",
    });

    React.useEffect(() => {
      async function fetchGuideData() {
        const { data, error } = await supabase
          .from("guides")
          .select("*")
          .eq("id", LOGGED_IN_GUIDE_ID)
          .single();

        if (data) {
          const transformedData = {
            ...data,
            specialties: data.specialties?.join(", ") || "",
            languages: data.languages?.join(", ") || "",
          }
          setDefaultValues(transformedData);
          form.reset(transformedData);
        } else {
            console.error(error);
            toast({ title: "Error", description: "No se pudo cargar el perfil del guía.", variant: "destructive" });
        }
      }
      fetchGuideData();
    }, [form, toast]);


  async function onSubmit(data: ProfileFormValues) {
    const { error } = await supabase
      .from("guides")
      .update({
        name: data.name,
        email: data.email,
        specialties: data.specialties.split(",").map(s => s.trim()),
        languages: data.languages.split(",").map(l => l.trim()),
        rate: data.rate,
        // La actualización del avatar (archivo) es más compleja y se omite aquí.
      })
      .eq("id", LOGGED_IN_GUIDE_ID);
    
    if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
    } else {
        toast({
            title: "Perfil Actualizado",
            description: "Tu perfil de guía se ha guardado correctamente.",
        });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Guía</CardTitle>
        <CardDescription>Así es como tu perfil aparecerá a las empresas de tours.</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(defaultValues).length === 0 ? (
          <p>Cargando perfil...</p>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={defaultValues.avatar || ''} />
                    <AvatarFallback>{defaultValues.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => {
                  const { value, ...rest } = field
                  return (
                    <FormItem className="flex-1">
                      <FormLabel>Foto de Perfil</FormLabel>
                      <FormControl>
                        <Input type="file" {...rest} />
                      </FormControl>
                      <FormDescription>Sube una foto profesional.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )
                }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
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
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="tu@ejemplo.com" {...field} />
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
                        <Input placeholder="ej., Senderismo, Historia, Arte" {...field} />
                    </FormControl>
                    <FormDescription>Separa las especialidades con una coma.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Idiomas Hablados</FormLabel>
                    <FormControl>
                        <Input placeholder="ej., Inglés, Español" {...field} />
                    </FormControl>
                    <FormDescription>Separa los idiomas con una coma.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tarifa (por día)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                            <Input type="number" className="pl-7" placeholder="200" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Actualizar Perfil</Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  )
}
