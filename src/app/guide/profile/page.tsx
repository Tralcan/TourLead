"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

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

const profileFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email(),
  specialties: z.string().min(1, "Por favor, enumera al menos una especialidad."),
  languages: z.string().min(1, "Por favor, enumera al menos un idioma."),
  rate: z.coerce.number().min(1, "La tarifa debe ser un número positivo."),
  avatar: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const defaultValues: Partial<ProfileFormValues> = {
  name: "Alicia Rodríguez",
  email: "alicia.r@email.com",
  specialties: "Historia, Historia del Arte",
  languages: "Inglés, Español",
  rate: 250,
  avatar: "https://placehold.co/100x100.png"
}

export default function GuideProfilePage() {
    const { toast } = useToast()
    const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: ProfileFormValues) {
    toast({
        title: "Perfil Actualizado",
        description: "Tu perfil de guía se ha guardado correctamente.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Guía</CardTitle>
        <CardDescription>Así es como tu perfil aparecerá a las empresas de tours.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={defaultValues.avatar} />
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
      </CardContent>
    </Card>
  )
}
