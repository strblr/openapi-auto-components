# OpenAPI Auto Components

This package provides a utility function `autoComponents` that automatically extracts JSON schemas from request bodies and response bodies and moves them into the components section as schemas. The `title` of the schema is used for the key in the components section. Note that you can't have duplicate titles for different schemas.

## Demo

```typescript
import { autoComponents } from "openapi-auto-components";

const spec = { /.../ };

const specWithComponents = autoComponents(spec);
```

## Example

### Input

```json
{
  "paths": {
    "/api/v1/users/{id}": {
      "get": {
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "title": "User",
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "integer"
                    },
                    "name": {
                      "type": "string"
                    },
                    "address": {
                      "title": "Address",
                      "type": "object",
                      "properties": {
                        "city": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Output

```json
{
  "paths": {
    "/api/v1/users/{id}": {
      "get": {
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Address": {
        "title": "Address",
        "type": "object",
        "properties": {
          "city": {
            "type": "string"
          }
        }
      },
      "User": {
        "title": "User",
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "name": {
            "type": "string"
          },
          "address": {
            "$ref": "#/components/schemas/Address"
          }
        }
      }
    }
  }
}
```
