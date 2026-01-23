/**
 * Generates a professional HTML report and triggers the print dialog.
 * @param {string} title - Report Title
 * @param {Array} columns - Array of column headers
 * @param {Array} data - Array of row data (objects or arrays matching columns)
 * @param {Object} summary - Optional summary data (key-value)
 */
export const printReport = (title, columns, data, summary = null) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print the report.");
        return;
    }

    const rowsHtml = data.map(row => {
        const cells = Object.values(row).map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const summaryHtml = summary 
        ? `<div class="summary"><h3>Sumar</h3>${Object.entries(summary).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}</div>`
        : '';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap');
            
            body {
                font-family: 'Outfit', sans-serif;
                color: #1F2937;
                padding: 40px;
                background: white;
            }
            h1 {
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #2563eb;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 10px;
                margin-bottom: 30px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 0.9rem;
            }
            th {
                background: #f3f4f6;
                text-align: left;
                padding: 12px;
                font-weight: 700;
                border-bottom: 2px solid #e5e7eb;
                text-transform: uppercase;
                font-size: 0.8rem;
                color: #4b5563;
            }
            td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
                background-color: #f9fafb;
            }
            .summary {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                width: 50%;
                float: right;
            }
            .footer {
                margin-top: 50px;
                font-size: 0.8rem;
                color: #9ca3af;
                text-align: center;
                clear: both;
            }
            @media print {
                body { padding: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div style="display:flex; justify-content:space-between; align-items:center;">
             <h1>${title}</h1>
             <div style="text-align:right;">
                <p><strong>CURENTU'</strong></p>
                <p>Data: ${new Date().toLocaleDateString('ro-RO')}</p>
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

        <div class="footer">
            Generat automat de Curentu App v1.7.4 - ${new Date().toLocaleString('ro-RO')}
        </div>
        
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
