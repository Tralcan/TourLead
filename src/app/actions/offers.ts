
'use server';

import { createClient } from '@/lib/supabase/server';
import { sendOfferEmail, sendAcceptanceNotificationEmail } from '@/services/email';
import { z } from 'zod';

const offerSchema = z.object({
    guideIds: z.array(z.string().uuid("ID de guía inválido.")).min(1, "Debe seleccionar al menos un guía."),
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
        guideIds: formData.getAll('guideId'),
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

    const { guideIds, jobType, description, startDate, endDate, contactPerson, contactPhone } = parsed.data;

    const offersToInsert = guideIds.map(guideId => ({
        guide_id: guideId,
        company_id: user.id,
        job_type: jobType,
        description: description,
        start_date: startDate,
        end_date: endDate,
        status: 'pending' as const,
        contact_person: contactPerson,
        contact_phone: contactPhone,
    }));

    const { error: insertError } = await supabase.from('offers').insert(offersToInsert);

    if (insertError) {
        console.error("Error al crear la oferta:", insertError);
        return { success: false, message: 'No se pudo crear la oferta en la base de datos.' };
    }

    const { data: guidesData, error: guidesError } = await supabase
        .from('guides')
        .select('id, email, name')
        .in('id', guideIds);

    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', user.id)
        .single();
    
    if (guidesError || companyError || !guidesData || !companyData) {
        console.error("Fallo al obtener datos para el email:", { guidesError, companyError });
        return { success: true, message: 'Oferta(s) creada(s), pero no se pudo enviar la(s) notificación(es) por correo.' };
    }

    const emailPromises = guidesData.map(guide => {
        if (guide.email) {
            return sendOfferEmail({
                to: guide.email,
                guideName: guide.name || 'Guía',
                companyName: companyData.name || 'Una empresa',
                jobType: jobType,
                startDate: new Date(startDate.replace(/-/g, '/')),
                endDate: new Date(endDate.replace(/-/g, '/')),
                contactPerson: contactPerson,
                contactPhone: contactPhone,
            });
        }
        return Promise.resolve();
    });

    await Promise.allSettled(emailPromises);

    return { success: true, message: '¡Oferta(s) enviada(s) exitosamente!' };
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida. Por favor, inicie sesión.' };
    }

    if (user.id !== data.guideId) {
        return { success: false, message: 'No tienes permiso para aceptar esta oferta.' };
    }
    
    const { data: existingCommitments, error: commitmentError } = await supabase
        .from('commitments')
        .select('id')
        .eq('guide_id', user.id)
        .lte('start_date', data.endDate)
        .gte('end_date', data.startDate);

    if (commitmentError) {
        console.error("Error checking for commitment conflicts:", commitmentError);
        return { success: false, message: "Error al verificar tu disponibilidad. Por favor, inténtalo de nuevo." };
    }

    if (existingCommitments && existingCommitments.length > 0) {
        return { success: false, message: "No puedes aceptar esta oferta porque ya tienes un compromiso en esas fechas. Por favor, rechaza la oferta." };
    }
    
    // Server-side validation of the offer before attempting to create a commitment
    const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('status, guide_id')
        .eq('id', data.offerId)
        .single();

    if (offerError || !offerData) {
        console.error("Error fetching offer to validate:", offerError);
        return { success: false, message: `No se pudo encontrar la oferta para validarla: ${offerError?.message}` };
    }

    if (offerData.status !== 'pending') {
        return { success: false, message: "Esta oferta ya no está pendiente. Puede que haya sido aceptada, rechazada o cancelada." };
    }

    if (offerData.guide_id !== user.id) {
        return { success: false, message: "No tienes permiso para aceptar una oferta que no es tuya." };
    }

    // 1. Create the commitment FIRST.
    const { data: newCommitment, error: insertError } = await supabase
        .from('commitments')
        .insert({
            guide_id: user.id,
            company_id: data.companyId,
            job_type: data.jobType,
            start_date: data.startDate,
            end_date: data.endDate,
            offer_id: data.offerId,
        })
        .select('id')
        .single();

    if (insertError) {
        console.error("Error al crear compromiso:", insertError);
        if (insertError.code === '42501') {
             return { success: false, message: `No se pudo crear el compromiso debido a una política de seguridad de la base de datos. Por favor, contacta al administrador.` };
        }
        return { success: false, message: `No se pudo crear el compromiso. La base de datos denegó la acción: ${insertError.message}` };
    }
    
    // 2. Update offer status to 'accepted'.
    const { error: updateError } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', data.offerId)
        .eq('guide_id', user.id); // Security check

    if (updateError) {
        console.error("Error al actualizar la oferta:", updateError);
        // If the offer update fails, we must try to delete the commitment we just created.
        if (newCommitment) {
            await supabase.from('commitments').delete().eq('id', newCommitment.id);
        }
        return { success: false, message: "No se pudo aceptar la oferta. Se revirtió el compromiso. Por favor, inténtalo de nuevo más tarde." };
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
        .eq('id', user.id)
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

export async function cancelPendingOffersForJob(data: { jobType: string | null, startDate: string, endDate: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida.' };
    }

    const { jobType, startDate, endDate } = data;

    if (!jobType || !startDate || !endDate) {
        return { success: false, message: 'Faltan datos para cancelar las ofertas.' };
    }

    const { error } = await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .match({
            company_id: user.id,
            job_type: jobType,
            start_date: startDate,
            end_date: endDate,
            status: 'pending'
        });

    if (error) {
        console.error("Error al cancelar ofertas pendientes:", error);
        return { success: false, message: `No se pudieron cancelar las ofertas: ${error.message}` };
    }

    return { success: true, message: 'Ofertas pendientes canceladas exitosamente.' };
}

const updateOfferSchema = z.object({
  offerIds: z.array(z.number()),
  jobType: z.string().min(1, "El tipo de trabajo es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  contactPerson: z.string().min(1, "La persona de contacto es requerida."),
  contactPhone: z.string().min(1, "El teléfono de contacto es requerido."),
});

export async function updateOfferDetails(data: z.infer<typeof updateOfferSchema>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida.' };
    }

    const parsed = updateOfferSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: `Datos de formulario inválidos: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }

    const { offerIds, jobType, description, contactPerson, contactPhone } = parsed.data;
    
    const { error } = await supabase
      .from('offers')
      .update({
        job_type: jobType,
        description: description,
        contact_person: contactPerson,
        contact_phone: contactPhone,
      })
      .in('id', offerIds)
      .eq('company_id', user.id); // Security check
      
    if (error) {
        console.error("Error al actualizar la oferta:", error);
        return { success: false, message: `No se pudo actualizar la oferta: ${error.message}` };
    }

    return { success: true, message: '¡Oferta actualizada exitosamente!' };
}

const rejectOfferSchema = z.object({
    offerId: z.number(),
});

export async function rejectOffer(data: z.infer<typeof rejectOfferSchema>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida.' };
    }

    const parsed = rejectOfferSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: 'ID de oferta inválido.' };
    }

    const { offerId } = parsed.data;

    // A company can reject an offer it has sent.
    const { error } = await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('id', offerId)
        .eq('company_id', user.id); // Security check to ensure the company owns the offer

    if (error) {
        console.error("Error al rechazar la oferta:", error);
        return { success: false, message: 'No se pudo cancelar la oferta.' };
    }

    return { success: true, message: 'Oferta cancelada.' };
}

export async function guideRejectOffer(offerId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida.' };
    }

    // A guide can reject an offer sent to them.
    const { error } = await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('id', offerId)
        .eq('guide_id', user.id); // Security check to ensure the guide owns the offer

    if (error) {
        console.error("Error al rechazar la oferta por el guía:", error);
        return { success: false, message: 'No se pudo rechazar la oferta.' };
    }

    return { success: true, message: 'Oferta rechazada.' };
}
