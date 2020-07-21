import json
import jsonschema


class ValidationException(Exception):
    pass


def validate_schema(path, input_dict):
    with open(path, "r") as f:
        schema = json.load(f)

    try:
        jsonschema.validate(instance=input_dict, schema=schema)
    except jsonschema.ValidationError as e:
        raise ValidationException(e)
