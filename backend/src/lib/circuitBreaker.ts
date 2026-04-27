/**
 * ═══════════════════════════════════════════
 * Circuit Breaker — Rares360 Resilience Layer
 * ═══════════════════════════════════════════
 * Protege serviços externos (Gemini, Email) contra falhas em cascata.
 * Estados: CLOSED → OPEN → HALF_OPEN
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
    name: string;
    failureThreshold?: number;   // Falhas para abrir o circuito (default: 3)
    resetTimeout?: number;       // Tempo em ms para tentar novamente (default: 60s)
    requestTimeout?: number;     // Timeout por request em ms (default: 10s)
}

interface CircuitBreakerStats {
    state: CircuitState;
    failures: number;
    lastFailure: Date | null;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
}

export class CircuitBreaker {
    private state: CircuitState = 'CLOSED';
    private failures = 0;
    private lastFailureTime: number = 0;
    private readonly name: string;
    private readonly failureThreshold: number;
    private readonly resetTimeout: number;
    private readonly requestTimeout: number;

    // Métricas
    private totalRequests = 0;
    private totalFailures = 0;
    private totalSuccesses = 0;

    constructor(options: CircuitBreakerOptions) {
        this.name = options.name;
        this.failureThreshold = options.failureThreshold ?? 3;
        this.resetTimeout = options.resetTimeout ?? 60_000;
        this.requestTimeout = options.requestTimeout ?? 10_000;
    }

    async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
        this.totalRequests++;

        // Se o circuito está OPEN, verificar se deve tentar HALF_OPEN
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log(`[CircuitBreaker:${this.name}] 🔄 Transitando para HALF_OPEN`);
            } else {
                console.warn(`[CircuitBreaker:${this.name}] ⚡ Circuito ABERTO — retornando fallback`);
                if (fallback) return fallback();
                throw new Error(`[CircuitBreaker:${this.name}] Serviço indisponível temporariamente`);
            }
        }

        try {
            // Executar com timeout
            const result = await Promise.race([
                fn(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout: ${this.requestTimeout}ms`)), this.requestTimeout)
                ),
            ]);

            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            if (fallback) return fallback();
            throw error;
        }
    }

    private onSuccess(): void {
        this.totalSuccesses++;
        if (this.state === 'HALF_OPEN') {
            console.log(`[CircuitBreaker:${this.name}] ✅ Recuperado — circuito FECHADO`);
        }
        this.failures = 0;
        this.state = 'CLOSED';
    }

    private onFailure(): void {
        this.totalFailures++;
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            console.error(`[CircuitBreaker:${this.name}] 🔴 Circuito ABERTO após ${this.failures} falhas`);
        }
    }

    getStats(): CircuitBreakerStats {
        return {
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
            totalRequests: this.totalRequests,
            totalFailures: this.totalFailures,
            totalSuccesses: this.totalSuccesses,
        };
    }

    getState(): CircuitState {
        // Check if should transition from OPEN to HALF_OPEN
        if (this.state === 'OPEN' && Date.now() - this.lastFailureTime >= this.resetTimeout) {
            return 'HALF_OPEN';
        }
        return this.state;
    }
}

// ═══ Instâncias Globais ═══

export const geminiCircuitBreaker = new CircuitBreaker({
    name: 'Gemini',
    failureThreshold: 3,
    resetTimeout: 60_000,     // 1 minuto
    requestTimeout: 10_000,   // 10 segundos
});

export const emailCircuitBreaker = new CircuitBreaker({
    name: 'Email',
    failureThreshold: 3,
    resetTimeout: 120_000,    // 2 minutos
    requestTimeout: 5_000,    // 5 segundos
});
