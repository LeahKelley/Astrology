# API Spec (Draft)

Base URL (local): http://localhost:8000

---

## Health

GET /health

Response 200:
{ "status": "ok" }

---

## Natal Chart

POST /chart/natal

### Request (JSON)

{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "timezone": "America/New_York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "house_system": "placidus"
}

### Request Field Rules (v1)

- date: required, format YYYY-MM-DD
- time: required, format HH:MM (24-hour)
- timezone: required, IANA timezone string (example: America/New_York)
- latitude: required, range -90 to 90
- longitude: required, range -180 to 180
- house_system: required, v1 supports placidus only

---

### Response 200 (JSON)

{
  "meta": {
    "house_system": "placidus",
    "timezone": "America/New_York"
  },
  "angles": {
    "asc": 123.45,
    "mc": 210.12
  },
  "houses": [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  "bodies": [
    {
      "name": "Sun",
      "longitude": 301.23,
      "sign": "Aquarius",
      "degree_in_sign": 1.23,
      "speed": 0.98,
      "retrograde": false
    },
    {
      "name": "Moon",
      "longitude": 12.34,
      "sign": "Aries",
      "degree_in_sign": 12.34,
      "speed": 13.2,
      "retrograde": false
    }
  ],
  "aspects": [
    {
      "a": "Sun",
      "b": "Moon",
      "type": "trine",
      "orb": 1.2
    }
  ]
}

---

### Response Field Rules (v1)

- All angles and longitudes are returned as ecliptic degrees in the range 0–360.
- houses is a 12-element array of cusp longitudes (0–360), starting at House 1 and proceeding in order.
- bodies includes exactly these 10 bodies in v1:
  Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- sign must be one of:
  Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
- degree_in_sign is a value from 0.00 to 29.99.
- retrograde is true if speed is negative.

---

### Aspect Rules (v1)

Aspect type values:
conjunction, opposition, square, trine, sextile

Aspects are computed between natal bodies only in v1.

Default orbs:
conjunction: 8°
opposition: 8°
square: 6°
trine: 6°
sextile: 4°

---

## Errors (Example)

Response 400:
{ "error": "Invalid timezone" }
