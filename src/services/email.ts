
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

    const from = 'TourLead <onboarding@resend.dev>'; // Resend requiere un dominio verificado, 'onboarding@resend.dev' es para pruebas.
    const subject = `¡Tienes una nueva oferta de trabajo de ${companyName}!`;
    const formattedStartDate = format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    const formattedEndDate = format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es });

    // Se recomienda usar el dominio de la app, por ejemplo: `https://tourlead.vercel.app`
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    const body = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>¡Hola ${guideName}!</h1>
        <p>Tienes una nueva oferta de trabajo de <strong>${companyName}</strong> en TourLead Connect.</p>
        <h2>Detalles de la Oferta:</h2>
        <ul>
            <li><strong>Tipo de Trabajo:</strong> ${jobType}</li>
            <li><strong>Fechas:</strong> Del ${formattedStartDate} al ${formattedEndDate}</li>
        </ul>
        <p>Para ver todos los detalles, aceptar o rechazar la oferta, por favor ingresa a tu panel haciendo clic en el siguiente botón:</p>
        <a href="${appUrl}/guide/offers" style="background-color: #FF9900; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver mis ofertas</a>
        <br>
        <p>Si el botón no funciona, copia y pega esta URL en tu navegador: ${appUrl}/guide/offers</p>
        <br>
        <p>¡Gracias por usar TourLead Connect!</p>
      </div>
    `;

    return await resend.emails.send({
        from: from,
        to: to,
        subject: subject,
        html: body,
    });
}
