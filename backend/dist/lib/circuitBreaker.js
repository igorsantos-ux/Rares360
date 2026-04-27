/**
 * ═══════════════════════════════════════════
 * Circuit Breaker — Rares360 Resilience Layer
 * ═══════════════════════════════════════════
 * Protege serviços externos (Gemini, Email) contra falhas em cascata.
 * Estados: CLOSED → OPEN → HALF_OPEN
 */
export class CircuitBreaker {
    state = 'CLOSED';
    failures = 0;
    lastFailureTime = 0;
    name;
    failureThreshold;
    resetTimeout;
    requestTimeout;
    // Métricas
    totalRequests = 0;
    totalFailures = 0;
    totalSuccesses = 0;
    constructor(options) {
        this.name = options.name;
        this.failureThreshold = options.failureThreshold ?? 3;
        this.resetTimeout = options.resetTimeout ?? 60_000;
        this.requestTimeout = options.requestTimeout ?? 10_000;
    }
    async execute(fn, fallback) {
        this.totalRequests++;
        // Se o circuito está OPEN, verificar se deve tentar HALF_OPEN
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log(`[CircuitBreaker:${this.name}] 🔄 Transitando para HALF_OPEN`);
            }
            else {
                console.warn(`[CircuitBreaker:${this.name}] ⚡ Circuito ABERTO — retornando fallback`);
                if (fallback)
                    return fallback();
                throw new Error(`[CircuitBreaker:${this.name}] Serviço indisponível temporariamente`);
            }
        }
        try {
            // Executar com timeout
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${this.requestTimeout}ms`)), this.requestTimeout)),
            ]);
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            if (fallback)
                return fallback();
            throw error;
        }
    }
    onSuccess() {
        this.totalSuccesses++;
        if (this.state === 'HALF_OPEN') {
            console.log(`[CircuitBreaker:${this.name}] ✅ Recuperado — circuito FECHADO`);
        }
        this.failures = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.totalFailures++;
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            console.error(`[CircuitBreaker:${this.name}] 🔴 Circuito ABERTO após ${this.failures} falhas`);
        }
    }
    getStats() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
            totalRequests: this.totalRequests,
            totalFailures: this.totalFailures,
            totalSuccesses: this.totalSuccesses,
        };
    }
    getState() {
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
    resetTimeout: 60_000, // 1 minuto
    requestTimeout: 10_000, // 10 segundos
});
export const emailCircuitBreaker = new CircuitBreaker({
    name: 'Email',
    failureThreshold: 3,
    resetTimeout: 120_000, // 2 minutos
    requestTimeout: 5_000, // 5 segundos
});
