import PDFDocument from 'pdfkit';
import { create } from 'xmlbuilder2';

export class BillingService {
    static async generatePDF(data: { 
        clinicName: string, 
        razaoSocial: string,
        cnpj: string,
        address: string,
        userCount: number, 
        pricePerUser: number, 
        monthlyFee: number,
        setupValue: number,
        setupInstallments: number,
        setupRemaining: number,
        contractStartDate: Date,
        contractDuration: number,
        total: number 
    }) {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ 
                margin: 50,
                size: 'A4',
                info: {
                    Title: `Fatura - ${data.clinicName}`,
                    Author: 'RARES360',
                }
            });
            const chunks: any[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));

            // Cores Premium
            const OLIVE = '#556B2F';
            const LIGHT_OLIVE = '#8A9A5B';
            const BEIGE = '#FAF9F6';
            const SLATE_DARK = '#1a202c';
            const SLATE_LIGHT = '#718096';

            // Watermark (Marca d'água Centralizada)
            doc.save();
            doc.fillColor(OLIVE);
            doc.fillOpacity(0.05);
            doc.fontSize(80);
            doc.font('Helvetica-Bold');
            doc.rotate(-45, { origin: [300, 400] });
            doc.text('RARES360', 100, 400, { align: 'center' });
            doc.restore();

            // --- HEADER ---
            // Logo Estilo Minimalista (Desenho vetorial sutil)
            doc.rect(50, 45, 40, 40).fill(OLIVE);
            doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('R', 60, 55);
            
            doc.fillColor(OLIVE).fontSize(20).font('Helvetica-Bold').text('RARES360', 100, 50);
            doc.fillColor(SLATE_LIGHT).fontSize(8).font('Helvetica').text('GESTÃO ESTRATÉGICA SAAS', 100, 72, { characterSpacing: 2 });
            
            doc.fillColor(OLIVE).fontSize(14).font('Helvetica-Bold').text('FATURA DE SERVIÇOS', 350, 50, { align: 'right' });
            doc.fillColor(SLATE_LIGHT).fontSize(10).font('Helvetica').text(`#${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, 350, 68, { align: 'right' });
            doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 350, 82, { align: 'right' });

            doc.moveDown(4);

            // --- INFO BLOCKS (EMISSOR E CLIENTE) ---
            const startY = 120;
            
            // Emissor
            doc.fillColor(OLIVE).fontSize(8).font('Helvetica-Bold').text('EMISSOR', 50, startY);
            doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica-Bold').text('RARES360 SOLUÇÕES DIGITAIS', 50, startY + 12);
            doc.font('Helvetica').fontSize(9).fillColor(SLATE_LIGHT);
            doc.text('CNPJ: 62.308.137/0001-65', 50, startY + 26);
            doc.text('ti.rares@rares360.com.br', 50, startY + 38);
            doc.text('Avenida das Admin, 1000 - Centro', 50, startY + 50);

            // Cliente
            doc.fillColor(OLIVE).fontSize(8).font('Helvetica-Bold').text('CLIENTE (TOMADOR)', 300, startY);
            doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica-Bold').text(data.razaoSocial.toUpperCase(), 300, startY + 12);
            doc.font('Helvetica').fontSize(9).fillColor(SLATE_LIGHT);
            doc.text(`CNPJ: ${data.cnpj}`, 300, startY + 26);
            doc.text(data.address || 'Endereço não informado', 300, startY + 38, { width: 250 });

            doc.moveDown(8);

            // --- ITENS TABLE ---
            const tableTop = 220;
            
            // Table Header Background
            doc.rect(50, tableTop, 500, 25).fill(OLIVE);
            
            // Header Text
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('ITEM / DESCRIÇÃO', 60, tableTop + 8);
            doc.text('QTD', 300, tableTop + 8);
            doc.text('UNITÁRIO', 380, tableTop + 8);
            doc.text('SUBTOTAL', 480, tableTop + 8);

            let currentY = tableTop + 25;

            // Row 1: SaaS Maintenance
            doc.rect(50, currentY, 500, 40).fill(BEIGE);
            doc.fillColor(SLATE_DARK).fontSize(9).font('Helvetica-Bold').text('Manutenção Mensal SaaS (Licenciamento)', 60, currentY + 10);
            doc.fillColor(SLATE_LIGHT).fontSize(8).font('Helvetica').text(`Uso da plataforma Rares360 Core - Ciclo ${new Date().getMonth() + 1}/${new Date().getFullYear()}`, 60, currentY + 22);
            
            doc.fillColor(SLATE_DARK).fontSize(9).text(data.userCount.toString(), 300, currentY + 15);
            doc.text(`R$ ${data.pricePerUser.toFixed(2)}`, 380, currentY + 15);
            doc.text(`R$ ${data.monthlyFee.toFixed(2)}`, 480, currentY + 15);

            currentY += 40;

            // Row 2: Setup (if applicable)
            if (data.setupValue > 0) {
                const parcelaVl = data.setupValue / data.setupInstallments;
                const residual = data.setupRemaining;
                const atual = data.setupInstallments - residual + 1;

                if (atual <= data.setupInstallments) {
                    doc.rect(50, currentY, 500, 40).fill('#FFFFFF');
                    doc.fillColor(SLATE_DARK).fontSize(9).font('Helvetica-Bold').text('Taxa de Implementação (Setup)', 60, currentY + 10);
                    doc.fillColor(SLATE_LIGHT).fontSize(8).font('Helvetica').text(`Parcela ${atual} de ${data.setupInstallments} do processo de Onboarding`, 60, currentY + 22);
                    
                    doc.fillColor(SLATE_DARK).fontSize(9).text('1', 300, currentY + 15);
                    doc.text(`R$ ${parcelaVl.toFixed(2)}`, 380, currentY + 15);
                    doc.text(`R$ ${parcelaVl.toFixed(2)}`, 480, currentY + 15);
                    currentY += 40;
                }
            }

            // --- TOTAL SUMMARY ---
            doc.moveDown(4);
            const summaryY = doc.y;
            
            doc.fillColor(SLATE_LIGHT).fontSize(9).text('Subtotal Serviços:', 380, summaryY);
            doc.fillColor(SLATE_DARK).font('Helvetica-Bold').text(`R$ ${data.total.toFixed(2)}`, 480, summaryY);
            
            doc.moveDown(0.5);
            const totalBoxY = doc.y + 5;
            doc.rect(370, totalBoxY, 180, 40).fill(OLIVE);
            doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text('VALOR TOTAL', 380, totalBoxY + 15);
            doc.fontSize(14).text(`R$ ${data.total.toFixed(2)}`, 480, totalBoxY + 12, { align: 'right' });

            // --- FOOTER & PAYMENT ---
            const footerY = 700;
            doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica-Bold').text('DADOS PARA PAGAMENTO:', 50, footerY);
            doc.fillColor(SLATE_LIGHT).fontSize(9).font('Helvetica').text('Pagamento via PIX (Cópia e Cola ou Chave):', 50, footerY + 15);
            doc.fillColor(OLIVE).font('Helvetica-Bold').text('Chave PIX: ti.rares@rares360.com.br', 50, footerY + 28);
            
            // Contract Progress
            const startDate = new Date(data.contractStartDate);
            const now = new Date();
            const monthsProgress = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1;
            
            doc.fillColor(SLATE_LIGHT).fontSize(8).font('Helvetica-Oblique').text(
                `Fidelidade Contratual: Mês ${monthsProgress} de ${data.contractDuration} do contrato vigente.`,
                50, footerY + 55
            );

            doc.fontSize(8).font('Helvetica').text(
                'Agradecemos a confiança na gestão estratégica da sua clínica.',
                50, 780, { align: 'center', width: 500 }
            );

            doc.end();
        });
    }

    static generateXML(data: { clinicName: string, cnpj: string, userCount: number, pricePerUser: number, total: number }) {
        const obj = {
            invoice: {
                header: {
                    emitter: "RARES360 SAAS",
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
