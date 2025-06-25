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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const profileFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  specialties: z.string().min(1, "Please list at least one specialty."),
  details: z.string().max(500, "Details cannot exceed 500 characters.").min(10, "Please provide more details."),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// This can be fetched from an API
const defaultValues: Partial<ProfileFormValues> = {
  name: "Adventure Seekers Inc.",
  email: "contact@adventureseekers.com",
  specialties: "Hiking, Mountain Biking, Kayaking",
  details: "Leading provider of outdoor adventure tours for over 15 years. We focus on sustainable and thrilling experiences.",
}

export default function CompanyProfilePage() {
    const { toast } = useToast()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: "Profile Updated",
      description: "Your company profile has been saved successfully.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>Manage your company's information. This is how you'll appear to guides.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company LLC" {...field} />
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
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@yourcompany.com" {...field} />
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
                    <Input placeholder="e.g., History, Food Tours, Hiking" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your company's specialties, separated by commas.
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
                  <FormLabel>Company Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about your company"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Update Profile</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
