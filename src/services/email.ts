
'use server';

import { Resend } from 'resend';
import { format } from "date-fns";
import { es } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendOfferEmailProps = {
    to: string;
    guideName: string;
    companyName: string;
    jobType: string;
    startDate: Date;
    endDate: Date;
}

export async function sendOfferEmail({ to, guideName, companyName, jobType, startDate, endDate }: SendOfferEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.error("La API Key de Resend no está configurada.");
        throw new Error("La configuración del servicio de correo está incompleta.");
    }

    const from = 'TourLead <tourlead@notifications.cl>';
    const subject = `¡Tienes una nueva oferta de trabajo de ${companyName}!`;
    const formattedStartDate = format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    const formattedEndDate = format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es });

    // Se recomienda usar el dominio de la app, por ejemplo: `https://tourlead.vercel.app`
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>¡Hola ${guideName}!</h1>
        <p>Tienes una nueva oferta de trabajo de <strong>${companyName}</strong> en TourLead Connect.</p>
        <h2>Detalles de la Oferta:</h2>
        <ul>
            <li><strong>Tipo de Trabajo:</strong> ${jobType}</li>
            <li><strong>Fechas:</strong> Del ${formattedStartDate} al ${formattedEndDate}</li>
        </ul>
        <p>Para ver todos los detalles, aceptar o rechazar la oferta, por favor ingresa a tu panel haciendo clic en el siguiente botón:</p>
        <a href="${appUrl}/guide/offers" style="background-color: #FFB347; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver mis ofertas</a>
        <br>
        <p>Si el botón no funciona, copia y pega esta URL en tu navegador: ${appUrl}/guide/offers</p>
        <br>
        <p>¡Gracias por usar TourLead Connect!</p>
      </div>
    `;

    const textBody = `¡Hola ${guideName}!\n\nTienes una nueva oferta de trabajo de ${companyName} en TourLead Connect.\n\nDetalles de la Oferta:\n- Tipo de Trabajo: ${jobType}\n- Fechas: Del ${formattedStartDate} al ${formattedEndDate}\n\nPara ver todos los detalles, aceptar o rechazar la oferta, por favor ingresa a tu panel visitando la siguiente URL:\n${appUrl}/guide/offers\n\n¡Gracias por usar TourLead Connect!`;

    return await resend.emails.send({
        from: from,
        to: to,
        subject: subject,
        html: htmlBody,
        text: textBody,
    });
}

type SendAcceptanceNotificationEmailProps = {
    to: string;
    companyName: string;
    guideName: string;
    jobType: string;
    startDate: Date;
    endDate: Date;
}

export async function sendAcceptanceNotificationEmail({ to, companyName, guideName, jobType, startDate, endDate }: SendAcceptanceNotificationEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.error("La API Key de Resend no está configurada.");
        throw new Error("La configuración del servicio de correo está incompleta.");
    }

    const from = 'TourLead <tourlead@notifications.cl>';
    const subject = `¡Buenas noticias! ${guideName} ha aceptado tu oferta.`;
    const formattedStartDate = format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    const formattedEndDate = format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es });

    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>¡Hola ${companyName}!</h1>
        <p>El guía <strong>${guideName}</strong> ha aceptado tu oferta de trabajo para el rol de <strong>${jobType}</strong>.</p>
        <p>Ahora está confirmado para las fechas del <strong>${formattedStartDate}</strong> al <strong>${formattedEndDate}</strong>.</p>
        <p>Puedes ver los detalles del compromiso y la información de contacto del guía en tu panel de gestión:</p>
        <a href="${appUrl}/company/hired" style="background-color: #77B5FE; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver mis Guías Contratados</a>
        <br>
        <p>Si el botón no funciona, copia y pega esta URL en tu navegador: ${appUrl}/company/hired</p>
        <br>
        <p>¡Gracias por usar TourLead Connect!</p>
      </div>
    `;

    const textBody = `¡Hola ${companyName}!\n\nEl guía ${guideName} ha aceptado tu oferta de trabajo para el rol de ${jobType}.\n\nAhora está confirmado para las fechas del ${formattedStartDate} al ${formattedEndDate}.\n\nPuedes ver los detalles del compromiso y la información de contacto del guía en tu panel de gestión visitando la siguiente URL:\n${appUrl}/company/hired\n\n¡Gracias por usar TourLead Connect!`;

    return await resend.emails.send({
        from: from,
        to: to,
        subject: subject,
        html: htmlBody,
        text: textBody,
    });
}
