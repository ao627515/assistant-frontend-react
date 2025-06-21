# Assistant Orange Money – Frontend

Ce projet est une application web React qui sert d’interface utilisateur pour un assistant digital Orange Money. Elle permet aux utilisateurs de consulter leur solde, effectuer des opérations courantes (recharge, forfait internet, historique), et d’interagir avec l’assistant via la voix ou le texte.

## Fonctionnalités principales

- **Consultation des soldes** (principal, crédit communication, internet, bonus fidélité)
- **Actions rapides** : accès direct à des opérations fréquentes
- **Chat conversationnel** avec l’assistant (texte ou reconnaissance vocale)
- **Lecture audio automatique** des réponses de l’assistant
- **Reconnaissance vocale** (français) avec envoi automatique ou manuel
- **Affichage des erreurs** et gestion des états de chargement

## Prérequis

- Node.js >= 14.x
- npm >= 6.x

## Installation

Clonez le dépôt puis installez les dépendances :

```sh
git clone <url-du-repo>
cd assistant-frontend
npm install
```

## Lancement en développement

```sh
npm start
```

L’application sera accessible sur [http://localhost:3000](http://localhost:3000).

## Construction pour la production

```sh
npm run build
```

Le build sera généré dans le dossier `build/`.

## Tests

```sh
npm test
```

## Structure du projet

```
assistant-frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── ...
├── src/
│   ├── App.js           # Composant principal de l’application
│   ├── App.css          # Styles additionnels
│   ├── index.js         # Point d’entrée React
│   ├── index.css        # Styles globaux
│   ├── reportWebVitals.js
│   └── setupTests.js
├── package.json
└── README.md
```

## Configuration & Personnalisation

- **API Backend** : L’application communique avec un backend sur `http://localhost:5000` pour les soldes, le traitement des messages et l’audio.
- **Reconnaissance vocale** : Utilise la librairie [`react-speech-recognition`](https://www.npmjs.com/package/react-speech-recognition). Vérifiez la compatibilité navigateur.

## Dépendances principales

- [React](https://react.dev/)
- [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition)
- [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)

## Limitations

- La reconnaissance vocale dépend du support navigateur.
- L’API backend doit être disponible et compatible avec les routes `/solde`, `/process`, `/audio/:audioId`.

## Licence

Projet interne Orange Burkina Faso – Usage restreint.

---

\*Assistant Orange Money – Votre partenaire
