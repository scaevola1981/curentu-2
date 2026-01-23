export const printReport = async (title, columns, data, summary = null) => {
    const rowsHtml = data.map(row => {
        const cells = Object.values(row).map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const summaryHtml = summary 
        ? `<div class="summary"><h3>Sumar</h3>${Object.entries(summary).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}</div>`
        : '';

    const htmlContent = `
    <!-- ... Content truncated for brevity, using same logic ... -->
    <div style="font-family: 'Outfit', sans-serif; padding: 40px; background: white; color: #1F2937;">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap');
            body { margin: 0; padding: 0; }
            h1 { text-transform: uppercase; letter-spacing: 2px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 0.9rem; }
            th { background: #f3f4f6; text-align: left; padding: 12px; font-weight: 700; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; font-size: 0.8rem; color: #4b5563; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; width: 50%; float: right; }
            .footer { margin-top: 50px; font-size: 0.8rem; color: #9ca3af; text-align: center; clear: both; }
        </style>

        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
             <div>
                <h1 style="margin:0; border:none; padding:0; font-size: 2rem;">CURENTU'</h1>
                <p style="margin:5px 0 0 0; color:#6b7280; font-size:0.9rem;">Gestiune și Producție</p>
             </div>
             <div style="text-align:right;">
                <h2 style="margin:0; font-size: 1.5rem; color:#1f2937;">${title}</h2>
                <p style="margin:5px 0 0 0;">Data: <strong>${new Date().toLocaleDateString('ro-RO')}</strong></p>
             </div>
        </div>

        <table>
            <thead>
                <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        ${summaryHtml}

        <div style="margin-top: 60px; display: flex; justify-content: space-between; page-break-inside: avoid;">
            <div style="text-align: center; width: 40%;">
                <p style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 50px;"><strong>Întocmit de:</strong></p>
                <p>(Semnătura)</p>
            </div>
            <div style="text-align: center; width: 40%;">
                <p style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 50px;"><strong>Aprobat de:</strong></p>
                <p>(Semnătura și Ștampila)</p>
            </div>
        </div>

        <div class="footer">
            Generat automat de Curentu App v1.7.5 - ${new Date().toLocaleString('ro-RO')}
        </div>
    </div>
    `;

    // 🚀 NEW: Electron Native Download Support
    if (window.electronAPI && window.electronAPI.generatePDF) {
        try {
            console.log("🚀 Generating PDF via Electron Native API...");
            const result = await window.electronAPI.generatePDF(htmlContent, title);
            if (result.success) {
                alert(`Raport salvat cu succes în:\n${result.filePath}`);
                return;
            }
        } catch (err) {
            console.error("PDF Generation Failed:", err);
            alert("Eroare la generarea PDF: " + err.message);
        }
        return; // Stop here if Electron
    }

    // Fallback: Client-side Print (Iframe)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Get the iframe's document
    const doc = iframe.contentWindow.document;

    // Wrap for iframe
    const fullHtml = `<!DOCTYPE html><html><head><title>${title}</title></head><body>${htmlContent}</body></html>`;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    // Print after content is loaded
    iframe.onload = function() {
        // Use timeout to ensure rendering is complete
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            // Remove iframe after printing (with a delay to allow dialog to open)
            setTimeout(() => {
                 if (iframe.parentNode) document.body.removeChild(iframe);
            }, 2000);
        }, 500);
    };
    
    // Fallback if onload doesn't trigger
    setTimeout(() => {
        if (iframe.parentNode) {
            // Safety cleanup just in case
            // if (iframe.parentNode) document.body.removeChild(iframe);
        }
    }, 3000);
};
