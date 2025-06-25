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
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(),
  specialties: z.string().min(1, "Please list at least one specialty."),
  languages: z.string().min(1, "Please list at least one language."),
  rate: z.coerce.number().min(1, "Rate must be a positive number."),
  avatar: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const defaultValues: Partial<ProfileFormValues> = {
  name: "Alice Johnson",
  email: "alice.j@email.com",
  specialties: "History, Art History",
  languages: "English, Spanish",
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
        title: "Profile Updated",
        description: "Your guide profile has been saved successfully.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guide Profile</CardTitle>
        <CardDescription>This is how your profile will appear to tour companies.</CardDescription>
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
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                        <Input type="file" {...field} />
                    </FormControl>
                    <FormDescription>Upload a professional headshot.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
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
                    <FormLabel>Specialties</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Hiking, History, Art" {...field} />
                    </FormControl>
                    <FormDescription>Separate specialties with a comma.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Languages Spoken</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., English, Spanish" {...field} />
                    </FormControl>
                    <FormDescription>Separate languages with a comma.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rate (per day)</FormLabel>
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
            
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Update Profile</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
