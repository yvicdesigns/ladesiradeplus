import QRCode from 'qrcode';

export const getQRCodeUrl = (tableId, baseUrl = window.location.origin) => {
  return `${baseUrl}/menu?table=${tableId}`;
};

export const generateQRCode = async (tableId, baseUrl = window.location.origin) => {
  try {
    const url = getQRCodeUrl(tableId, baseUrl);
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return {
      qrCodeDataUrl,
      url
    };
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

// Replaced SVG generation with PNG to maintain consistency as requested
export const generateQRCodeSVG = async (text) => {
  try {
    return await QRCode.toDataURL(text, { 
      type: 'image/png', 
      width: 400, 
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      }
    });
  } catch(err) {
    console.error('Error generating PNG (formerly SVG)', err);
    throw err;
  }
};

export const downloadQRCode = (qrCodeDataUrl, format = 'png', filename = 'qrcode') => {
  if (!qrCodeDataUrl) return;
  const link = document.createElement('a');
  link.href = qrCodeDataUrl;
  
  // ensure format is part of filename or append it
  let dlName = filename;
  // If the data URL is actually PNG, force the extension to png
  const isPng = qrCodeDataUrl.startsWith('data:image/png');
  const actualFormat = isPng ? 'png' : format;
  
  if (!dlName.includes('.')) {
    dlName = `${filename}.${actualFormat}`;
  }
  
  link.download = dlName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const printQRCode = (qrCodeDataUrl, tableInfo = {}) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print QR Code - Table ${tableInfo.table_number || ''}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .card {
            border: 2px solid #000000;
            padding: 40px;
            border-radius: 20px;
            max-width: 400px;
            background-color: #FFFFFF;
          }
          h1 { margin-bottom: 10px; font-size: 24px; color: #000000; }
          h2 { margin-top: 0; color: #555555; font-size: 18px; margin-bottom: 30px; }
          img { width: 300px; height: 300px; display: block; margin: 0 auto; }
          .footer { margin-top: 20px; font-size: 12px; color: #888888; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Table ${tableInfo.table_number || ''}</h1>
          <h2>Scan to View Menu & Order</h2>
          <img src="${qrCodeDataUrl}" alt="QR Code for Table ${tableInfo.table_number || ''}" />
          <div class="footer">
             ${tableInfo.location ? `Location: ${tableInfo.location}` : ''}
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generatePromoQRCode = async (url) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const extractTableIdFromQrCode = (scannedText) => {
  if (!scannedText) return null;
  try {
      // Check if it's a URL
      if (scannedText.startsWith('http://') || scannedText.startsWith('https://')) {
          const url = new URL(scannedText);
          const tableParam = url.searchParams.get('table');
          if (tableParam) return tableParam;
          
          // maybe it's in the path like /menu/TABLE-1
          const parts = url.pathname.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart !== 'menu') return lastPart;
      }
      
      // If it's just raw text/id
      return scannedText;
  } catch (e) {
      // If URL parsing fails, assume it's just the raw ID string
      return scannedText;
  }
};