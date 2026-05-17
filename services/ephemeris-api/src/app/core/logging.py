import logging # Python's built-in logging module

# this function sets up logging for the whole app, called once when the server starts
def configure_logging() -> None:

    logging.basicConfig(
        # INFO means we'll see general operational messages, but not the super verbose DEBUG stuff
        level=logging.INFO,
        # log format: timestamp | log level | which module | the actual message
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
