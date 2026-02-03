# Index Firestore requis

La nouvelle fonctionnalité de PR réel nécessite un index composite Firestore.

## Instructions

Lorsque vous testez l'application, si vous voyez une erreur indiquant qu'un index est requis, cliquez sur le lien fourni dans la console ou utilisez le lien ci-dessous pour créer l'index automatiquement.

## Requête concernée

Collection: `users/{userId}/lifts`
Champs:
- `exercise` (Ascending)
- `reps` (Ascending)  
- `weight` (Descending)

## URL de création automatique

L'URL sera générée automatiquement par Firebase lors de la première utilisation et affichée dans la console du navigateur.

Vous pouvez aussi créer l'index manuellement dans la console Firebase:
1. Allez dans Firestore Database > Index
2. Créez un index composite avec les champs ci-dessus
3. Attendez 1-2 minutes que l'index soit créé
