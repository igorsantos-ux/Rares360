import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

async function generateCommercialProposal() {
    const doc = new PDFDocument({ 
        margin: 0, 
        size: 'A4',
        info: {
            Title: 'Proposta Comercial - Rares360 Excellence',
            Author: 'RARES360',
        }
    });

    const outputPath = path.resolve('C:/Users/Igor/.gemini/antigravity/brain/f29bb4aa-18aa-472f-aa74-0a09a3ac23e9/proposta_comercial_rares360.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Cores Corporativas
    const OLIVE_DARK = '#556B2F';
    const OLIVE_SOFT = '#8A9A5B';
    const BEIGE = '#FAF9F6';
    const SLATE_DARK = '#1a202c';
    const SLATE_LIGHT = '#718096';
    const WHITE = '#FFFFFF';

    // --- 1. CAPA ---
    doc.rect(0, 0, 595, 842).fill(OLIVE_DARK);

    // Detalhe visual (círculos)
    doc.save();
    doc.fillOpacity(0.1);
    doc.circle(595, 0, 300).fill(WHITE);
    doc.circle(0, 842, 200).fill(WHITE);
    doc.restore();

    doc.fillColor(WHITE).fontSize(40).font('Helvetica-Bold').text('RARES360', 50, 350);
    doc.fontSize(20).font('Helvetica').text('EXCELLENCE PROGRAM', 50, 400);
    doc.fontSize(14).text('Proposta de Gestão & Inteligência Financeira', 50, 430);

    doc.fontSize(12).text('Preparado para: Clínica de Especialidades Exemplo', 50, 700);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 50, 720);

    // --- 2. PÁGINA 2: O PROGRAMA ---
    doc.addPage().fillColor(BEIGE).rect(0, 0, 595, 842).fill();
    
    doc.fillColor(OLIVE_DARK).fontSize(24).font('Helvetica-Bold').text('O Programa Excellence', 50, 50);
    doc.rect(50, 85, 50, 5).fill(OLIVE_DARK);

    let currentY = 120;
    doc.fillColor(SLATE_DARK).fontSize(12).font('Helvetica');
    doc.text('Muito mais que um software, o programa Rares360 Excellence é uma parceria estratégica para transformar dados em lucro real.', 50, currentY, { width: 500 });
    
    currentY += 60;
    const features = [
        { t: 'Auditoria White-Glove', d: 'Análise profunda do seu histórico financeiro de 3 anos para identificar gargalos.' },
        { t: 'Business Intelligence', d: 'Dashboards customizados para tomada de decisão baseada em dados, não em palpites.' },
        { t: 'Acompanhamento Mensal', d: 'Reuniões consultivas de diretoria para análise de performance e metas de lucro.' }
    ];

    features.forEach(f => {
        doc.fillColor(OLIVE_DARK).fontSize(14).font('Helvetica-Bold').text(f.t, 50, currentY);
        doc.fillColor(SLATE_LIGHT).fontSize(11).font('Helvetica').text(f.d, 50, currentY + 18);
        currentY += 60;
    });

    // --- 3. PÁGINA 3: POR QUE RARES360? (VALOR) ---
    doc.addPage().fillColor(WHITE).rect(0, 0, 595, 842).fill();
    doc.fillColor(OLIVE_DARK).fontSize(24).font('Helvetica-Bold').text('Por que o Rares360?', 50, 50);
    
    currentY = 110;
    const valuePillars = [
        { 
            t: '1. Recuperação de Receita Especializada', 
            d: 'Clínicas de alto faturamento perdem de 2% a 5% em glosas e erros de fluxo. Nossa inteligência identifica esses "ralos" imediatamente.' 
        },
        { 
            t: '2. Visão de Lucratividade Real', 
            d: 'Saber o faturamento é fácil. O Rares360 mostra o LUCRO LÍQUIDO por médico e por procedimento, descontando todos os custos fixos e variáveis.' 
        },
        { 
            t: '3. Gestão de LTV (Life Time Value)', 
            d: 'Entenda quem são seus pacientes mais valiosos e direcione seu marketing para atrair perfis similares, otimizando o CAC.' 
        },
        { 
            t: '4. Eliminação da Dependência de Planilhas', 
            d: 'Centralizamos CRM, Agenda e Financeiro. Dados integrados significam decisões mais rápidas e seguras para os sócios.' 
        }
    ];

    valuePillars.forEach(p => {
        doc.fillColor(OLIVE_DARK).fontSize(13).font('Helvetica-Bold').text(p.t, 50, currentY);
        doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica').text(p.d, 50, currentY + 18, { width: 500 });
        currentY += 65;
    });

    doc.rect(50, currentY + 10, 495, 80).fill(BEIGE);
    doc.fillColor(OLIVE_DARK).fontSize(12).font('Helvetica-Bold').text('O ARGUMENTO DO ROI', 70, currentY + 25);
    doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica').text('Para uma clínica que fatura R$ 500k/mês, os serviços Rares360 representam menos de 1% do faturamento, com potencial de retorno de 5x a 10x este valor em eficiência operacional.', 70, currentY + 42, { width: 450 });

    // --- 4. PÁGINA 4: INVESTIMENTO ---
    doc.addPage().fillColor(WHITE).rect(0, 0, 595, 842).fill();
    doc.fillColor(OLIVE_DARK).fontSize(24).font('Helvetica-Bold').text('Investimento Sugerido', 50, 50);

    currentY = 120;
    // Box de Setup
    doc.rect(50, currentY, 495, 100).fill(BEIGE);
    doc.fillColor(OLIVE_DARK).fontSize(10).font('Helvetica-Bold').text('IMPLEMENTAÇÃO (SETUP EXCELLENCE)', 70, currentY + 20);
    doc.fillColor(SLATE_DARK).fontSize(28).text('R$ 30.000,00', 70, currentY + 40);
    doc.fillColor(SLATE_LIGHT).fontSize(9).font('Helvetica').text('Pagamento único na contratação (Opções de parcelamento sob consulta)', 70, currentY + 75);

    currentY += 130;
    // Box de Mensalidade
    doc.rect(50, currentY, 495, 100).fill(OLIVE_DARK);
    doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold').text('LICENCIAMENTO + CONSULTORIA MENSAL', 70, currentY + 20);
    doc.fontSize(28).text('R$ 4.500,00', 70, currentY + 40);
    doc.fillOpacity(0.8).fontSize(9).font('Helvetica').text('Valor fixo mensal para acesso ilimitado e 01 reunião mensal de performance.', 70, currentY + 75);

    doc.end();
    
    return new Promise((resolve) => {
        stream.on('finish', () => {
            console.log('PDF Gerado em:', outputPath);
            resolve(outputPath);
        });
    });
}

generateCommercialProposal().catch(console.error);
