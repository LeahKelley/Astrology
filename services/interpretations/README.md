# Interpretations Service

Go service that serves astrological interpretation text for planets, signs, houses, aspects, and placement combinations. All text is hand-written and compiled into the binary — no database required.

Runs on **port 8002**.

## Setup

```bash
go run .
```

Or build a binary:

```bash
go build -o interpretations .
./interpretations
```

## Endpoints

### Reference Data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/interpret/planets` | All planet interpretations |
| GET | `/interpret/signs` | All sign interpretations |
| GET | `/interpret/houses` | All house interpretations |
| GET | `/interpret/aspects` | All aspect interpretations |
| GET | `/interpret/planet/:name` | Single planet (e.g. `Sun`, `Moon`, `Mars`) |
| GET | `/interpret/sign/:name` | Single sign (e.g. `Aries`, `Scorpio`) |
| GET | `/interpret/house/:num` | Single house (e.g. `1`, `7`, `12`) |
| GET | `/interpret/aspect/:name` | Single aspect (e.g. `trine`, `square`) |

### Combo Interpretations

| Method | Path | Query Params | Description |
|--------|------|--------------|-------------|
| GET | `/interpret/combo/planet-in-sign` | `planet`, `sign`, `retrograde` (optional) | Planet placed in a sign |
| GET | `/interpret/combo/planet-in-house` | `planet`, `house` | Planet placed in a house |
| GET | `/interpret/combo/house-cusp` | `house`, `sign` | House cusp in a sign |
| GET | `/interpret/combo/aspect` | `planet1`, `aspect`, `planet2` | Aspect between two planets |

### Response Format

All endpoints return JSON with the same shape:

```json
{
  "title": "Mars in Scorpio",
  "text": "...",
  "keywords": ["intensity", "drive", "transformation"]
}
```

## Data

Interpretation text lives in the `*_data.go` files:

| File | Contents |
|------|----------|
| `data.go` | Planet, sign, house, and aspect base descriptions |
| `planet_in_sign_data.go` | Specific planet-in-sign interpretations |
| `planet_in_house_data.go` | Specific planet-in-house interpretations |
| `house_cusp_data.go` | House cusp interpretations |
| `aspect_combo_data.go` | Aspect combination interpretations |

If a specific combination is not found in the data files, the service falls back to composing a generic interpretation from the base descriptions.
