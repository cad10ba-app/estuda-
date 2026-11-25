# 11 — Deploy do PWA (GitHub Pages)

O app é estático (`apps/web/dist`), sem servidor. Publicação via GitHub Actions (`.github/workflows/deploy.yml`).
URL esperada: `https://cad10ba-app.github.io/estuda-/`.

## Publicar (uma vez)
1. Repositório → **Settings → Pages → Source: GitHub Actions**.
2. Fazer o merge da branch de desenvolvimento na `main` (o deploy roda em push na `main`; também pode ser disparado em *Actions → Deploy PWA → Run workflow*, mas o ambiente `github-pages` por padrão só aceita a branch padrão).
3. Aguardar o workflow; a URL aparece no resumo do job.

> Repositório privado: GitHub Pages exige plano pago. Alternativas: tornar o repositório público ou usar Netlify/Cloudflare Pages (build `npm run build`, pasta `apps/web/dist`, sem `VITE_BASE`).

## Instalar no celular
- **Android (Chrome):** abrir a URL → menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
- **iPhone (Safari):** abrir a URL → Compartilhar → *Adicionar à Tela de Início*. (Necessário também para Web Push no futuro.)

## Atualizações
O service worker usa `autoUpdate`: a nova versão é baixada ao abrir o app e passa a valer na abertura seguinte.

## Observações
- Os dados ficam no aparelho (IndexedDB), por origem. Trocar de domínio perde os dados: use *Mais → Privacidade e dados → Exportar* antes.
- Build local com subcaminho: `VITE_BASE=/estuda-/ npm run build -w @estuda/web` e `npx vite preview --base /estuda-/` (em `apps/web`).
- CI (`ci.yml`) roda typecheck, testes e build a cada push.
