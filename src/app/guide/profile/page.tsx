
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import React from "react"
import { useRouter } from "next/navigation"

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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

const profileFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  rate: z.coerce.number().min(0, "La tarifa debe ser un número positivo.").optional(),
  avatar: z.any().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const supabase = createClient();

export default function GuideProfilePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
    const [allSpecialties, setAllSpecialties] = React.useState<{ name: string }[]>([]);
    const [allLanguages, setAllLanguages] = React.useState<{ name: string }[]>([]);

    const form = useForm<ProfileFormValues>({
      resolver: zodResolver(profileFormSchema),
      defaultValues: {
        name: "",
        email: "",
        phone: "",
        specialties: [],
        languages: [],
        rate: 0,
      },
      mode: "onChange",
    });

    const { reset } = form;

    const fetchGuideData = React.useCallback(async () => {
        console.log("GuideProfile: Iniciando la carga de datos del perfil...");
        setIsLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error("GuideProfile: No se encontró un usuario autenticado.");
            toast({ title: "Error", description: "Debes iniciar sesión para ver tu perfil.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
        console.log("GuideProfile: Usuario autenticado encontrado:", user.id);

        try {
            console.log("GuideProfile: Obteniendo datos del guía, especialidades e idiomas...");
            const [guideResponse, specialtiesResponse, languagesResponse] = await Promise.all([
                supabase.from("guides").select("*").eq("id", user.id).single(),
                supabase.from('expertise').select('name').eq('state', true),
                supabase.from('languaje').select('name')
            ]);
            
            console.log("GuideProfile: Respuesta de Supabase (guía):", { data: guideResponse.data, error: guideResponse.error });
            console.log("GuideProfile: Respuesta de Supabase (especialidades):", { data: specialtiesResponse.data, error: specialtiesResponse.error });
            console.log("GuideProfile: Respuesta de Supabase (idiomas):", { data: languagesResponse.data, error: languagesResponse.error });

            const { data: guideData, error: guideError } = guideResponse;
            if (guideData) {
              console.log("GuideProfile: Perfil de guía encontrado. Reseteando formulario con:", guideData);
              reset({
                name: guideData.name || "",
                email: guideData.email || "",
                phone: guideData.phone || "",
                rate: guideData.rate || 0,
                specialties: guideData.specialties || [],
                languages: guideData.languages || [],
              });
              setAvatarUrl(guideData.avatar);
              setAvatarPreview(guideData.avatar);
            } else if (guideError && guideError.code !== 'PGRST116') {
                console.error("GuideProfile: Error al obtener el perfil del guía:", guideError);
                throw new Error(`Error fetching guide profile: ${guideError.message}`);
            } else {
                console.log("GuideProfile: No se encontró perfil de guía, probablemente es un nuevo usuario.");
            }

            const { data: specialtiesData, error: specialtiesError } = specialtiesResponse;
            if (specialtiesError) {
                console.error("GuideProfile: Error al obtener especialidades:", specialtiesError);
                throw new Error(`Error fetching specialties: ${specialtiesError.message}`);
            }
            console.log("GuideProfile: Especialidades obtenidas:", specialtiesData);
            setAllSpecialties(specialtiesData || []);

            const { data: languagesData, error: languagesError } = languagesResponse;
            if (languagesError) {
                console.error("GuideProfile: Error al obtener idiomas:", languagesError);
                throw new Error(`Error fetching languages: ${languagesError.message}`);
            }
            console.log("GuideProfile: Idiomas obtenidos:", languagesData);
            setAllLanguages(languagesData || []);

        } catch (error) {
            console.error("GuideProfile: Catch - Error completo durante la carga de datos:", error);
            const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
            toast({ title: "Error de Carga", description: `No se pudieron cargar los datos del perfil: ${errorMessage}`, variant: "destructive" });
        } finally {
            console.log("GuideProfile: Finalizando carga de datos. isLoading=false");
            setIsLoading(false);
        }
    }, [toast, reset]);

    React.useEffect(() => {
      fetchGuideData();
    }, [fetchGuideData]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
          const file = event.target.files[0];
          const previewUrl = URL.createObjectURL(file);
          setAvatarPreview(previewUrl);
          form.setValue('avatar', event.target.files);
      }
  };

  async function onSubmit(data: ProfileFormValues) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión.", variant: "destructive" });
        return;
    }
    
    let newAvatarUrl = avatarUrl;
    const avatarFile = data.avatar?.[0];

    if (avatarFile) {
        const filePath = `${user.id}/${Date.now()}_${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, {
                upsert: true
            });
        
        if (uploadError) {
            toast({ title: "Error al subir imagen", description: uploadError.message, variant: "destructive" });
            return;
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("guides")
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        specialties: data.specialties,
        languages: data.languages,
        rate: data.rate,
        avatar: newAvatarUrl
      })
      .eq("id", user.id);
    
    if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
    } else {
        toast({
            title: "Perfil Actualizado",
            description: "Tu perfil de guía se ha guardado correctamente.",
        });
        if (newAvatarUrl !== avatarUrl) {
          setAvatarUrl(newAvatarUrl);
        }
        router.push('/guide/commitments');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Guía</CardTitle>
        <CardDescription>Así es como tu perfil aparecerá a las empresas de tours.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Cargando perfil...</p>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="avatar"
              render={() => (
                <FormItem className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarPreview ?? undefined} />
                        <AvatarFallback>{form.getValues('name')?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <FormLabel>Foto de Perfil</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={handleAvatarChange} />
                      </FormControl>
                      <FormDescription>Sube una nueva foto de perfil. La imagen se guardará al actualizar el perfil.</FormDescription>
                      <FormMessage />
                    </div>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                        <Input type="tel" placeholder="+56 9 1234 5678" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="specialties"
              render={() => (
                <FormItem>
                  <FormLabel>Especialidades</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 rounded-md border p-4">
                    {allSpecialties.map((item) => (
                      <FormField
                        key={item.name}
                        control={form.control}
                        name="specialties"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.name)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValue, item.name])
                                    : field.onChange(currentValue.filter((v) => v !== item.name));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">{item.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="languages"
              render={() => (
                <FormItem>
                  <FormLabel>Idiomas Hablados</FormLabel>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 rounded-md border p-4">
                    {allLanguages.map((item) => (
                      <FormField
                        key={item.name}
                        control={form.control}
                        name="languages"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.name)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValue, item.name])
                                    : field.onChange(currentValue.filter((v) => v !== item.name));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">{item.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
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
                      <div className="relative w-full md:w-1/2">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                          <Input type="number" className="pl-7" placeholder="200" {...field} />
                      </div>
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
