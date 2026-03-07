import PDFDocument from 'pdfkit';
import { create } from 'xmlbuilder2';

export class BillingService {
    static async generatePDF(data: { clinicName: string, userCount: number, pricePerUser: number, total: number }) {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: any[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));

            // Header
            doc.fontSize(20).text('FATURA MENSAL - HEATH FINANCE', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
            doc.text(`Clínica: ${data.clinicName}`);
            doc.moveDown();

            // Table Header
            doc.rect(50, 160, 500, 20).fill('#f0f0f0');
            doc.fillColor('#000000').text('Descrição', 60, 165);
            doc.text('Quantidade', 250, 165);
            doc.text('Vl. Unitário', 350, 165);
            doc.text('Total', 480, 165);

            // Row
            doc.text('Manutenção Mensal SaaS (Por Usuário)', 60, 190);
            doc.text(data.userCount.toString(), 250, 190);
            doc.text(`R$ ${data.pricePerUser.toFixed(2)}`, 350, 190);
            doc.text(`R$ ${data.total.toFixed(2)}`, 480, 190);

            // Footer
            doc.rect(50, 220, 500, 1).fill('#000000');
            doc.fontSize(14).font('Helvetica-Bold').text(`VALOR TOTAL: R$ ${data.total.toFixed(2)}`, 350, 235);

            doc.end();
        });
    }

    static generateXML(data: { clinicName: string, cnpj: string, userCount: number, pricePerUser: number, total: number }) {
        const obj = {
            invoice: {
                header: {
                    emitter: "HEATH FINANCE SAAS",
                    receiver: data.clinicName,
                    receiver_cnpj: data.cnpj || '00.000.000/0000-00',
                    date: new Date().toISOString()
                },
                items: {
                    item: {
                        description: "Mensalidade SaaS por Usuário",
                        quantity: data.userCount,
                        unit_price: data.pricePerUser,
                        total_price: data.total
                    }
                },
                totals: {
                    grand_total: data.total,
                    currency: "BRL"
                }
            }
        };
        const doc = create({ version: '1.0', encoding: 'UTF-8' }, obj);
        return doc.end({ prettyPrint: true });
    }
}
