# AI PropTech Fiscal Assistant (MA) — Démo

Application web PropTech “AI-ready” pour **estimer la fiscalité immobilière au Maroc** et rendre la décision d’investissement **lisible** (brut / net / impôts / rendements) via :
- un **chat guidé** (questions prédéfinies, pas de texte libre),
- une page **/results** type **analytics dashboard** (KPIs, comparatifs, tableaux, graphes).

## Problématique
En pratique, un investisseur immobilier veut répondre rapidement à des questions simples mais critiques :
- “Combien je paie d’impôts si je loue ?”
- “Quel est mon **net réel** après impôts ?”
- “Location longue durée vs Airbnb : lequel est le plus rentable **dans ma ville/quartier** ?”
- “Quels frais d’acquisition je dois prévoir ?”
- “Si je revends plus tard, quel est l’impact fiscal (TPI) ?”

Le problème : ces réponses sont souvent **dispersées**, difficiles à comparer, et rarement présentées sous forme de **dashboard** exploitable.

## Notre approche (solution)
1) **Collecte structurée** (chat guidé)
- Ville + langue
- Profil fiscal simple : “salarié / non”
- Données bien : prix, surface, **quartier prédéfini** (boutons)
- Hypothèses de revenus : loyer mensuel, paramètres Airbnb (tarif/nuit, occupation)
- Option : revente (TPI)

2) **Calculs déterministes** (fiscal engine)
- Calculs chiffrés pour Achat, Location, Airbnb, TPI
- Objectif : résultats cohérents, reproductibles, et testables

3) **Restitution analytics** (/results)
- KPIs brut/net/impôts + comparatif Location vs Airbnb
- Tableaux et graphes (type PowerBI-like)
- Classement “rendement net par quartier” basé sur un dataset local

4) **AI-ready / RAG-ready**
Le projet contient une couche “LLM-ready” côté serveur (interface d’invocation) pour :
- générer une **explication** claire des calculs,
- et, à terme, activer du **RAG** (retrieval + citations) à partir de textes fiscaux (CGI/DGI).
La démo actuelle fonctionne même sans activer un provider LLM.

## Démo : parcours utilisateur (exemple fort)
Scénario : **Rabat**, quartier **Agdal/Hassan**, prix **1 500 000 MAD**, surface **100 m²**, loyer **6 500 MAD/mois**, Airbnb **450 MAD/nuit**, occupation **70%**.

Le système :
- calcule les **frais d’acquisition** (droits, notaire, conservation),
- estime la **Location** (brut annuel, base imposable, IR, net annuel, rendement net),
- estime **Airbnb** (brut/net annuel, commissions, taxes, rendement),
- affiche un dashboard comparatif et un **ranking de quartiers**.

## Stack (tech)
- Front : React + TypeScript + Vite, UI via composants Radix, charts via Recharts
- Backend : Node.js (Express) + tRPC, persistance démo via fichier JSON
- Data démo : dataset quartiers (prix/m², loyers, vacance, score)
- IA : module serveur “LLM-ready” (pluggable) + architecture “RAG-ready”

## Démarrer le projet (local)
### Prérequis
- Node.js (version récente)

### Installation
```bash
npm install --legacy-peer-deps
```

### Lancer
```bash
npm run dev
```
Ouvrir : http://localhost:3000/

Notes :
- Le warning `OAUTH_SERVER_URL is not configured` est normal en démo (pas d’auth).

### Tests / Typecheck
```bash
npm run check
npm run test
```

## Structure (repères)
- `client/` : UI (chat + dashboard résultats)
- `server/` : API (tRPC/Express), persistance démo, modules “AI-ready”
- `shared/` : flow de questions + dataset quartiers partagé
- `storage/` : données locales démo générées à l’exécution (ignorées par git)

## Limitations (démo)
- Les taux/règles fiscales peuvent nécessiter une validation juridique/CGI à jour avant production.
- Le dataset quartiers est démo (à remplacer/enrichir par des sources réelles).

## Roadmap (prochaine étape)
- RAG (vector search) sur documents fiscaux (CGI/DGI) avec citations
- Export PDF “rapport investisseur”
- Paramétrage avancé (crédit, charges, vacance personnalisée, travaux)
