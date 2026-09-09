# Finlytics

> Personal finance and expense management platform.

## Design System: Onyx & Amber

| Token | Value |
|---|---|
| Accent | `hsl(38 79% 50%)` — warm amber-gold |
| Display font | Playfair Display (serif) |
| Body font | Inter (tabular figures enabled) |
| Radius scale | 2px sharp / 6px default / 12px lg / 16px xl |
| Spacing base | 4px grid |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Charts | Recharts |
| Backend | Python + FastAPI + Motor (async MongoDB) |
| Auth | JWT (access + refresh) + bcrypt |
| Database | MongoDB |
| Infra | Terraform + AWS (chunk 3+) |

## Project Structure

```
finance-app/
├── frontend/
│   ├── src/
│   │   ├── components/ui/   # Button, Input, Card, Badge, Skeleton, Toast, Modal, Avatar
│   │   ├── context/         # ThemeContext + useTheme
│   │   ├── lib/             # cn(), formatCurrency()
│   │   ├── pages/           # StyleGuide (chunk 1), app pages (chunk 2+)
│   │   └── styles/          # globals.css — CSS custom property tokens
│   ├── tailwind.config.ts
│   └── index.html
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic models (chunk 2)
│   │   ├── routes/          # FastAPI routers (chunk 2)
│   │   ├── services/        # Business logic (chunk 2)
│   │   └── auth/            # JWT + bcrypt (chunk 2)
│   └── main.py
├── infra/                   # Terraform (chunk 3+)
├── scripts/
└── README.md
```

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173/style-guide
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install fastapi uvicorn motor python-jose bcrypt
uvicorn main:app --reload
# → http://localhost:8000/health
```

## Chunks

- **Chunk 1** ✅ Design system foundation (current)
- **Chunk 2** — Auth flows + Dashboard + Transaction CRUD
- **Chunk 3** — Budgets, Goals, Charts
- **Chunk 4** — AWS infra + CI/CD

## Commit Convention

`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:` — [Conventional Commits](https://www.conventionalcommits.org/)
