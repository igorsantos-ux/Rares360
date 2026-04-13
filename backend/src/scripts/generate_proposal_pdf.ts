import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

async function generateCommercialProposal() {
    const doc = new PDFDocument({ 
        margin: 0, 
        size: 'A4',
        info: {
            Title: 'Rares360 Excellence - Proposta Consultiva',
            Author: 'RARES360',
        }
    });

    const outputPath = path.resolve('C:/Users/Igor/.gemini/antigravity/brain/f29bb4aa-18aa-472f-aa74-0a09a3ac23e9/proposta_comercial_rares360.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Cores Corporativas
    const OLIVE_DARK = '#2D3A1A'; // Escurecido para mais luxo
    const OLIVE_MID = '#556B2F';
    const OLIVE_SOFT = '#8A9A5B';
    const BEIGE_BASE = '#FAF9F6';
    const SLATE_DARK = '#0F172A';
    const SLATE_LIGHT = '#64748B';
    const WHITE = '#FFFFFF';

    // --- HELPER PARA GRADIENTES E FUNDOS ---
    const drawGradientBg = (color1: string, color2: string) => {
        doc.rect(0, 0, 595, 842).fill(color1);
        // Simular gradiente com rects de opacidade variável na parte inferior
        for (let i = 0; i < 400; i++) {
            doc.rect(0, 442 + i, 595, 1).fillOpacity(i / 1000).fill(color2);
        }
        doc.fillOpacity(1);
    };

    const drawGeometricElements = (color: string, opacity: number) => {
        doc.save();
        doc.fillOpacity(opacity);
        doc.circle(550, 50, 150).fill(color);
        doc.circle(0, 842, 300).fill(color);
        doc.rect(400, 700, 300, 200).rotate(45).fill(color);
        doc.restore();
    };

    // --- 1. CAPA CINEMATOGRÁFICA ---
    doc.rect(0, 0, 595, 842).fill(SLATE_DARK);
    drawGeometricElements(OLIVE_MID, 0.15);

    doc.fillColor(WHITE).fontSize(12).font('Helvetica').text('RARES360 CO. PRESENTA', 60, 100);
    doc.rect(60, 115, 30, 2).fill(OLIVE_MID);

    doc.fontSize(64).font('Helvetica-Bold').text('Rares360', 60, 320);
    doc.fillColor(OLIVE_SOFT).text('Excellence', 60, 385);
    
    doc.fillColor(WHITE).fontSize(16).font('Helvetica').text('O Cérebro Financeiro da sua Clínica', 60, 470);
    
    doc.fontSize(10).fillOpacity(0.6).text('PROPOSTA ESTRATÉGICA DE INTELIGÊNCIA E PERFORMANCE', 60, 750);
    doc.fillOpacity(1).fontSize(12).text(`${new Date().getFullYear()} @ Todos os direitos reservados.`, 60, 770);

    // --- 2. SUMÁRIO EXECUTIVO: O DESPERDÍCIO INVISÍVEL ---
    doc.addPage().fillColor(BEIGE_BASE).rect(0, 0, 595, 842).fill();
    drawGeometricElements(OLIVE_DARK, 0.03);

    doc.fillColor(OLIVE_DARK).fontSize(28).font('Helvetica-Bold').text('O Desperdício Invisível', 60, 80);
    doc.rect(60, 115, 60, 4).fill(OLIVE_MID);

    let currentY = 160;
    doc.fillColor(SLATE_DARK).fontSize(13).font('Helvetica').lineGap(6);
    doc.text('A maioria das clínicas de alto faturamento possui um "ralo" financeiro não detectado. Falta de integração entre CRM, faturamento e fluxo de caixa gera uma perda silenciosa de até 5% da receita anual.', 60, currentY, { width: 480 });

    currentY += 100;
    doc.fillColor(OLIVE_DARK).fontSize(18).font('Helvetica-Bold').text('Nossa Proposta de Valor', 60, currentY);
    currentY += 40;
    
    const pillars = [
        { t: 'Visibilidade Total', d: 'Dados transformados em dashboards executivos prontos para decisão.' },
        { t: 'Maximização de Lucro', d: 'Identificação cirúrgica de glosas e gargalos operacionais.' },
        { t: 'Gestão Orientada a Dados', d: 'Substituição da intuição por métricas reais de performance.' }
    ];

    pillars.forEach(p => {
        doc.rect(60, currentY, 5, 40).fill(OLIVE_MID);
        doc.fillColor(SLATE_DARK).fontSize(12).font('Helvetica-Bold').text(p.t, 80, currentY + 5);
        doc.fillColor(SLATE_LIGHT).fontSize(10).font('Helvetica').text(p.d, 80, currentY + 22);
        currentY += 60;
    });

    // --- 3. JORNADA EXCELLENCE: AS 4 FASES ---
    doc.addPage().fillColor(WHITE).rect(0, 0, 595, 842).fill();
    doc.rect(0, 0, 595, 200).fill(OLIVE_DARK);
    doc.fillColor(WHITE).fontSize(24).font('Helvetica-Bold').text('A Jornada Excellence', 60, 80);
    doc.fontSize(12).font('Helvetica').fillOpacity(0.8).text('Quatro etapas de transformação estratégica da sua clínica.', 60, 115);
    doc.fillOpacity(1);

    currentY = 250;
    const stages = [
        { n: '01', t: 'Auditoria & Diagnóstico', d: 'Higienização de 3 anos de histórico e identificação de falhas imediatas.' },
        { n: '02', t: 'Estruturação de BI', d: 'Configuração dos dashboards personalizados e centros de custo reais.' },
        { n: '03', t: 'Treinamento de Elite', d: 'Capacitação completa da gerência e sócios na plataforma Rares360.' },
        { n: '04', t: 'Gestão de Escala', d: 'Acompanhamento mensal para garantir o cumprimento das metas de lucro.' }
    ];

    stages.forEach(s => {
        doc.fillColor(OLIVE_DARK).fontSize(32).font('Helvetica-Bold').text(s.n, 60, currentY);
        doc.fillColor(SLATE_DARK).fontSize(16).text(s.t, 120, currentY + 5);
        doc.fillColor(SLATE_LIGHT).fontSize(11).font('Helvetica').text(s.d, 120, currentY + 28, { width: 400 });
        currentY += 100;
        doc.rect(120, currentY - 20, 380, 0.5).fill(BEIGE_BASE);
    });

    // --- 4. DIFERENCIAIS TÉCNICOS ---
    doc.addPage().fillColor(BEIGE_BASE).rect(0, 0, 595, 842).fill();
    doc.fillColor(OLIVE_DARK).fontSize(24).font('Helvetica-Bold').text('Tecnologia a Serviço do Médico', 60, 80);
    
    currentY = 140;
    const techs = [
        { t: 'Multi-Tenant SaaS', d: 'Isolamento completo de dados com criptografia de nível bancário.' },
        { t: 'Inteligência de LTV', d: 'Cálculo dinâmico do valor do paciente e ROI por canal de marketing.' },
        { t: 'Relatórios Automatizados', d: 'Fechamentos mensais enviados diretamente para seu e-mail ou WhatsApp.' }
    ];

    techs.forEach(t => {
        doc.rect(60, currentY, 475, 80).fill(WHITE);
        doc.fillColor(OLIVE_DARK).fontSize(14).font('Helvetica-Bold').text(t.t, 80, currentY + 20);
        doc.fillColor(SLATE_LIGHT).fontSize(10).font('Helvetica').text(t.d, 80, currentY + 40, { width: 420 });
        currentY += 100;
    });

    // --- 5. INVESTIMENTO E ROI ---
    doc.addPage().fillColor(WHITE).rect(0, 0, 595, 842).fill();
    doc.fillColor(OLIVE_DARK).fontSize(28).font('Helvetica-Bold').text('Investimento Sugerido', 60, 80);

    currentY = 160;
    // Card Implantação
    doc.rect(60, currentY, 475, 120).fill(BEIGE_BASE);
    doc.fillColor(OLIVE_DARK).fontSize(10).font('Helvetica-Bold').text('SETUP EXCELLENCE (IMPLEMENTAÇÃO)', 85, currentY + 25);
    doc.fillColor(SLATE_DARK).fontSize(36).text('R$ 30.000,00', 85, currentY + 45);
    doc.fillColor(SLATE_LIGHT).fontSize(9).font('Helvetica').text('Investimento único | Pagamento estruturado em até 3x.', 85, currentY + 90);

    currentY += 150;
    // Card Mensalidade
    doc.rect(60, currentY, 475, 120).fill(OLIVE_DARK);
    doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold').text('LICENCIAMENTO + MENTORIA DE PERFORMANCE', 85, currentY + 25);
    doc.fontSize(36).text('R$ 4.500,00', 85, currentY + 45);
    doc.fillOpacity(0.8).fontSize(9).font('Helvetica').text('Valor mensal fixo para acesso ilimitado e 01 reunião mensal de performance.', 85, currentY + 90);
    doc.fillOpacity(1);

    currentY += 180;
    doc.fillColor(OLIVE_DARK).fontSize(14).font('Helvetica-Bold').text('O Argumento do ROI', 60, currentY);
    doc.fillColor(SLATE_DARK).fontSize(11).font('Helvetica').text('Para clínicas com faturamento superior a R$ 300.000,00 mensais, os serviços Rares360 representam menos de 1.5% do faturamento, com histórico de aumento de 12% na margem líquida no primeiro ano.', 60, currentY + 25, { width: 475 });

    // --- 6. FECHAMENTO ---
    doc.addPage().fillColor(SLATE_DARK).rect(0, 0, 595, 842).fill();
    drawGeometricElements(OLIVE_MID, 0.1);

    doc.fillColor(WHITE).fontSize(32).font('Helvetica-Bold').text('Vamos transformar a gestão da sua clínica?', 60, 300, { width: 475 });
    doc.rect(60, 380, 100, 3).fill(OLIVE_MID);

    doc.fontSize(14).font('Helvetica').text('Aguardamos seu contato para iniciar a jornada Excellence.', 60, 420);
    
    currentY = 650;
    doc.fontSize(10).fillOpacity(0.7).text('RARES360 SOLUÇÕES DIGITAIS', 60, currentY);
    doc.text('ti.rares@rares360.com.br', 60, currentY + 18);
    doc.text('www.rares360.com.br', 60, currentY + 36);

    doc.end();
    
    return new Promise((resolve) => {
        stream.on('finish', () => {
            console.log('PDF Impactante Gerado em:', outputPath);
            resolve(outputPath);
        });
    });
}

generateCommercialProposal().catch(console.error);
