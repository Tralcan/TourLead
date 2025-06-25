
'use server';

import { createClient } from '@/lib/supabase/server';
import { sendOfferEmail } from '@/services/email';
import { z } from 'zod';

const offerSchema = z.object({
    guideId: z.string().uuid("ID de guía inválido."),
    jobType: z.string().min(1, "El tipo de trabajo es requerido."),
    description: z.string().min(1, "La descripción es requerida."),
    startDate: z.string().min(1, "La fecha de inicio es requerida."),
    endDate: z.string().min(1, "La fecha de fin es requerida."),
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
    };

    const parsed = offerSchema.safeParse(rawData);

    if (!parsed.success) {
        return { success: false, message: `Datos de formulario inválidos: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }

    const { guideId, jobType, description, startDate, endDate } = parsed.data;

    const { error: insertError } = await supabase.from('offers').insert({
        guide_id: guideId,
        company_id: user.id,
        job_type: jobType,
        description: description,
        start_date: startDate,
        end_date: endDate,
        status: 'pending'
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
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });
    } catch (emailError) {
        console.error("Error al enviar el email:", emailError);
        return { success: true, message: 'Oferta creada, pero falló el envío de la notificación por correo.' };
    }

    return { success: true, message: '¡Oferta enviada exitosamente!' };
}
