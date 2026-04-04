import { supabase } from '@/lib/customSupabaseClient';
import { applyIsDeletedFilter } from '@/lib/softDeleteUtils';

/**
 * Sends an email using the Supabase Edge Function 'send-email'
 */
const sendEmail = async ({
  type,
  recipientEmail,
  recipientName,
  subject,
  htmlContent,
  textContent,
  orderId,
  reservationId
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { type, recipientEmail, recipientName, subject, htmlContent, textContent, orderId, reservationId }
    });

    if (error) {
      if (error instanceof Error && error.message.includes('FunctionsHttpError')) {
          try {
              const errorBody = await error.context?.json();
              if (errorBody && errorBody.error) throw new Error(`Email Service Error: ${errorBody.error}`);
          } catch (e) {}
      }
      if (error.status === 401 || error.status === 403) throw new Error('Authentication failed when calling email service.');
      throw new Error(error.message || 'Failed to invoke email function');
    }

    if (!data?.success) throw new Error(data?.error || 'Email service returned failure');

    return { success: true, message: 'Email sent successfully', id: data.id };

  } catch (error) {
    console.error('Send Email Exception:', error);
    try {
        await supabase.from('email_logs').insert({
            email_type: type, recipient_email: recipientEmail, recipient_name: recipientName,
            order_id: orderId || null, reservation_id: reservationId || null, status: 'failed', error_message: error.message
        });
    } catch (logError) {
        console.error('Failed to log email error locally:', logError);
    }
    return { success: false, message: error.message };
  }
};

const sendInvoiceEmail = async (invoiceData) => {
    try {
        const { data, error } = await supabase.functions.invoke('send-invoice-email', { body: invoiceData });
        if (error) throw new Error(error.message || 'Failed to send invoice email');
        if (!data?.success) throw new Error(data?.error || 'Invoice email service returned failure');
        return data;
    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
};

const sendOrderConfirmation = async (order) => {
    return await sendEmail({
        type: 'order_confirmation', recipientEmail: order.customer_email, recipientName: order.customer_name,
        subject: `Commande confirmée - ${order.id}`, htmlContent: `<p>Votre commande a été confirmée.</p>`,
        textContent: `Votre commande a été confirmée.`, orderId: order.id
    });
};

const sendOrderStatusUpdate = async (order) => {
    return await sendEmail({
        type: 'order_status_update', recipientEmail: order.customer_email, recipientName: order.customer_name,
        subject: `Mise à jour de commande - ${order.status}`, htmlContent: `<p>Votre commande est maintenant: ${order.status}</p>`,
        textContent: `Votre commande est maintenant: ${order.status}`, orderId: order.id
    });
};

const sendReservationConfirmation = async (reservation) => {
    return await sendEmail({
        type: 'reservation_confirmation', recipientEmail: reservation.customer_email, recipientName: reservation.customer_name,
        subject: `Réservation confirmée - ${reservation.id}`, htmlContent: `<p>Votre réservation a été confirmée.</p>`,
        textContent: `Votre réservation a été confirmée.`, reservationId: reservation.id
    });
};

const sendReservationStatusUpdate = async (reservation) => {
    return await sendEmail({
        type: 'reservation_status_update', recipientEmail: reservation.customer_email, recipientName: reservation.customer_name,
        subject: `Mise à jour de réservation - ${reservation.status}`, htmlContent: `<p>Votre réservation est maintenant: ${reservation.status}</p>`,
        textContent: `Votre réservation est maintenant: ${reservation.status}`, reservationId: reservation.id
    });
};

const resendEmail = async (log) => {
    return await sendEmail({
        type: log.email_type, recipientEmail: log.recipient_email, recipientName: log.recipient_name,
        subject: `Renvoi: ${log.email_type}`, htmlContent: `<p>Renvoi de votre email.</p>`,
        textContent: `Renvoi de votre email.`, orderId: log.order_id, reservationId: log.reservation_id
    });
};

export const emailService = {
  sendEmail, sendInvoiceEmail, sendOrderConfirmation, sendOrderStatusUpdate,
  sendReservationConfirmation, sendReservationStatusUpdate, resendEmail
};