"""Configuration.
ASSIGNED TO SHENG

Put environment variables + settings here later.
Examples:
- EPHE_PATH for Swiss ephemeris data files (M3)
- LOG_LEVEL
"""

from pydantic import BaseModel

class Settings(BaseModel):
    # PSEUDOCODE:
    # ephe_path: str = "ephe"
    # log_level: str = "INFO"
    pass

settings = Settings()
