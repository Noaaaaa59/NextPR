# Quick Start Guide - PowerLift Pro

## Démarrage rapide en 5 minutes

### 1. Installer les dépendances
```bash
cd powerlifting-app
npm install
```

### 2. Configurer Firebase

**Option A: Configuration rapide (pour tester)**

Si vous voulez juste voir l'interface sans fonctionnalités Firebase:

Le fichier `.env.local` existe déjà avec des placeholders. L'app s'affichera mais la connexion ne fonctionnera pas.

```bash
npm run dev
# Ouvrez http://localhost:3000
```

**Option B: Configuration complète (recommandé)**

Pour une app fonctionnelle:

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un projet (2 minutes)
3. Activez Authentication > Google
4. Créez une base Firestore
5. Récupérez vos identifiants dans Paramètres du projet

6. Éditez `.env.local` avec vos vraies clés:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_vraie_clé
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

📖 **Guide détaillé**: Voir [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### 3. Déployer les règles Firestore (si config complète)

```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

### 5. Tester

1. Cliquez sur "Se connecter avec Google"
2. Connectez-vous avec votre compte Google
3. Vous devriez être redirigé vers le dashboard
4. Explorez les différentes pages via la navigation

---

## Structure de l'app

```
📱 Navigation mobile (bottom bar)
├── 🏠 Dashboard    - Vue d'ensemble de vos PRs
├── 💪 Workouts     - Historique et création
├── 📊 Analytics    - Graphiques (à implémenter)
├── 🏆 Leaderboard  - Classement (à implémenter)
└── 👤 Profile      - Vos informations

💻 Navigation desktop (top bar)
- Même structure + bouton déconnexion
```

---

## Ce qui fonctionne maintenant

✅ Authentification Google
✅ Dashboard avec display des PRs
✅ Navigation responsive
✅ Pages de base
✅ Profil utilisateur

---

## Ce qui reste à développer

🔨 Logging de workouts
🔨 Graphiques de progression
🔨 Programmes pré-définis
🔨 Leaderboards actifs
🔨 Système d'amis

📖 **Voir**: [NEXT_STEPS.md](NEXT_STEPS.md) pour le plan complet

---

## Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Linter
npm run lint

# Ajouter composant shadcn
npx shadcn@latest add button

# Déployer règles Firestore
firebase deploy --only firestore:rules
```

---

## Troubleshooting rapide

**❌ "Firebase: Error (auth/invalid-api-key)"**
→ Vos clés Firebase ne sont pas configurées dans `.env.local`

**❌ Page blanche / erreur de chargement**
→ Vérifiez la console développeur (F12)
→ Assurez-vous que les dépendances sont installées

**❌ "Cannot find module '@/...'"**
→ Relancez le serveur: `npm run dev`

---

## Prochaine étape recommandée

👉 **Implémenter le logging de workouts**

Créez `app/workouts/new/page.tsx` pour permettre aux utilisateurs d'enregistrer leurs entraînements.

Voir [NEXT_STEPS.md](NEXT_STEPS.md) section "Phase 1.1" pour les détails.

---

**Besoin d'aide?** Consultez la documentation complète:
- [README.md](README.md) - Vue d'ensemble
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Configuration Firebase
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Architecture
- [NEXT_STEPS.md](NEXT_STEPS.md) - Développement futur

Bon développement! 💪🏋️‍♂️
