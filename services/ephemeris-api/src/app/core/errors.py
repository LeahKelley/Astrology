class AstrologyAPIError(Exception):
    """
    Base exception for application errors.
    """
    pass


class ChartCalculationError(AstrologyAPIError):
    """
    Raised when natal chart calculations fail.
    """
    pass


class EphemerisDataError(AstrologyAPIError):
    """
    Raised when Swiss Ephemeris data cannot be loaded.
    """
    pass