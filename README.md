# Assistant Orange Money – Frontend React

Ce projet est une interface utilisateur web développée avec **React**, servant de client à l’assistant vocal Orange Money. Il permet d’interagir avec un assistant intelligent pour simuler des opérations Orange Money par commandes vocales ou textuelles.

## Contexte

> Ce projet fait partie d’un **MVP** où les traitements Orange Money sont **entièrement simulés côté backend**.  
> Il communique avec le backend suivant :  
> 👉 [assistant-backend (Flask)](https://github.com/ao627515/assistant-backend)

Le frontend repose sur des bibliothèques de reconnaissance vocale compatibles navigateur. Un LLM local (via Ollama) est utilisé pour enrichir l’interaction avec un assistant conversationnel généraliste.

## Fonctionnalités

- Consultation simulée du solde, crédit, internet, bonus fidélité
- Interface de chat vocal/texte avec lecture audio automatique des réponses
- Reconnaissance vocale en français (avec [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition))
- Affichage des erreurs, chargements, et gestion de l’état du micro
- Actions rapides prédéfinies (boutons)

## Installation

```bash
git clone https://github.com/ao627515/assistant-frontend-react.git
cd assistant-frontend-react
npm install
```

## Lancement

```bash
npm start
```

Accessible sur [http://localhost:3000](http://localhost:3000)

## Build production

```bash
npm run build
```

Résultat dans le dossier `build/`

## Tests

```bash
npm test
```

## Structure

```
assistant-frontend-react/
├── public/
├── src/
│   ├── App.js          # Composant principal
│   ├── services/       # Gestion des appels API
│   ├── components/     # Composants réutilisables
│   └── ...
└── package.json
```

## API attendue

Le frontend interroge un backend Flask local à `http://localhost:5000` :

- `GET /solde`
- `POST /process`
- `GET /audio/:audioId`

## Limitations

- Compatibilité navigateur pour la reconnaissance vocale
- Fonctionnement dépendant du lancement du backend Flask

## Auteurs

- [Tapsoba Faridatou](https://github.com/biabkaahfa)
- [Ouédraogo Abdoul Aziz](https://github.com/ao627515)
- [Simporé Elie](https://github.com/simporeelie)
- [Sawadogo Adam Sharif](https://github.com/Oursdingo)

## Licence

MIT
