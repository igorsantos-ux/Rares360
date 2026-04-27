/**
 * ═══════════════════════════════════════════
 * Load Test — Rares360 (k6)
 * ═══════════════════════════════════════════
 * Simula 200 usuários simultâneos com cenários realistas.
 * 
 * Executar:
 *   k6 run k6/load-test.js
 * 
 * Requisitos:
 *   - k6 instalado (https://k6.io/docs/get-started/installation/)
 *   - Variável de ambiente BASE_URL definida (default: http://localhost:3001/api)
 *   - Variável de ambiente TEST_EMAIL e TEST_PASSWORD para login
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ═══ Custom Metrics ═══
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const dashboardDuration = new Trend('dashboard_duration', true);

// ═══ Configuration ═══
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'admin@rares360.com.br';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'admin123';

export const options = {
    scenarios: {
        // Cenário 1: Ramp-up gradual até 200 VUs
        load_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 50 },    // Subir para 50 VUs em 30s
                { duration: '1m', target: 100 },    // Subir para 100 VUs em 1min
                { duration: '2m', target: 200 },    // Pico: 200 VUs por 2min
                { duration: '1m', target: 100 },    // Descer para 100 VUs
                { duration: '30s', target: 0 },      // Cool-down
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1500'],  // 95% < 500ms, 99% < 1.5s
        errors: ['rate<0.01'],                            // Error rate < 1%
        login_duration: ['p(95)<1000'],                   // Login p95 < 1s
        dashboard_duration: ['p(95)<2000'],               // Dashboard p95 < 2s
    },
};

export default function () {
    let token = '';

    // ═══ Cenário: Login ═══
    group('01_Login', function () {
        const loginStart = Date.now();
        const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        loginDuration.add(Date.now() - loginStart);

        check(loginRes, {
            'login status 200': (r) => r.status === 200,
            'login retorna token': (r) => JSON.parse(r.body).token !== undefined,
        }) || errorRate.add(1);

        if (loginRes.status === 200) {
            token = JSON.parse(loginRes.body).token;
        }
    });

    if (!token) return; // Abort se login falhou

    const authHeaders = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    };

    sleep(1);

    // ═══ Cenário: Dashboard ═══
    group('02_Dashboard', function () {
        const dashStart = Date.now();
        const dashRes = http.get(`${BASE_URL}/reporting/dashboard`, authHeaders);
        dashboardDuration.add(Date.now() - dashStart);

        check(dashRes, {
            'dashboard status 200': (r) => r.status === 200,
        }) || errorRate.add(1);
    });

    sleep(0.5);

    // ═══ Cenário: Listagem de Pacientes ═══
    group('03_Patients', function () {
        const patientsRes = http.get(`${BASE_URL}/core/patients`, authHeaders);
        check(patientsRes, {
            'patients status 200': (r) => r.status === 200,
        }) || errorRate.add(1);
    });

    sleep(0.5);

    // ═══ Cenário: Transações Financeiras ═══
    group('04_Financial', function () {
        const finRes = http.get(`${BASE_URL}/financial/summary`, authHeaders);
        check(finRes, {
            'financial summary status 200': (r) => r.status === 200,
        }) || errorRate.add(1);
    });

    sleep(0.5);

    // ═══ Cenário: Tasks CRM ═══
    group('05_CRM_Tasks', function () {
        const tasksRes = http.get(`${BASE_URL}/tasks/crm`, authHeaders);
        check(tasksRes, {
            'crm tasks status 200': (r) => r.status === 200,
        }) || errorRate.add(1);
    });

    sleep(0.5);

    // ═══ Cenário: Health Check ═══
    group('06_Health', function () {
        const healthRes = http.get(`${BASE_URL}/health`);
        check(healthRes, {
            'health status 200': (r) => r.status === 200,
            'health is healthy': (r) => {
                const body = JSON.parse(r.body);
                return body.status === 'healthy' || body.status === 'degraded';
            },
        }) || errorRate.add(1);
    });

    sleep(1 + Math.random() * 2); // Simular think time humano (1-3s)
}
