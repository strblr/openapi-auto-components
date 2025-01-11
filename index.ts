export function autoComponents(object: Record<string, any>) {
  const referenceSchemas: Record<string, any> = Object.create(null);

  for (const path of Object.values(object.paths) as any[]) {
    for (const op of ["get", "post", "put", "patch", "delete"]) {
      const schemaParent = path[op]?.requestBody?.content?.["application/json"];
      if (schemaParent?.schema) {
        schemaParent.schema = extractReferenceSchemas(
          schemaParent.schema,
          referenceSchemas
        );
      }
      if (path[op]?.responses) {
        for (const response of Object.values(path[op].responses) as any[]) {
          const schemaParent = response?.content?.["application/json"];
          if (schemaParent?.schema) {
            schemaParent.schema = extractReferenceSchemas(
              schemaParent.schema,
              referenceSchemas
            );
          }
        }
      }
    }
  }
  if (!object.components) {
    object.components = {};
  }
  if (!object.components.schemas) {
    object.components.schemas = {};
  }
  Object.assign(object.components.schemas, referenceSchemas);
  return object;
}

function extractReferenceSchemas(
  schema: any,
  referenceSchemas: Record<string, any>
) {
  if (schema.allOf) {
    schema.allOf = schema.allOf?.map((subSchema: any) =>
      extractReferenceSchemas(subSchema, referenceSchemas)
    );
  }

  if (schema.anyOf) {
    schema.anyOf = schema.anyOf?.map((subSchema: any) =>
      extractReferenceSchemas(subSchema, referenceSchemas)
    );
  }

  if (schema.oneOf) {
    schema.oneOf = schema.oneOf?.map((subSchema: any) =>
      extractReferenceSchemas(subSchema, referenceSchemas)
    );
  }

  if (schema.not) {
    schema.not = extractReferenceSchemas(schema.not, referenceSchemas);
  }

  if (schema.items) {
    schema.items = extractReferenceSchemas(schema.items, referenceSchemas);
  }

  if (schema.properties) {
    schema.properties = Object.entries(schema.properties).reduce<
      Record<string, any>
    >((prev, [propertyName, schema]) => {
      prev[propertyName] = extractReferenceSchemas(schema, referenceSchemas);
      return prev;
    }, {});
  }

  if (schema.additionalProperties) {
    schema.additionalProperties =
      typeof schema.additionalProperties != "boolean"
        ? extractReferenceSchemas(schema.additionalProperties, referenceSchemas)
        : schema.additionalProperties;
  }

  if (schema.title) {
    const nullable = schema.nullable;
    schema.nullable = undefined;
    if (schema.title in referenceSchemas) {
      if (
        JSON.stringify(referenceSchemas[schema.title]) !==
        JSON.stringify(schema)
      ) {
        throw new Error(
          `Schema title '${schema.title}' already exists with a different schema`
        );
      }
    } else {
      referenceSchemas[schema.title] = schema;
    }

    if (nullable) {
      schema = {
        nullable: true,
        allOf: [
          {
            $ref: `#/components/schemas/${schema.title}`
          }
        ]
      };
    } else {
      schema = {
        $ref: `#/components/schemas/${schema.title}`
      };
    }
  }
  return schema;
}
