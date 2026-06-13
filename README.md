# 📝 Assistant de Résumé d'Articles & PDF

Application web qui permet de résumer automatiquement des articles web et des documents PDF grâce à l'IA (Groq LLaMA).

## ✨ Fonctionnalités

- 🔐 Authentification Google
- 🔗 Résumé d'articles web par URL
- 📄 Résumé de documents PDF (avec OCR)
- 🌙 Mode sombre
- 📚 Historique des résumés sauvegardé
- 🔄 Régénération de résumé
- 📋 Copie en un clic

## 🛠️ Technologies

- **Frontend** : React + Vite + TailwindCSS
- **Backend** : Supabase (Auth + Base de données)
- **Edge Functions** : Appel à l'API Groq
- **IA** : Groq LLaMA 3.3 (70B)
- **Déploiement** : Netlify

## 🚀 Installation locale

```bash
# Cloner le projet
git clone https://github.com/Mouad-El-Aouiz/summary-app.git

# Installer les dépendances
npm install

# Créer un fichier .env avec :
VITE_SUPABASE_URL=ton_url
VITE_SUPABASE_ANON_KEY=ta_clé

# Lancer en développement
npm run dev
```

## 🔑 Variables d'environnement

 - VITE_SUPABASE_URL : URL de ton projet Supabase

 - VITE_SUPABASE_ANON_KEY : Clé anon publique

## 📦 Déploiement

- Le projet est déployé sur Netlify. Les variables d'environnement sont configurées dans Netlify Dashboard.

## 🧠 Architecture
```bash
Frontend (React) → Supabase Edge Function → API Groq → Résumé
                 → Supabase Database (historique)
                 → Google OAuth (authentification)
```
