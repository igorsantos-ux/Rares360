# 📘 RUNBOOK — Rares360 Operations

Este runbook lista os procedimentos essenciais para manter o Rares360 com 99.5% de uptime (máx. 3.6h downtime/mês), usando Easypanel + Docker.

---

## 🚀 1. Deploy Operations

### 1.1 Deploy Padrão (CI/CD)
O deploy é automatizado de `master` usando o **GitHub Actions** (`.github/workflows/ci.yml`). 
1. O dev aprova o PR para `master`.
2. O GHA roda `tsc`, `npm audit`, `trivy` (container scan).
3. Estando green, um webhook chama o Easypanel para dar trigger no build/deploy automático (zero-downtime rolling update via Docker healthchecks).

### 1.2 Rollback
Se uma release falhar o Health Check ou causar taxa de 5xx elevada:
1. Voltar commit anterior: `git revert HEAD`
2. Arriscar: `git push origin master`.
3. Ou, no Easypanel **Deployments > Rebuild from previous image**.

---

## 💾 2. Backup e Restore (PostgreSQL)

*SLA de RTO (Recovery Time Obj): 1h | RPO (Recovery Point Obj): 24h*

### 2.1 Backups Manuais (Easypanel)
No Easypanel vá em `Services > db > Backups` e clique em `Create Backup`.
Para baixar o dump, clique em `Download`.

### 2.2 Restore
1. Acesse o Easypanel.
2. `Services > db > Backups`.
3. Encontre o ponto desejado de restauração.
4. Clique em `Restore`. **Atenção:** isso sobscreve o banco atual e deve ser feito em janela de manutenção.

---

## 📡 3. Diagnóstico e Resposta a Incidentes (Incident Response)

### 3.1 Serviço Lento (Alta Latência p95 > 2s)
- **Causa Comum:** N+1 Query no banco ou picos de tráfego.
- **Ação:**
  1. Verificar métricas `.api/metrics`
  2. Subir réplicas no docker (aumentar `scale` da API no Easypanel)
  3. Checar status da Memória do PostgreSQL / IOPS de disco.

### 3.2 IA Independente caindo (Gemini / DreController)
- O **Circuit Breaker** (na rota DRE) vai abrir automaticamente (status 503 local / fallback JSON) em 3 falhas consecutivas e rearmar em 60s. 
- A aplicação continuará 100% de pé com alertas amigáveis "IA Offline".
- Ação: validar Google Cloud Quotas dashboard se continuar por muito tempo.

### 3.3 Logs (Distributed Tracing)
Toda request recebe um header `X-Request-ID`. Para rastrear onde uma solicitação parou:
```bash
docker logs <api-container> | grep "X-Request-ID=1234-abcd"
```
Logs são obrigatoriamente estruturados em Object JSON, facilitando ingestão em ferramentas como Loki/Datadog.

---

## 🛡️ 4. Gestão de Secrets e Certificados

*   **Secrets:** Estritamente proibido colocar na repo via `.env`. Usar a interface do **Environment** do Easypanel. O Dockerfile injeta as variáveis seguras em tempo de container no build.
*   **Renovação SSL:** Tráfego do host Nginx (Frontend) e load balancer gerenciado. Let's Encrypt roda via ACME renovação `< 14 dias`.

---

## 🔒 5. Segurança da Borda

- WAF: Deve-se rotear a zona de NS para o **Cloudflare** via proxy (Nuvem laranja ligada), ativando **Bot Fight Mode** e OWASP Ruleset mínimo. Rate-limiting complementa a App logic. O Nginx no `vHost` não responde a IP sujo escaneando fora do TLD aprovado.

---

## ⚡ 6. Redis (Performance & Session Security)

O Redis é usado como camada de cache e para a Blacklist de tokens invalidados.

### 6.1 Configuração
- **Variável:** `REDIS_URL` (Ex: `redis://redis:6379`)
- **Fallback:** Se o Redis estiver fora, o sistema entra em modo de resiliência. O cache é ignorado e a validação de blacklist de logout é desativada para manter a disponibilidade da plataforma.

### 6.2 Monitoramento
Para limpar o cache manualmente via CLI (dentro do container api):
```bash
redis-cli -u $REDIS_URL FLUSHALL
```
- **Blacklist de Tokens:** Tokens invalidados ficam no Redis por 8h (tempo máximo de sessão).
- **Cache de Rotas:** Dashboard e DRE usam cache de 5-15 min. No Easypanel, monitore o consumo de memória do Redis; 64MB-128MB costumam ser suficientes para o Rares360.
