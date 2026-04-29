# Plan d'Implémentation : Backend (Démo) Chatbot Immobilier Marocain

Contexte : Backend **démo** pour un chatbot immobilier au Maroc (Fès, Rabat, Casablanca) basé sur des **questions prédéfinies** (flux guidé), incluant RAG, calculs fiscaux, et génération de PDF.

> [!NOTE]
> Démo sans comptes ni authentification : pas de création de client/utilisateur, pas de login, pas de rôles. Chaque session est anonyme (session_id) et le flux est piloté par des questions et choix prédéfinis.

## Étape 1 : Setup Démo (Local)
- **FastAPI** : Projet Python 3.11 avec Pydantic v2.
- **Stockage** (simple) : SQLite pour la démo (fichier local) ou PostgreSQL en Docker si besoin.
- **Vector DB** : Qdrant en Docker (ou mode local si vous préférez).
- **PDF** : Génération de rapport (HTML -> PDF) et stockage local (dossier) pour la démo.
- **Pas de CI/CD** : pas de GitHub Actions, pas de pipeline CD, exécution locale.

## Étape 2 : Modélisation (Sans Auth)
- **Schémas** (SQLAlchemy) : tables minimales
  - Sessions (session_id, langue, created_at)
  - Selections (session_id, node_id, value, ts)
  - Simulations_fiscales (session_id, inputs, outputs, ts)
  - Documents (session_id, type, path, ts)
- **Contrats API** (Pydantic v2) : validation stricte des payloads.
- **Arbre de décision** : stockage des nodes (question, choix, next) en JSON (fichier) ou table dédiée (selon simplicité).

## Étape 3 : Données Démo (Sans Scraping obligatoire)
- **Dataset statique** : fichier JSON/CSV d'annonces d'exemple (quelques dizaines/centaines).
- **Ingestion** : normalisation + chunking + embeddings + insertion dans Qdrant.
- **Optionnel** : Scraping plus tard (hors scope démo) si vous le validez.

## Étape 4 : Moteur de Calcul Fiscal (Démo)
- **Core** : règles métier pour TPI + IR locatif (TH/TSC en option si nécessaire pour la démo).
- **Entrées/sorties** : structures de données claires (montants, durées, abattements, détail par ligne).
- **Tests unitaires** : couvrir les cas principaux (au moins les barèmes/abattements et les arrondis).

## Étape 5 : LLM (Démo, sans MLOps)
- **Rôle du LLM** : reformulation + synthèse RAG + explication des calculs (pas d'extraction d'entités depuis texte libre).
- **Hébergement** : au choix, modèle local (si vous avez GPU) ou API managée.
- **Pas de fine-tuning** : pas de DVC/MLflow, pas de pipeline d'entraînement dans la démo.

## Étape 6 : API FastAPI (Flux guidé)
- **Sessions anonymes** : création/récupération par session_id.
- **Messages prédéfinis** : le backend renvoie l'étape suivante sous forme de
  - question (texte)
  - choix (boutons/valeurs)
  - type (single_choice, number, range, etc.)
  - règles de validation
- **Persistance** : sauvegarder chaque sélection pour rejouer et générer un rapport.
- **Langues** : démarrer par FR, ajouter Darija/AR ensuite (fichiers de contenu).

## Étape 7 : RAG (Démo)
- **Recherche Qdrant** : récupérer des annonces proches des filtres (ville, budget, type, surface).
- **Synthèse** : réponse courte + top N annonces + justification simple.
- **Streaming** : optionnel en démo (SSE si nécessaire).

## Étape 8 : PDF (Démo)
- **Template** : Jinja2 -> HTML -> PDF.
- **Contenu** : récapitulatif des sélections + simulation fiscale + annonces recommandées.
- **Stockage** : fichier local (dossier `./storage`) et endpoint de téléchargement.

## Étape 9 : Observabilité (Optionnel Démo)
- **Logs** : logs applicatifs simples (requêtes, erreurs).
- **Métriques** : optionnel (à ajouter plus tard).

## Étape 10 : Déploiement (Hors scope Démo)
- Déploiement, TLS, reverse proxy, monitoring avancé et MLOps seront traités après validation de la démo.

---
## Questions Ouvertes (Démo)

1. **Arbre de questions** : vous préférez que l'arbre soit en JSON (plus simple) ou en base (plus dynamique) ?
2. **LLM** : local (GPU) ou API managée pour la démo ?
3. **Dataset** : vous avez déjà un export d'annonces (CSV/JSON) ou on crée un dataset fictif réaliste ?
