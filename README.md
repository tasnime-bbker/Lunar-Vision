# Lunar Vision: Plateforme Multi-Agent d'Intelligence Business

## Inspiration

Lunar Vision aide les PME à transformer leurs données et signaux marché en décisions rapides. La plateforme combine plusieurs agents IA pour produire des tableaux de bord interactifs, des recommandations marketing automatisées et une veille concurrentielle exploitable en temps réel.

## Fonctionalités

**Lunar Vision** est une plateforme multi-agent pensée pour les équipes business, marketing et stratégie :

### 1. Tableaux de bord interactifs pour PME

- Agrège les données métier et les transforme en dashboards lisibles
- Met en avant les KPI essentiels pour suivre la performance
- Aide les équipes à explorer les résultats par segment, produit ou canal

### 2. Recommandations marketing automatisées

- Génère des pistes de campagnes à partir des signaux business détectés
- Propose des messages, angles créatifs et CTA adaptés au contexte
- Accélère la production de contenus et d’actions marketing

### 3. Veille concurrentielle et insights marché en temps réel

- Réalise une recherche concurrentielle via la collecte automatisée de données
- Combine analyse stratégique, synthèse de signaux faibles et rapports de direction
- Produit des visualisations interactives et une mise en cache haute performance pour des réponses plus rapides

### Multi-Agent Architecture

- **Researcher Agent**: collecte automatiquement les données utiles depuis plusieurs sources (web, APIs, données internes, réseaux sociaux)
- **Analyst Agent**: structure les signaux, détecte les opportunités, identifie les risques et synthétise les tendances clés
- **Writer Agent**: génère des rapports de direction clairs avec recommandations actionnables et résumés exécutifs

- **SchemaAgent**: définit, normalise et valide la structure des données pour garantir la cohérence entre tous les agents
- **KPIAgent**: calcule, suit et met à jour les indicateurs clés de performance (KPI) en temps réel pour les PME
- **InsightAgent**: transforme les données brutes en insights stratégiques exploitables pour la prise de décision
- **MarketingAgent**: génère des stratégies marketing automatisées basées sur l’analyse des données business et marché
- **ContentAgent**: crée du contenu marketing optimisé (posts, emails, campagnes publicitaires) adapté aux objectifs business

### Interactive Visualizations

- Tableaux de bord interactifs en temps réel
- Visualisations de tendances, KPI et signaux concurrentiels
- Cartes de synthèse pour faciliter la lecture exécutive

### High-Performance Caching

- Redis pour accélérer les analyses répétées
- Réponses plus rapides grâce à la mise en cache des résultats
- Caches séparés selon le contexte d’analyse

## Tech Stack

### Frontend

- React + TypeScript
- Tailwind CSS
- Recharts pour les visualisations
- Composants UI de type Shadcn

### Backend

- FastAPI with streaming (SSE)
- Strands Agents framework
- Google Gemini 2.0
- Redis caching

### Data Collection

- Bright Data MCP pour la collecte automatisée
- Sources variées pour alimenter l’analyse stratégique et concurrentielle

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
export GROQ_API_KEY="your_key"
export GROQ_MODEL="mixtral-8x7b-32768"
export BRIGHTDATA_API_KEY="your_key"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Optional Docker

```bash
docker-compose up
```

## Performance

| Metric             | Value         |
| ------------------ | ------------- |
| First analysis     | 30-60 seconds |
| Cached analysis    | ~100ms        |
| Speed improvement  | 600x          |
| API cost reduction | 90%           |

## API Endpoints

```
POST /api/v1/chat                     # Chat multi-agent
POST /api/v1/ecommerce/analyze        # Analyse de fichier métier
GET  /health                          # Health check
```

## Team

Sarthak, Tanzil, Edwin, Samson
