
'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
    companyId: z.string().uuid("ID de empresa inválido."),
    startDate: z.date({ required_error: "La fecha de inicio es requerida."}),
    endDate: z.date({ required_error: "La fecha de fin es requerida."}),
});

export async function createSubscription(data: { companyId: string, startDate: Date, endDate: Date }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida.' };
    }

    const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
    
    if (adminError || !adminData) {
        return { success: false, message: 'No tienes permisos para realizar esta acción.' };
    }
    
    const parsed = subscriptionSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, message: `Datos de formulario inválidos: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }
    
    const { companyId, startDate, endDate } = parsed.data;

    const { error: insertError } = await supabase.from('subscriptions').insert({
        company_id: companyId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        admin_id: user.id,
    });

    if (insertError) {
        console.error("Error al crear la suscripción:", insertError);
        return { success: false, message: `No se pudo crear la suscripción en la base de datos: ${insertError.message}` };
    }

    return { success: true, message: '¡Suscripción creada exitosamente!' };
}

const cancelSubscriptionSchema = z.object({
    subscriptionId: z.number(),
});

export async function cancelSubscription(data: z.infer<typeof cancelSubscriptionSchema>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida.' };
    }

    const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
    
    if (adminError || !adminData) {
        return { success: false, message: 'No tienes permisos para realizar esta acción.' };
    }
    
    const parsed = cancelSubscriptionSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, message: `Datos inválidos: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }
    
    const { subscriptionId } = parsed.data;
    const today = new Date().toISOString();

    const { error: updateError } = await supabase.from('subscriptions').update({
        end_date: today,
        canceled_by_admin_id: user.id
    }).eq('id', subscriptionId);

    if (updateError) {
        console.error("Error al cancelar la suscripción:", updateError);
        return { success: false, message: `No se pudo cancelar la suscripción: ${updateError.message}` };
    }

    return { success: true, message: '¡Suscripción cancelada exitosamente!' };
}
