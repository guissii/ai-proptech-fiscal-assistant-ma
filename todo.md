# Aqar.ma - TODO

## Phase 1 : Fondations (Contextes, Données, Moteur Fiscal)

- [x] Créer CityContext pour gérer la ville active, la langue et les couleurs
- [x] Créer LanguageContext pour gérer la langue (FR/AR/EN)
- [x] Implémenter fiscalEngine.ts avec toutes les formules (TPI, IR, TH, TSC)
- [x] Créer data/quartiers.ts avec données complètes (Fès, Rabat, Casa)
- [x] Configurer schéma Drizzle pour conversations, messages et simulations
- [x] Implémenter les migrations SQL pour la base de données

## Phase 2 : Composants Principaux

- [x] Développer Sidebar.tsx (navigation, historique, sélection ville/langue)
- [x] Développer ChatArea.tsx (zone messages, saisie, streaming)
- [x] Développer MessageBubble.tsx (variantes user/assistant avec Markdown)
- [x] Implémenter support RTL pour l'arabe/darija
- [x] Ajouter animations Framer Motion pour les messages

## Phase 3 : Panneau Résultats et Flux

- [x] Développer ResultPanel.tsx (conteneur principal)
- [x] Implémenter AchatCard.tsx (4 métriques, tableau comparatif, donut chart)
- [x] Implémenter TpiCard.tsx (3 scénarios avec bar chart)
- [x] Implémenter LocationCard.tsx (slider budget, tableau quartiers, bar chart)
- [x] Implémenter AirbnbCard.tsx (heatmap, simulateur, comparateur, checklist)
- [x] Implémenter DetentionCard.tsx (durée, line chart, métriques)

## Phase 4 : Composants Avancés

- [x] Développer QuartierCard.tsx (6 métriques, gauge, comparaison)
- [x] Implémenter PdfExport.tsx (5 pages, jsPDF, graphiques)
- [x] Créer page d'accueil avec quick-start cards
- [x] Implémenter historique des conversations

## Phase 5 : Intégration LLM et Chat

- [x] Intégrer LLM pour le chatbot intelligent
- [x] Implémenter streaming des réponses
- [x] Créer classifier pour détecter les flux (achat/vente/location/airbnb/détention)
- [x] Implémenter extraction d'entités (prix, surface, quartier, etc.)
- [x] Ajouter support du darija (reconnaissance et génération)

## Phase 6 : Persistance et Historique

- [x] Créer procédures tRPC pour sauvegarder les conversations
- [x] Implémenter récupération de l'historique
- [x] Ajouter la reprise de session
- [x] Tester la persistance en base de données

## Phase 7 : Styles et Responsive

- [x] Configurer tokens de design (couleurs, typographie, animations)
- [x] Implémenter layout responsive (mobile, tablet, desktop)
- [x] Ajouter bottom-sheet pour mobile
- [x] Tester l'accessibilité (WCAG AA)
- [x] Valider le dark mode

## Phase 8 : Tests et Finalisation

- [x] Écrire tests vitest pour les formules fiscales (16/16 tests passés)
- [x] Tester les flux de simulation
- [x] Valider l'export PDF
- [x] Tests d'intégration du chatbot
- [x] Performance et optimisations
- [x] Vérifier la cohérence visuelle globale

## Bugs Signalés

(Aucun pour le moment)

## Changements Demandés

(Aucun pour le moment)
