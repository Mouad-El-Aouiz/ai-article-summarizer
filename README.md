# Article Summarizer AI

Application web full-stack qui génère en français un résumé concis d'un article ou d'un PDF. L'utilisateur se connecte avec Google, puis retrouve ses résultats dans un historique privé.

## Fonctionnalités

- Résumé d'articles à partir d'une URL publique
- Extraction et résumé de PDF textuels jusqu'à 10 Mo
- Authentification Google avec Supabase Auth
- Historique personnel protégé par Row Level Security (RLS)
- Régénération et copie rapide d'un résumé
- Interface responsive avec thème clair/sombre
- Validation des entrées, limites de taille et protection contre les URL privées
- Pipeline CI GitHub Actions : lint et build à chaque push/PR

## Stack technique

| Couche | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Supabase Edge Functions, Deno |
| Données et auth | PostgreSQL, Supabase Auth, RLS |
| IA | API Groq, Llama 3.3 70B |
| Déploiement | Netlify + Supabase |

## Architecture

```text
Navigateur React
  ├── Google OAuth ───────────────> Supabase Auth
  ├── historique utilisateur ─────> PostgreSQL + RLS
  └── URL ou PDF ─────────────────> Edge Function
                                      ├── extraction du contenu
                                      └── Groq API ──> résumé
```

La clé Groq reste exclusivement dans les secrets de l'Edge Function. Le frontend utilise uniquement la clé publique `anon` de Supabase.

## Installation locale

Prérequis : Node.js 22+, npm et Supabase CLI.

```bash
git clone https://github.com/Mouad-El-Aouiz/article-summarizer-ai.git
cd article-summarizer-ai
npm ci
cp .env.example .env.local
npm run dev
```

Renseigner ensuite dans `.env.local` :

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## Configuration Supabase

1. Créer un projet Supabase et activer le fournisseur Google dans **Authentication > Providers**.
2. Ajouter les URL locale et de production dans les URL de redirection autorisées.
3. Lier le projet et appliquer la migration qui crée la table `summaries` et ses politiques RLS :

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

4. Configurer la clé serveur Groq et déployer la fonction :

```bash
supabase secrets set GROQ_API_KEY=your-secret-key
supabase functions deploy summarize-article
```

## Vérifications qualité

```bash
npm run lint
npm run build
npm run preview
```

## Déploiement Netlify

Connecter le dépôt à Netlify, puis ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les variables d'environnement du site. Le fichier `netlify.toml` configure le build Vite et la redirection SPA.

## Limites connues

- Les PDF scannés sans couche texte nécessitent un service OCR supplémentaire.
- Certains sites bloquent l'extraction automatisée ou rendent leur contenu uniquement côté client.
- Le résumé porte sur les 12 000 premiers caractères extraits afin de maîtriser latence et coût.

## Sécurité

- Authentification JWT requise par l'Edge Function
- Isolation des données par utilisateur grâce aux politiques RLS
- Refus des protocoles non HTTP(S), des hôtes locaux et des plages IP privées
- Limites de taille, délais réseau et messages d'erreur sans fuite de secrets

## Auteur

Développé par [Mouad El Aouiz](https://github.com/Mouad-El-Aouiz).
