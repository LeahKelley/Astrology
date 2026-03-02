"""Swiss Ephemeris adapter boundary.
ASSIGNED TO SHENG

RULE:
- ONLY this module should import/use pyswisseph in M3.
- The rest of the codebase calls functions/classes defined here.

FOR NOW:
- Do NOT implement Swiss calls yet.
- LATER, add:
  - set_ephe_path()
  - compute_bodies()
  - compute_houses()
"""

# PSEUDOCODE FOR LATER IMPLEMENTATION:
# import swisseph as swe
#
# class SwissEphemerisAdapter:
#     def __init__(self, ephe_path: str):
#         ...
#     def compute_bodies(self, utc_dt, lat, lon) -> list[...]:
#         ...
#     def compute_houses(self, utc_dt, lat, lon, house_system) -> ...:
#         ...
pass
