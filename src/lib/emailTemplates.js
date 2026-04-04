import { formatCurrency, formatDateTime } from './formatters';

const LOGO_URL = 'https://via.placeholder.com/150x50?text=Brazzaville+Quarters';
const PRIMARY_COLOR = '#0f172a';
const SECONDARY_COLOR = '#f8fafc';
const ACCENT_COLOR = '#F59E0B';

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: ${PRIMARY_COLOR}; padding: 20px; text-align: center; }
    .header img { max-height: 50px; }
    .content { padding: 30px 20px; }
    .footer { background-color: ${SECONDARY_COLOR}; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e2e8f0; }
    h1 { color: ${PRIMARY_COLOR}; font-size: 24px; margin-bottom: 20px; }
    h2 { color: ${PRIMARY_COLOR}; font-size: 18px; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .btn { display: inline-block; padding: 12px 24px; background-color: ${ACCENT_COLOR}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .info-grid { display: table; width: 100%; margin-bottom: 20px; }
    .info-row { display: table-row; }
    .info-label { display: table-cell; padding: 5px 0; font-weight: bold; color: #64748b; width: 140px; }
    .info-value { display: table-cell; padding: 5px 0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; background-color: #e2e8f0; color: #475569; }
    .order-items { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .order-items th { text-align: left; padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 14px; }
    .order-items td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Brazzaville Quarters</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Brazzaville Quarters. Tous droits réservés.</p>
      <p>123 Rue de la Paix, Brazzaville, Congo</p>
      <p><a href="#" style="color: ${ACCENT_COLOR};">Se désabonner</a></p>
    </div>
  </div>
</body>
</html>
`;

export const getOrderConfirmationTemplate = (order) => {
  const itemsHtml = order.order_items ? order.order_items.map(item => `
    <tr>
      <td>${item.quantity}x ${item.menu_items?.name || 'Article'}</td>
      <td style="text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('') : '';

  const content = `
    <h1>Merci pour votre commande !</h1>
    <p>Bonjour ${order.customer_name || 'Client'},</p>
    <p>Nous avons bien reçu votre commande <strong>#${order.id.slice(0, 8)}</strong>. Elle est actuellement en attente de validation.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <span class="status-badge" style="background-color: #fef3c7; color: #b45309;">En attente</span>
    </div>

    <h2>Détails de la commande</h2>
    <table class="order-items">
      <thead><tr><th>Article</th><th style="text-align: right;">Prix</th></tr></thead>
      <tbody>
        ${itemsHtml}
        <tr class="total-row">
          <td>Total</td>
          <td style="text-align: right;">${formatCurrency(order.total)}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center;">
      <a href="#" class="btn">Suivre ma commande</a>
    </div>
  `;
  
  const subject = `Confirmation de commande #${order.id.slice(0, 8)}`;
  return {
    subject,
    html: baseTemplate('Confirmation de commande', content),
    text: `Merci pour votre commande #${order.id.slice(0, 8)}. Total: ${formatCurrency(order.total)}`
  };
};

export const getOrderStatusUpdateTemplate = (order) => {
  const statusColors = {
    pending: '#fef3c7',
    confirmed: '#dbeafe',
    preparing: '#e0e7ff',
    ready: '#dcfce7',
    completed: '#dcfce7',
    cancelled: '#fee2e2'
  };
  const statusText = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready: 'Prête',
    completed: 'Terminée',
    cancelled: 'Annulée'
  };

  const content = `
    <h1>Mise à jour de votre commande</h1>
    <p>Le statut de votre commande <strong>#${order.id.slice(0, 8)}</strong> a changé.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <span class="status-badge" style="background-color: ${statusColors[order.status] || '#f3f4f6'};">
        ${statusText[order.status] || order.status}
      </span>
    </div>

    <p>Nous faisons de notre mieux pour vous servir rapidement.</p>
    
    <div style="text-align: center;">
      <a href="#" class="btn">Voir les détails</a>
    </div>
  `;
  
  const subject = `Mise à jour commande #${order.id.slice(0, 8)}`;
  return {
    subject,
    html: baseTemplate('Mise à jour commande', content),
    text: `Le statut de votre commande #${order.id.slice(0, 8)} est maintenant: ${statusText[order.status] || order.status}`
  };
};

export const getOrderCancelledTemplate = (order) => {
  const content = `
    <h1>Commande Annulée</h1>
    <p>Bonjour ${order.customer_name},</p>
    <p>Votre commande <strong>#${order.id.slice(0, 8)}</strong> a été annulée.</p>
    <p>Si vous n'avez pas demandé cette annulation, ou pour toute question concernant un remboursement éventuel, veuillez nous contacter.</p>
    
    <div style="margin-top: 30px; padding: 15px; background-color: #fee2e2; border-radius: 6px; color: #991b1b;">
      Statut: Annulée
    </div>
  `;
  
  const subject = `Commande Annulée #${order.id.slice(0, 8)}`;
  return {
    subject,
    html: baseTemplate('Annulation de commande', content),
    text: `Votre commande #${order.id.slice(0, 8)} a été annulée.`
  };
};

export const getReservationConfirmationTemplate = (reservation) => {
  const content = `
    <h1>Réservation Confirmée</h1>
    <p>Bonjour ${reservation.customer_name},</p>
    <p>Votre demande de réservation a été reçue et est en cours de traitement.</p>
    
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Date :</span><span class="info-value">${formatDateTime(reservation.reservation_date)}</span></div>
      <div class="info-row"><span class="info-label">Heure :</span><span class="info-value">${reservation.reservation_time}</span></div>
      <div class="info-row"><span class="info-label">Invités :</span><span class="info-value">${reservation.party_size} personnes</span></div>
    </div>

    <div style="text-align: center;">
      <a href="#" class="btn">Gérer ma réservation</a>
    </div>
  `;
  
  const subject = 'Réservation reçue';
  return {
    subject,
    html: baseTemplate('Confirmation de réservation', content),
    text: `Votre réservation pour le ${reservation.reservation_date} à ${reservation.reservation_time} a été reçue.`
  };
};

export const getReservationStatusUpdateTemplate = (reservation) => {
    const content = `
      <h1>Statut Réservation Mis à jour</h1>
      <p>Bonjour ${reservation.customer_name},</p>
      <p>Le statut de votre réservation du <strong>${reservation.reservation_date}</strong> a changé.</p>
      
      <div style="text-align: center; margin: 20px 0;">
          <span class="status-badge">${reservation.status}</span>
      </div>

      <p>Au plaisir de vous recevoir !</p>
    `;
    
    const subject = 'Mise à jour de votre réservation';
    return {
      subject,
      html: baseTemplate('Mise à jour réservation', content),
      text: `Le statut de votre réservation du ${reservation.reservation_date} est maintenant: ${reservation.status}`
    };
};