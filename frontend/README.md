# Front-end · Order Management System

SPA em Angular 21 (standalone, sem zone.js). Visão geral do projeto e instruções completas no [README principal](../README.md).

```bash
npm install
npm start      # http://localhost:4200 — /api é encaminhado para http://localhost:8080 (proxy.conf.json)
npm run build  # gera dist/frontend
```

## Estrutura

```
src/app/
├── core/       serviços centrais: API, autenticação (guard + interceptor), toasts, confirmação, tema, tipos
├── shared/     componentes reutilizáveis: modal, campo de formulário, paginador, badge de status, máscaras
├── layout/     shell com menu lateral e barra superior
└── features/   telas: auth, dashboard, pedidos, produtos, clientes, categorias, fornecedores
src/styles/     design system: tokens de cor (claro/escuro), base, componentes, layout
```
