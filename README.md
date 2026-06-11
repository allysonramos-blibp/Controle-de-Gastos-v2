# 💰 Controle de Gastos — v2.0

Sistema de controle financeiro pessoal com backend Spring Boot modernizado e frontend React.

---

## Stack

| Camada     | Tecnologia                                      |
|------------|-------------------------------------------------|
| Backend    | Java 21 · Spring Boot 3.4 · Spring Security 6  |
| Auth       | JWT real (jjwt 0.12)                            |
| Banco      | PostgreSQL 15+                                  |
| Frontend   | React 18 · TypeScript · Vite · Tailwind CSS 3  |
| Charts     | Recharts                                        |

---

## Pré-requisitos

- Java 21+
- Maven 3.9+
- Node.js 20+
- PostgreSQL rodando localmente

---

## 🗄️ Banco de dados

Crie o banco antes de iniciar:

```sql
CREATE DATABASE controlegastos;
```

As tabelas são criadas automaticamente pelo Hibernate (`ddl-auto=update`).

---

## ⚙️ Backend

```bash
cd backend

# Ajuste credenciais se necessário em:
# src/main/resources/application.properties

mvn spring-boot:run
```

A API sobe em `http://localhost:8080`.

### Endpoints principais

| Método | Rota                          | Descrição                        |
|--------|-------------------------------|----------------------------------|
| POST   | /api/auth/cadastrar           | Criar conta                      |
| POST   | /api/auth/login               | Login → retorna JWT              |
| GET    | /api/transacoes               | Listar todas as transações       |
| GET    | /api/transacoes/filtro        | Filtrar por ?mes=&ano=           |
| POST   | /api/transacoes               | Criar (suporta parcelamento)     |
| PUT    | /api/transacoes/{id}          | Editar                           |
| DELETE | /api/transacoes/{id}          | Excluir                          |
| GET    | /api/faturas/buscar           | Buscar/criar fatura por ?mes=&ano= |
| POST   | /api/faturas/{id}/pagar       | Pagar fatura                     |
| GET    | /api/dashboard                | Resumo financeiro do mês         |

Todas as rotas (exceto `/api/auth/**`) exigem header:
```
Authorization: Bearer <token>
```

---

## 🖥️ Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

O Vite faz proxy automático de `/api` → `http://localhost:8080`, então não há problema de CORS no desenvolvimento.

Para build de produção:

```bash
npm run build
# Os arquivos ficam em frontend/dist/
# Pode ser servido pelo próprio Spring Boot copiando dist/ para src/main/resources/static/
```

---

## 🔑 Variáveis de ambiente (produção)

Em produção, substitua as configs do `application.properties` por variáveis de ambiente:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/controlegastos
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=suasenha
JWT_SECRET=sua_chave_secreta_longa_aqui
```

---

## O que foi melhorado na v2.0

### Backend
- ✅ JWT real com `jjwt 0.12` (substituiu token simulado)
- ✅ `JwtFilter` corretamente registrado na cadeia do Spring Security
- ✅ Autenticação stateless com `SecurityContextHolder`
- ✅ Todos os endpoints protegidos por usuário (multi-tenant)
- ✅ `GlobalExceptionHandler` centralizado com respostas padronizadas
- ✅ Remoção do `LoginResponse` duplicado
- ✅ `BigDecimal` em vez de `double` para valores monetários
- ✅ `DashboardService` com resumo mensal e gastos por categoria
- ✅ Novo endpoint `/api/dashboard`
- ✅ Java 21 (era 17)

### Frontend
- ✅ React 18 + TypeScript + Vite (substituiu HTML puro)
- ✅ Roteamento com React Router v6
- ✅ Autenticação com contexto React + interceptor Axios
- ✅ Dark theme profissional com Tailwind
- ✅ Dashboard com gráficos (barras 6 meses + pizza por categoria)
- ✅ CRUD completo de transações com filtros e busca
- ✅ Parcelamento integrado no modal de nova transação
- ✅ Gerenciamento de faturas com histórico
- ✅ IPs hardcoded removidos (proxy Vite)
- ✅ Toast notifications (react-hot-toast)
- ✅ Loading states e animações
