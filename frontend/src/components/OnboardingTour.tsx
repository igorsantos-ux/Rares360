import Joyride, { STATUS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

export const OnboardingTour = () => {
    const { user, completeOnboarding: markAsSeenInContext } = useAuth();
    
    // Só mostramos se o usuário existir e NÃO tiver visto o onboarding
    const shouldStart = user && !user.hasSeenOnboarding;

    const steps: Step[] = [
        {
            target: '#ritmo-meta',
            title: '🚀 O Coração Estratégico',
            content: 'Este é o seu Ritmo da Meta. Ele diz exatamente quanto você precisa faturar por dia para chegar ao seu objetivo. Se ficar vermelho, é hora de agir!',
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '#fechamento-caixa',
            title: '🔐 O Cofre Blindado',
            content: 'Aqui você audita o dia. Uma vez encerrado, os dados são lacrados. Segurança e integridade total para o seu financeiro.',
            placement: 'right',
        },
        {
            target: '#estoque-insumos',
            title: '💉 Fluxo Real de Insumos',
            content: 'Venda é dinheiro, Execução é gasto. O estoque só baixa quando o procedimento é realizado. Controle real, sem perdas invisíveis.',
            placement: 'right',
        },
        {
            target: '#tarefas-dia',
            title: '📞 Seu Comercial Ativo',
            content: 'Procedimentos executados geram retornos automáticos aqui. Abra esta tela toda manhã e saiba para quem ligar hoje.',
            placement: 'right',
        },
        {
            target: '#documentos-compliance',
            title: '🛡️ Blindagem Jurídica',
            content: 'Sua clínica em dia com as normas. Já sugerimos os documentos obrigatórios para você nunca ser pego de surpresa.',
            placement: 'right',
        }
    ];

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            try {
                await authApi.completeOnboarding();
                markAsSeenInContext();
                console.log('✅ Onboarding concluído com sucesso.');
            } catch (error) {
                console.error('Falha ao salvar estado do onboarding:', error);
            }
        }
    };

    if (!shouldStart) return null;

    return (
        <Joyride
            steps={steps}
            callback={handleJoyrideCallback}
            continuous
            showProgress
            showSkipButton
            styles={{
                options: {
                    arrowColor: '#FFF',
                    backgroundColor: '#FFF',
                    overlayColor: 'rgba(0, 0, 0, 0.4)',
                    primaryColor: '#8A9A5B',
                    textColor: '#1A202C',
                    zIndex: 1000,
                },
                tooltip: {
                    borderRadius: '2rem',
                    padding: '2rem',
                    boxShadow: '0 25px 50px -12px rgba(138, 154, 91, 0.25)',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                tooltipTitle: {
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    color: '#697D58',
                    marginBottom: '0.5rem',
                    fontFamily: 'Outfit, sans-serif'
                },
                tooltipContent: {
                    fontSize: '0.9rem',
                    color: '#64748B',
                    lineHeight: '1.6',
                    fontWeight: 500
                },
                buttonNext: {
                    backgroundColor: '#8A9A5B',
                    borderRadius: '1rem',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    padding: '0.75rem 1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                },
                buttonBack: {
                    color: '#94A3B8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginRight: '1rem'
                },
                buttonSkip: {
                    color: '#94A3B8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                }
            }}
            locale={{
                back: 'Voltar',
                close: 'Fechar',
                last: 'Começar Agora',
                next: 'Próximo',
                skip: 'Pular Tour'
            }}
        />
    );
};
