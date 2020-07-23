import json
import jsonschema

import logger

log = logger.get_logger(__name__)

COLLECTION_NAMES = ["anime", "show", "movie"]
ALLOWED_SORT = ["rating", "date_watched", "state"]


class ValidationException(Exception):
    pass


def validate_schema(path, input_dict):
    with open(path, "r") as f:
        schema = json.load(f)

    try:
        jsonschema.validate(instance=input_dict, schema=schema)
    except jsonschema.ValidationError as e:
        log.warning(f"Validation errror: {e}")
        raise ValidationException(e.message)
