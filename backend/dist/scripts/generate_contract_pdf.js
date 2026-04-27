import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
async function generateContractPDF() {
    const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
            Title: 'Contrato de Prestação de Serviços - Rares360 Excellence',
            Author: 'RARES360',
        }
    });
    const outputPath = path.resolve('C:/Users/Igor/.gemini/antigravity/brain/f29bb4aa-18aa-472f-aa74-0a09a3ac23e9/contrato_rares360_excellence.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    // Cores Formais
    const BLACK = '#000000';
    const SLATE = '#334155';
    const OLIVE_TITLE = '#556B2F';
    // --- LOGO / HEADER ---
    doc.fillColor(OLIVE_TITLE).fontSize(16).font('Helvetica-Bold').text('RARES360', { align: 'right' });
    doc.fillColor(SLATE).fontSize(8).font('Helvetica').text('SOLUÇÕES DIGITAIS LTDA | CNPJ 62.308.137/0001-65', { align: 'right' });
    doc.moveDown(2);
    // --- TÍTULO ---
    doc.fillColor(BLACK).fontSize(14).font('Helvetica-Bold').text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SOFTWARE (SaaS) E CONSULTORIA ESTRATÉGICA', { align: 'center' });
    doc.moveDown(2);
    // --- PARTES ---
    doc.fontSize(10).font('Helvetica-Bold').text('CONTRATADA:');
    doc.font('Helvetica').text('RARES360 SOLUÇÕES DIGITAIS LTDA, inscrita no CNPJ sob o nº 62.308.137/0001-65, com sede em [Endereço Completo].');
    doc.moveDown();
    doc.font('Helvetica-Bold').text('CONTRATANTE:');
    doc.font('Helvetica').text('[NOME DA CLÍNICA/RAZÃO SOCIAL], inscrita no CNPJ sob o nº [00.000.000/0000-00], com sede em [Endereço Completo], representada neste ato por [Nome do Representante].');
    doc.moveDown(2);
    const sections = [
        {
            title: 'CLÁUSULA PRIMEIRA - DO OBJETO',
            content: 'O presente contrato tem por objeto o licenciamento de uso do software Rares360, na modalidade SaaS (Software as a Service), englobando módulos de gestão financeira, BI (Business Intelligence), CRM e agendamento, bem como a prestação de serviços de Implementação Estratégica e Acompanhamento de Performance Financeira.'
        },
        {
            title: 'CLÁUSULA SEGUNDA - DOS SERVIÇOS DE IMPLEMENTAÇÃO',
            content: 'A CONTRATADA realizará a implantação "White-Glove", que consiste em: Auditoria e higienização de dados históricos (até 36 meses); Configuração personalizada de centros de custo e categorias de DRE; Treinamento executivo para sócios e gerência.'
        },
        {
            title: 'CLÁUSULA TERCEIRA - DOS VALORES E CONDIÇÕES DE PAGAMENTO',
            content: '3.1. Taxa de Implementação (Setup Excellence): O valor total da implementação é de R$ 30.000,00 (trinta mil reais), pago em [Condição Combinada].\n\n3.2. Mensalidade (Licenciamento e Consultoria): O valor mensal fixo é de R$ 4.500,00 (quatro mil e quinhentos reais), com vencimento todo dia [Data Definida] de cada mês. Inclui direito de uso ilimitado e 01 reunião mensal de performance.'
        },
        {
            title: 'CLÁUSULA QUARTA - DO PRAZO E RESCISÃO',
            content: 'O contrato possui prazo de vigência de 12 (doze) meses. A rescisão antes do prazo implicará em multa de 20% sobre o saldo remanescente. Após 12 meses, a rescisão pode ser solicitada com aviso prévio de 30 dias.'
        },
        {
            title: 'CLÁUSULA QUINTA - DA CONFIDENCIALIDADE E LGPD',
            content: 'Ambas as partes se comprometem a manter sigilo absoluto sobre informações financeiras e dados de pacientes, em total conformidade com a Lei Geral de Proteção de Dados (LGPD).'
        }
    ];
    sections.forEach(s => {
        doc.fillColor(BLACK).fontSize(10).font('Helvetica-Bold').text(s.title);
        doc.font('Helvetica').fontSize(10).text(s.content, { align: 'justify' });
        doc.moveDown();
    });
    // --- ASSINATURAS ---
    doc.moveDown(4);
    const signatureY = doc.y;
    doc.text('__________________________________________', 50, signatureY);
    doc.text('__________________________________________', 330, signatureY);
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('RARES360 SOLUÇÕES DIGITAIS LTDA', 50, signatureY + 15, { width: 220, align: 'center' });
    doc.text('[NOME DA CLÍNICA]', 330, signatureY + 15, { width: 220, align: 'center' });
    doc.end();
    return new Promise((resolve) => {
        stream.on('finish', () => {
            console.log('PDF do Contrato Gerado em:', outputPath);
            resolve(outputPath);
        });
    });
}
generateContractPDF().catch(console.error);
