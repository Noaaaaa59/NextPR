# PowerLift Pro 💪

Application web de powerlifting pour tracker vos performances en Squat, Bench Press et Deadlift (SBD).

## Fonctionnalités

### MVP (Implémenté)
- ✅ Authentification Google via Firebase
- ✅ Dashboard avec aperçu des PRs (Personal Records)
- ✅ Navigation mobile-first avec bottom nav
- ✅ Structure de données Firestore complète
- ✅ Calculs 1RM automatiques (formule Epley)
- ✅ Pages pour Workouts, Analytics, Leaderboard, Profil

### Prochaines fonctionnalités
- 🔨 Logging d'entraînements avec interface intuitive
- 🔨 Graphiques de progression avec Recharts
- 🔨 Programmes pré-définis (5/3/1, Candito 6 semaines)
- 🔨 Comparaisons avec standards de force
- 🔨 Leaderboards et comparaisons entre amis
- 🔮 Générateur IA de programmes personnalisés (Phase 2)

## Stack Technique

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Charts**: Recharts
- **Deployment**: Netlify

## Installation

### Prérequis

- Node.js 18+ et npm
- Un compte Google
- Un projet Firebase (voir [FIREBASE_SETUP.md](FIREBASE_SETUP.md))

### Étapes

1. **Cloner le repository** (ou utilisez le dossier actuel)
```bash
cd powerlifting-app
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Firebase**

Suivez le guide complet dans [FIREBASE_SETUP.md](FIREBASE_SETUP.md) pour:
- Créer un projet Firebase
- Activer l'authentification Google
- Créer une base Firestore
- Récupérer vos identifiants

4. **Créer le fichier `.env.local`**

Copiez `.env.local.example` et remplissez avec vos identifiants Firebase:

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` avec vos vraies valeurs:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. **Déployer les règles Firestore**

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

6. **Lancer en développement**

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du projet

```
powerlifting-app/
├── app/                      # Next.js App Router
│   ├── dashboard/            # Dashboard principal
│   ├── workouts/             # Gestion des entraînements
│   ├── analytics/            # Statistiques et graphiques
│   ├── leaderboard/          # Classement communautaire
│   ├── profile/              # Profil utilisateur
│   └── login/                # Page de connexion
├── components/
│   ├── auth/                 # Composants d'authentification
│   ├── layout/               # Navigation et layouts
│   └── ui/                   # Composants shadcn/ui
├── lib/
│   ├── firebase/             # Configuration et utils Firebase
│   ├── calculations/         # Calculs 1RM, volume, standards
│   └── utils.ts              # Utilitaires généraux
├── types/                    # Définitions TypeScript
├── firestore.rules           # Règles de sécurité Firestore
└── .env.local               # Variables d'environnement (non commité)
```

## Scripts disponibles

```bash
# Développement local
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint

# Déployer les règles Firestore
firebase deploy --only firestore:rules
```

## Déploiement sur Netlify

1. **Connectez votre repository Git**

Push votre code sur GitHub/GitLab/Bitbucket:

```bash
git init
git add .
git commit -m "Initial commit - PowerLift Pro MVP"
git branch -M main
git remote add origin https://github.com/your-username/powerlifting-app.git
git push -u origin main
```

2. **Créer un site Netlify**

- Allez sur [netlify.com](https://netlify.com)
- Cliquez sur "Add new site" > "Import an existing project"
- Sélectionnez votre repository Git
- Netlify détecte automatiquement Next.js

3. **Configurer les variables d'environnement**

Dans Netlify Dashboard > Site settings > Environment variables, ajoutez:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

4. **Autoriser le domaine Netlify dans Firebase**

- Firebase Console > Authentication > Settings > Authorized domains
- Ajoutez votre domaine Netlify: `your-app.netlify.app`

5. **Déployer**

Netlify déploie automatiquement! Chaque push sur `main` déclenchera un nouveau déploiement.

## Architecture de données Firestore

### Collections

```
/users/{userId}
  - uid, email, displayName, photoURL
  - preferences: { weightUnit, theme, restTimerDefault }
  - bodyweight, experience, friends[]

/users/{userId}/workouts/{workoutId}
  - date, exercises[], duration, notes, completed

/users/{userId}/lifts/{liftId}
  - exercise (squat/bench/deadlift)
  - weight, reps, estimatedMax, date

/users/{userId}/programs/{programId}
  - name, type, weeks[], active, currentWeek

/programs/{programId} (templates publics)
  - name, author, description, difficulty, weeks[]
```

### Règles de sécurité

- ✅ Lecture: Authentifié uniquement
- ✅ Écriture: Propriétaire des données uniquement
- ✅ Subcollections: Protégées par UID
- ✅ Templates programmes: Lecture publique, écriture admin seulement

## Calculs importants

### 1RM (One Rep Max) - Formule Epley

```typescript
1RM = weight × (1 + 0.0333 × reps)
```

Utilisé pour estimer le max d'un lift basé sur poids × répétitions.

### Volume Load

```typescript
Volume = Σ (sets × reps × weight)
```

Mesure le volume total de travail d'un entraînement.

### Standards de Force

Ratios bodyweight pour déterminer le niveau:

| Lift | Untrained | Novice | Intermediate | Advanced | Elite |
|------|-----------|--------|--------------|----------|-------|
| Squat | 0.5× | 0.75× | 1.25× | 1.75× | 2.25× |
| Bench | 0.35× | 0.50× | 0.75× | 1.25× | 1.75× |
| Deadlift | 0.75× | 1.00× | 1.50× | 2.00× | 2.50× |

### Wilks Score

Formule pour comparer les lifters de différents poids:

```typescript
Wilks = (500 × total) / (a + b×BW + c×BW² + d×BW³ + e×BW⁴ + f×BW⁵)
```

Coefficients différents pour hommes et femmes.

## Contribution

Pour contribuer au développement:

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## Roadmap

### Phase 1: MVP ✅
- [x] Setup Next.js + TypeScript + Tailwind
- [x] Firebase Authentication (Google)
- [x] Structure Firestore
- [x] Navigation mobile-first
- [x] Dashboard avec PRs
- [ ] Interface de logging de workouts
- [ ] Graphiques de progression (Recharts)
- [ ] Programmes pré-définis (5/3/1, Candito)

### Phase 2: Social & Analytics
- [ ] Leaderboards fonctionnels
- [ ] Système d'amis
- [ ] Comparaisons entre lifters
- [ ] Analytics avancées (volume, tonnage, heatmaps)
- [ ] Notifications (rappels d'entraînement)

### Phase 3: IA & Avancé
- [ ] Générateur IA de programmes (OpenAI)
- [ ] Prédictions de progression
- [ ] Détection de plateaux
- [ ] Recommandations personnalisées
- [ ] Intégration vidéos d'exercices

## Support

Pour toute question ou problème:

1. Consultez [FIREBASE_SETUP.md](FIREBASE_SETUP.md) pour les problèmes Firebase
2. Vérifiez les issues GitHub existantes
3. Créez une nouvelle issue avec détails et logs

## Licence

MIT License

---

**Fait avec ❤️ pour la communauté powerlifting**

Bon lift! 💪🏋️‍♂️
