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
        status: string,
        total: number 
    }) {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ 
                margin: 0, // Margin zero for full-bleed header
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

            // Cores Corporativas
            const OLIVE_DARK = '#556B2F';
            const OLIVE_SOFT = '#8A9A5B';
            const BEIGE = '#FAF9F6';
            const SLATE_DARK = '#1a202c';
            const SLATE_LIGHT = '#718096';
            const WHITE = '#FFFFFF';

            // --- 1. HEADER BANNER ---
            doc.rect(0, 0, 595, 180).fill(OLIVE_DARK);

            // Grafismo de Círculos (Abstrato)
            doc.save();
            const circles = [
                { x: 550, y: 40, r: 40, o: 0.1 },
                { x: 500, y: 80, r: 60, o: 0.05 },
                { x: 580, y: 120, r: 35, o: 0.15 },
                { x: 450, y: 30, r: 25, o: 0.08 },
                { x: 520, y: 150, r: 50, o: 0.05 }
            ];
            circles.forEach(c => {
                doc.circle(c.x, c.y, c.r).fillOpacity(c.o).fill(WHITE);
            });
            doc.restore();

            // Texto "Fatura" no Banner
            doc.fillColor(WHITE).fontSize(48).font('Helvetica-Bold').text('Fatura', 50, 100);

            // --- 2. METADADOS E LOGO ---
            const contentX = 50;
            const contentWidth = 495;
            let currentY = 220;

            doc.fillColor(SLATE_DARK).fontSize(18).font('Helvetica-Bold').text(`#${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, contentX, currentY);
            doc.fillColor(SLATE_LIGHT).fontSize(10).font('Helvetica').text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), contentX, currentY + 22);

            // Logo RARES sutil no topo direito do conteúdo
            doc.fillColor(OLIVE_DARK).fontSize(16).font('Helvetica-Bold').text('RARES360', 450, currentY, { align: 'right' });

            // Watermark Centralizada
            doc.save();
            doc.fillOpacity(0.03).fillColor(OLIVE_DARK).fontSize(100).font('Helvetica-Bold');
            doc.rotate(-45, { origin: [300, 420] });
            doc.text('RARES360', 100, 420, { align: 'center' });
            doc.restore();

            currentY += 60;

            // --- 3. SEÇÃO PAGADOR E EMISSOR ---
            doc.fillColor(OLIVE_DARK).fontSize(8).font('Helvetica-Bold').text('PAGADOR', contentX, currentY);
            doc.text('PAGÁVEL PARA', 300, currentY);

            doc.fillColor(SLATE_DARK).fontSize(11).font('Helvetica-Bold').text(data.razaoSocial.toUpperCase(), contentX, currentY + 14);
            doc.text('RARES360 SOLUÇÕES DIGITAIS', 300, currentY + 14);

            doc.font('Helvetica').fontSize(9).fillColor(SLATE_LIGHT);
            doc.text(`CNPJ: ${data.cnpj}`, contentX, currentY + 28);
            doc.text(data.address || 'Endereço não informado', contentX, currentY + 40, { width: 220 });

            doc.text('CNPJ: 62.308.137/0001-65', 300, currentY + 28);
            doc.text('ti.rares@rares360.com.br', 300, currentY + 40);
            doc.text(`Vencimento: ${new Date(new Date().getTime() + 5*24*60*60*1000).toLocaleDateString('pt-BR')}`, 300, currentY + 52);

            currentY += 100;

            // --- 4. SISTEMA DE TABELAS DUPLAS ---
            
            // Tabela 1: SERVIÇOS
            const drawTable = (title: string, items: any[], top: number) => {
                doc.rect(contentX, top, contentWidth, 30).fill(OLIVE_DARK);
                doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold');
                doc.text(title, contentX + 15, top + 11);
                doc.text('DESCRIÇÃO DETALHADA', contentX + 150, top + 11);
                doc.text('PREÇO UN.', contentX + 350, top + 11, { width: 60, align: 'right' });
                doc.text('TOTAL', contentX + 420, top + 11, { width: 60, align: 'right' });

                let y = top + 30;
                items.forEach((item, index) => {
                    doc.rect(contentX, y, contentWidth, 40).fill(index % 2 === 0 ? WHITE : BEIGE);
                    doc.fillColor(SLATE_DARK).fontSize(9).font('Helvetica-Bold').text(item.name, contentX + 15, y + 12);
                    doc.fillColor(SLATE_LIGHT).fontSize(8).font('Helvetica').text(item.desc, contentX + 15, y + 24);
                    
                    doc.fillColor(SLATE_DARK).fontSize(9).text(`R$ ${item.unit.toFixed(2)}`, contentX + 350, y + 15, { width: 60, align: 'right' });
                    doc.text(`R$ ${item.total.toFixed(2)}`, contentX + 420, y + 15, { width: 60, align: 'right' });
                    y += 40;
                });
                return y;
            };

            const serviceItems = [
                { 
                    name: 'Manutenção SaaS', 
                    desc: `Licenciamento por Usuário (${data.userCount} usuários ativos)`, 
                    unit: data.pricePerUser, 
                    total: data.monthlyFee || (data.userCount * data.pricePerUser) 
                }
            ];

            currentY = drawTable('SERVIÇOS', serviceItems, currentY);
            currentY += 20;

            if (data.setupValue > 0) {
                const parcelaVl = data.setupValue / data.setupInstallments;
                const residual = data.setupRemaining;
                const atual = data.setupInstallments - residual + 1;
                
                if (atual <= data.setupInstallments) {
                    const implItems = [
                        { 
                            name: 'Setup / Consultoria', 
                            desc: `Implementação Estratégica (Parcela ${atual.toString().padStart(2, '0')}/${data.setupInstallments.toString().padStart(2, '0')})`, 
                            unit: parcelaVl, 
                            total: parcelaVl 
                        }
                    ];
                    currentY = drawTable('IMPLEMENTAÇÃO', implItems, currentY);
                }
            }

            // --- 5. SUMÁRIO FINANCEIRO ---
            currentY += 30;
            doc.fillColor(SLATE_LIGHT).fontSize(10).font('Helvetica').text('Subtotal:', 350, currentY, { width: 100, align: 'right' });
            doc.fillColor(SLATE_DARK).font('Helvetica-Bold').text(`R$ ${data.total.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });
            
            currentY += 18;
            doc.fillColor(SLATE_LIGHT).font('Helvetica').text('Impostos (0%):', 350, currentY, { width: 100, align: 'right' });
            doc.fillColor(SLATE_DARK).font('Helvetica-Bold').text('R$ 0,00', 460, currentY, { width: 85, align: 'right' });

            currentY += 25;
            doc.fontSize(22).fillColor(SLATE_DARK).text('TOTAL', 350, currentY, { width: 100, align: 'right' });
            doc.text(`R$ ${data.total.toFixed(2)}`, 460, currentY, { width: 100, align: 'right' });

            // --- 6. DYNAMIC PIX AREA ---
            if (data.status === 'PENDENTE') {
                const pixY = 650;
                doc.rect(480, pixY, 70, 70).fill('#F0F0F0');
                doc.fillColor(SLATE_LIGHT).fontSize(6).text('QR CODE PIX', 480, pixY + 30, { width: 70, align: 'center' });
                doc.fillColor(OLIVE_DARK).fontSize(8).font('Helvetica-Bold').text('AGUARDANDO PAGAMENTO', 410, pixY + 75, { width: 140, align: 'right' });
            }

            // --- 7. FOOTER SÓLIDO ---
            doc.rect(0, 760, 595, 82).fill(OLIVE_DARK);
            doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold').text('RARES360 CO.', 50, 780);
            doc.font('Helvetica').fontSize(8).fillOpacity(0.8);
            doc.text('ti.rares@rares360.com.br', 50, 795);
            doc.text('www.rares360.com.br', 50, 805);

            doc.fillOpacity(1).fontSize(8).text(
                'Obrigado por escolher nossos serviços! Caso tenha dúvidas sobre cobranças, entre em contato pelo e-mail acima.',
                300, 785, { width: 250, align: 'right' }
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
