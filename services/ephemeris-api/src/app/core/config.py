# BaseSettings lets pydantic read values from environment variables automatically
from pydantic import BaseSettings


# all app config lives here, pydantic will pull from env vars if they exist,
# otherwise it falls back to the defaults defined below
class Settings(BaseSettings):

    # user-readable name for the service
    APP_NAME: str = "Ephemeris API"
    # version string, useful for debugging and the /health response
    APP_VERSION: str = "0.1.0"

    # path to the Swiss Ephemeris data files that the swisseph library needs to calculate planetary positions
    SWISSEPH_DATA_PATH: str = "./data/ephemeris"

    # which house system to use when dividing the chart into 12 houses, placidus is the most widely used
    DEFAULT_HOUSE_SYSTEM: str = "placidus"


# create a single shared instance so any module can just import `settings` and read from it
settings = Settings()