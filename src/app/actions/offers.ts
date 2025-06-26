
'use server';

import { createClient } from '@/lib/supabase/server';
import { sendOfferEmail, sendAcceptanceNotificationEmail } from '@/services/email';
import { z } from 'zod';

const offerSchema = z.object({
    guideId: z.string().uuid("ID de guía inválido."),
    jobType: z.string().min(1, "El tipo de trabajo es requerido."),
    description: z.string().min(1, "La descripción es requerida."),
    startDate: z.string().min(1, "La fecha de inicio es requerida."),
    endDate: z.string().min(1, "La fecha de fin es requerida."),
    contactPerson: z.string().min(1, "La persona de contacto es requerida."),
    contactPhone: z.string().min(1, "El teléfono de contacto es requerido."),
});

export async function createOffer(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida. Por favor, inicie sesión.' };
    }

    const rawData = {
        guideId: formData.get('guideId'),
        jobType: formData.get('jobType'),
        description: formData.get('description'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        contactPerson: formData.get('contactPerson'),
        contactPhone: formData.get('contactPhone'),
    };

    const parsed = offerSchema.safeParse(rawData);

    if (!parsed.success) {
        return { success: false, message: `Datos de formulario inválidos: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }

    const { guideId, jobType, description, startDate, endDate, contactPerson, contactPhone } = parsed.data;

    const { error: insertError } = await supabase.from('offers').insert({
        guide_id: guideId,
        company_id: user.id,
        job_type: jobType,
        description: description,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        contact_person: contactPerson,
        contact_phone: contactPhone,
    });

    if (insertError) {
        console.error("Error al crear la oferta:", insertError);
        return { success: false, message: 'No se pudo crear la oferta en la base de datos.' };
    }

    const { data: guideData, error: guideError } = await supabase
        .from('guides')
        .select('email, name')
        .eq('id', guideId)
        .single();

    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', user.id)
        .single();
    
    if (guideError || companyError || !guideData || !companyData || !guideData.email) {
        console.error("Fallo al obtener datos para el email:", { guideError, companyError });
        return { success: true, message: 'Oferta creada, pero no se pudo enviar la notificación por correo.' };
    }

    try {
        await sendOfferEmail({
            to: guideData.email,
            guideName: guideData.name || 'Guía',
            companyName: companyData.name || 'Una empresa',
            jobType: jobType,
            startDate: new Date(startDate.replace(/-/g, '/')),
            endDate: new Date(endDate.replace(/-/g, '/')),
            contactPerson: contactPerson,
            contactPhone: contactPhone,
        });
    } catch (emailError) {
        console.error("Error al enviar el email:", emailError);
        return { success: true, message: 'Oferta creada, pero falló el envío de la notificación por correo.' };
    }

    return { success: true, message: '¡Oferta enviada exitosamente!' };
}

const acceptOfferSchema = z.object({
    offerId: z.number(),
    guideId: z.string().uuid(),
    companyId: z.string().uuid(),
    jobType: z.string().nullable(),
    startDate: z.string(),
    endDate: z.string(),
});

export async function acceptOffer(data: z.infer<typeof acceptOfferSchema>) {
    const supabase = createClient();
    
    // 1. Update offer status
    const { error: updateError } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', data.offerId);

    if (updateError) {
        console.error("Error al aceptar la oferta:", updateError);
        return { success: false, message: "No se pudo aceptar la oferta." };
    }

    // 2. Create commitment, now including the offer_id
    const { error: insertError } = await supabase
        .from('commitments')
        .insert({
            guide_id: data.guideId,
            company_id: data.companyId,
            job_type: data.jobType,
            start_date: data.startDate,
            end_date: data.endDate,
            offer_id: data.offerId,
        });
    
    if (insertError) {
        console.error("Error al crear compromiso:", insertError);
        // Rollback offer status if commitment creation fails
        await supabase.from('offers').update({ status: 'pending' }).eq('id', data.offerId);
        return { success: false, message: "No se pudo crear el compromiso." };
    }

    // 3. Send notification email
    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name, email')
        .eq('id', data.companyId)
        .single();
    
    const { data: guideData, error: guideError } = await supabase
        .from('guides')
        .select('name')
        .eq('id', data.guideId)
        .single();

    if (companyError || guideError || !companyData || !guideData || !companyData.email) {
        console.error("Fallo al obtener datos para el email de aceptación:", { companyError, guideError });
        return { success: true, message: 'Oferta aceptada, pero no se pudo enviar la notificación por correo a la empresa.' };
    }

    try {
        await sendAcceptanceNotificationEmail({
            to: companyData.email,
            companyName: companyData.name || 'Una empresa',
            guideName: guideData.name || 'un guía',
            jobType: data.jobType || 'No especificado',
            startDate: new Date(data.startDate.replace(/-/g, '/')),
            endDate: new Date(data.endDate.replace(/-/g, '/')),
        });
    } catch (emailError) {
        console.error("Error al enviar el email de aceptación:", emailError);
        return { success: true, message: 'Oferta aceptada, pero falló el envío de la notificación por correo a la empresa.' };
    }

    return { success: true, message: '¡Oferta Aceptada!' };
}
