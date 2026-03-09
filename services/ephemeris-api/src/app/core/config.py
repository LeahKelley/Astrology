from pydantic import BaseSettings


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    """

    APP_NAME: str = "Ephemeris API"
    APP_VERSION: str = "0.1.0"

    # Swiss Ephemeris data directory (for M3)
    SWISSEPH_DATA_PATH: str = "./data/ephemeris"

    # Default house system
    DEFAULT_HOUSE_SYSTEM: str = "placidus"


settings = Settings()