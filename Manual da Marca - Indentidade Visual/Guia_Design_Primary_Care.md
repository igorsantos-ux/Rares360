# Guia de Design System - Primary Care

Este guia detalha a estrutura visual e técnica extraída do site [Primary Care](https://www.helloprimary.care/en-eu).

> [!IMPORTANT]
> Este guia contém as cores originais do site Primary Care. Para o projeto Heath Finance, você deve substituir as cores abaixo pelos códigos HEX encontrados no seu manual da marca (Moss Green, Reseda Green, Eggshell, Dun).

## 1. Paleta de Cores (Original Primary Care)
A paleta original combina um amarelo vibrante com tons de ameixa profundo (plum) e fundos neutros.

| Categoria | Tipo | Hexadecimal | Uso Sugerido |
| :--- | :--- | :--- | :--- |
| **Primária** | Ação (CTA) | `#EFC712` | Botões de destaque, ícones de serviço e estados ativos. |
| **Secundária** | Texto/Branding | `#3A1C33` | Títulos principais (H1, H2), botões de ação e rodapé. |
| **Apoio** | Muted Text | `#3A1C33B3` | Textos secundários e descrições (70% de opacidade). |
| **Background** | Clean | `#FFFFFF` | Fundo principal da página e seções Hero. |
| **Surface** | Neutro | `#F5F5F5` | Fundo de cards de serviço e seções de destaque. |
| **Accent 1** | Soft Pink | `#F8D4EA` | Background de cards específicos ou tags. |
| **Accent 2** | Soft Blue | `#CCD6F8` | Detalhes visuais e categorização. |

## 2. Tipografia
O site utiliza a família de fontes **Brockmann**, conferindo uma estética moderna e profissional.

```css
:root {
  --font-family-base: 'Brockmann', system-ui, sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
}

/* Escala Hierárquica */
h1 {
  font-size: 80px;
  line-height: 1.1; /* 88px */
  font-weight: 600;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 54px;
  line-height: 1.2;
  font-weight: 500;
}

h3 {
  font-size: 40px;
  line-height: 1.2;
  font-weight: 500;
}

body {
  font-size: 18px;
  line-height: 1.5;
  font-weight: 400;
  color: #3a1c33;
}
```

## 3. Componentes Principais

### Header (Navegação)
- **Comportamento:** Sticky (fixo no topo).
- **Estilo:** Fundo transparente que transita para branco ou amarelo (`#EFC712`) no scroll.
- **Botões:** O CTA principal "Find my practice" utiliza fundo `#3A1C33` e `border-radius: 10px`.

### Hero Section
- **Alinhamento:** Conteúdo textual alinhado à esquerda com imagens/ilustrações de apoio grandes.
- **Espaçamento:** Padding vertical amplo (~120px) para criar uma sensação de luxo e respiro.

### Cards de Serviço
```css
.card-service {
  background-color: #f5f5f5;
  border-radius: 20px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease;
}
```

## 4. Estrutura de Layout e Grid
- **Container Máximo:** `1208px`.
- **Gaps do Grid:** `8px` a `12px` entre elementos de lista.
- **Margens de Seção:** Espaçamento vertical padrão de `120px` entre grandes blocos de conteúdo.

## 5. Assets (Ativos Visuais)
- **Logotipo:** Implementado via SVG vetorial estruturado.
- **Ícones:** Estilo minimalista, geralmente na cor `#3A1C33` ou `#EFC712`.
- **Imagens:** Formato WebP otimizado com bordas arredondadas suaves (`20px`).

---
Este guia foi gerado para fins de referência de desenvolvimento front-end e UX/UI para o projeto Heath Finance.
