"""Custom errors + exception mapping.
ASSIGNED TO SHENG

Later:
- Validation errors beyond Pydantic
- Swiss ephemeris adapter errors
- Business rule errors
Then add exception handlers in app/main.py.
"""

class EphemerisError(Exception):
    """Base exception for ephemeris backend failures."""
    pass
