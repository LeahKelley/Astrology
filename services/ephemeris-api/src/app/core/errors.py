# the root exception for this whole app, all other custom errors inherit from this
# so callers can catch AstrologyAPIError and get everything in one go
class AstrologyAPIError(Exception):
    pass


# thrown when something goes wrong during the actual planetary math,
# i.e. swisseph returning a bad result or getting unexpected input
class ChartCalculationError(AstrologyAPIError):
    pass


# thrown when the ephemeris data files can't be found or loaded,
# usually a  path config issue or missing data directory
class EphemerisDataError(AstrologyAPIError):
    pass