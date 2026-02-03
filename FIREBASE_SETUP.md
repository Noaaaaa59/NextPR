# Configuration Firebase pour PowerLift Pro

Ce guide vous aidera à configurer Firebase pour votre application de powerlifting.

## Étape 1: Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Nommez votre projet (ex: "powerlifting-app")
4. Désactivez Google Analytics (optionnel pour ce projet)
5. Cliquez sur "Créer un projet"

## Étape 2: Configurer l'authentification

1. Dans la console Firebase, allez dans **Authentication** dans le menu de gauche
2. Cliquez sur **Get Started**
3. Dans l'onglet **Sign-in method**, cliquez sur **Google**
4. Activez le fournisseur Google
5. Sélectionnez un email de support pour le projet
6. Cliquez sur **Enregistrer**

## Étape 3: Configurer Firestore Database

1. Dans la console Firebase, allez dans **Firestore Database**
2. Cliquez sur **Créer une base de données**
3. Choisissez **Mode test** pour commencer (nous ajouterons les règles de sécurité après)
4. Sélectionnez une localisation proche (ex: `europe-west1` pour l'Europe)
5. Cliquez sur **Activer**

## Étape 4: Ajouter une application Web

1. Dans **Paramètres du projet** (icône engrenage en haut à gauche)
2. Cliquez sur l'icône **</>** (Web)
3. Donnez un surnom à votre app (ex: "powerlifting-web")
4. **N'activez PAS** Firebase Hosting pour l'instant (on utilisera Netlify)
5. Cliquez sur **Enregistrer l'application**

## Étape 5: Récupérer les identifiants

Vous verrez un bloc de configuration Firebase ressemblant à ceci:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Étape 6: Créer le fichier .env.local

1. Dans le dossier racine de votre projet, créez un fichier `.env.local`
2. Copiez les valeurs de Firebase dans ce format:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Important**: Ne committez JAMAIS ce fichier dans Git! Il est déjà dans `.gitignore`.

## Étape 7: Déployer les règles de sécurité Firestore

1. Installez Firebase CLI globalement:
```bash
npm install -g firebase-tools
```

2. Connectez-vous à Firebase:
```bash
firebase login
```

3. Initialisez Firebase dans votre projet:
```bash
firebase init firestore
```

4. Sélectionnez votre projet Firebase
5. Acceptez le fichier de règles par défaut (`firestore.rules`)
6. Acceptez le fichier d'index par défaut (`firestore.indexes.json`)

7. Déployez les règles:
```bash
firebase deploy --only firestore:rules
```

## Étape 8: Vérifier la configuration

1. Lancez votre application en local:
```bash
npm run dev
```

2. Ouvrez [http://localhost:3000](http://localhost:3000)
3. Essayez de vous connecter avec Google
4. Vérifiez dans la console Firebase > Authentication que votre utilisateur apparaît
5. Vérifiez dans Firestore Database qu'un document utilisateur a été créé dans `users/{uid}`

## Règles de sécurité Firestore

Les règles actuelles dans `firestore.rules` garantissent:

- ✅ Les utilisateurs ne peuvent lire/écrire que leurs propres données
- ✅ Les subcollections (workouts, lifts, programs) sont protégées par utilisateur
- ✅ Les templates de programmes sont en lecture seule pour tous
- ✅ Aucun utilisateur anonyme ne peut accéder aux données

## Troubleshooting

### Erreur: "Firebase: Error (auth/unauthorized-domain)"

**Solution**:
1. Allez dans Firebase Console > Authentication > Settings > Authorized domains
2. Ajoutez `localhost` et votre domaine Netlify (ex: `your-app.netlify.app`)

### Erreur: "Missing or insufficient permissions"

**Solution**:
1. Vérifiez que les règles Firestore sont bien déployées
2. Assurez-vous d'être authentifié avant d'accéder aux données
3. Vérifiez que l'UID de l'utilisateur correspond aux documents accédés

### L'authentification fonctionne mais les données ne se chargent pas

**Solution**:
1. Ouvrez la console développeur du navigateur (F12)
2. Vérifiez les erreurs dans l'onglet Console
3. Vérifiez que les variables d'environnement sont bien chargées:
```javascript
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
```

## Prochaines étapes

Une fois Firebase configuré:

1. ✅ L'authentification Google fonctionne
2. ✅ La base de données Firestore est prête
3. ✅ Les règles de sécurité protègent vos données
4. ➡️ Vous pouvez maintenant utiliser l'application et logger des workouts!

Pour le déploiement en production, voir [README.md](README.md) section "Déploiement Netlify".
