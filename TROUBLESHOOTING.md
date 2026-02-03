# Troubleshooting - Problèmes Courants

## Erreur: GET init.json 404

**Symptôme**:
```
GET https://nextpr-7f97c.firebaseapp.com/__/firebase/init.json 404 (Not Found)
```

**Cause**: Firebase Auth cherche un fichier de configuration qui n'existe qu'en production Firebase Hosting.

**Solutions**:

### Solution 1: Autoriser localhost (Recommandé)

1. Allez dans [Firebase Console - Authentication Settings](https://console.firebase.google.com/project/nextpr-7f97c/authentication/settings)
2. Section **"Authorized domains"**
3. Cliquez **"Add domain"**
4. Ajoutez: `localhost`
5. Sauvegardez

### Solution 2: Ignorer l'erreur

Cette erreur n'empêche généralement PAS la connexion de fonctionner. Testez quand même:

1. Cliquez sur "Se connecter avec Google"
2. Vous serez redirigé vers Google
3. Après connexion, retour au dashboard
4. L'erreur 404 apparaît mais la connexion fonctionne

### Solution 3: Utiliser un domaine de test

Si vraiment ça ne fonctionne pas en local, vous pouvez déployer sur Netlify et tester là-bas:

```bash
# Dans powerlifting-app/
git init
git add .
git commit -m "Initial commit"
git push

# Puis déployer sur Netlify (voir README.md)
```

---

## Erreur: Index Firestore Manquant

**Symptôme**:
```
Error loading PRs: The query requires an index
```

**Solution**:

👉 [Créer l'index automatiquement](https://console.firebase.google.com/v1/r/project/nextpr-7f97c/firestore/indexes?create_composite=Ckpwcm9qZWN0cy9uZXh0cHItN2Y5N2MvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2xpZnRzL2luZGV4ZXMvXxABGgwKCGV4ZXJjaXNlEAEaEAoMZXN0aW1hdGVkTWF4EAIaDAoIX19uYW1lX18QAg)

Attendez 1-2 minutes que l'index se construise.

---

## Dashboard ne charge pas les PRs

**Causes possibles**:

1. **Index Firestore pas créé** → Voir ci-dessus
2. **Aucun lift enregistré** → Normal si nouveau compte, les PRs seront "N/A"
3. **Erreur de permissions Firestore** → Vérifier les règles

**Vérification des règles Firestore**:

```bash
cd powerlifting-app
firebase deploy --only firestore:rules
```

---

## Erreur: Missing or insufficient permissions

**Symptôme**:
```
FirebaseError: Missing or insufficient permissions
```

**Causes**:

1. Règles Firestore pas déployées
2. Utilisateur pas authentifié
3. Tentative d'accès aux données d'un autre utilisateur

**Solution**:

```bash
# Déployer les règles
firebase login
firebase deploy --only firestore:rules

# Vérifier l'authentification
# Ouvrez la console navigateur (F12)
# Tapez: firebase.auth().currentUser
# Devrait retourner votre utilisateur ou null
```

---

## L'application ne démarre pas

**Symptôme**:
```
Cannot find module...
```

**Solution**:

```bash
cd powerlifting-app
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

---

## Build échoue

**Symptôme**:
```
Error: Firebase: Error (auth/invalid-api-key)
```

**Cause**: Variables d'environnement pas configurées

**Solution**:

Vérifiez `.env.local`:
```bash
cat .env.local
```

Devrait contenir vos vraies clés Firebase, pas "placeholder".

---

## Redirection infinie après login

**Symptôme**: Boucle entre login et dashboard

**Cause**: Problème avec `handleRedirectResult`

**Solution**: Vérifiez la console pour erreurs spécifiques

**Debug**:
```typescript
// Ajouter dans AuthProvider.tsx
useEffect(() => {
  handleRedirectResult().then(user => {
    console.log('Redirect result:', user);
  });
}, []);
```

---

## Les règles Firestore ne se déploient pas

**Symptôme**:
```
Error: Failed to get Firebase project
```

**Solutions**:

1. **Vérifier la connexion Firebase**:
```bash
firebase logout
firebase login
```

2. **Vérifier le projet sélectionné**:
```bash
firebase use
# Devrait afficher: nextpr-7f97c

# Si pas le bon projet:
firebase use nextpr-7f97c
```

3. **Vérifier `.firebaserc`**:
```json
{
  "projects": {
    "default": "nextpr-7f97c"
  }
}
```

---

## TypeScript Errors

**Symptôme**: Erreurs de type pendant le build

**Solution**:

```bash
# Vérifier les erreurs
npm run lint

# Build pour voir toutes les erreurs
npm run build
```

---

## Hot Reload ne fonctionne pas

**Symptôme**: Changements de code ne se reflètent pas

**Solution**:

1. Relancer le serveur:
```bash
# Ctrl+C pour arrêter
npm run dev
```

2. Vider le cache Next.js:
```bash
rm -rf .next
npm run dev
```

---

## Aide Supplémentaire

Si aucune solution ne fonctionne:

1. **Vérifier la console navigateur** (F12) pour erreurs détaillées
2. **Vérifier les logs terminal** où `npm run dev` tourne
3. **Firebase Console** pour erreurs côté serveur
4. **Consulter la documentation**:
   - [Firebase Auth Docs](https://firebase.google.com/docs/auth)
   - [Next.js Docs](https://nextjs.org/docs)
   - [Firestore Docs](https://firebase.google.com/docs/firestore)

---

**Dernière mise à jour**: 2026-01-15
