---
title: Input validations
---

Input validations are is a way to add more constraints to a field. They are specified using annotation on checked field.

```ts
import {
  InputValidation as validation,
  SchemaDefinition as def,
} from "@contember/schema-definition";

export class Article {
  // highlight-next-line
  @validation.assertNotEmpty("Article title cannot be empty")
  title = def.stringColumn().notNull();
}
```

Useful input validations include:

- `assertNotEmpty(errorMessage)` - checks that field is not empty (null or empty string)
- `assertDefined(errorMessage)` - checks that field is not null
- `assertPattern(regExp, errorMessage)` - checks that field matches given regular expression
- `assertMinLength(min, errorMessage)` and `assertMaxLength(max, errorMessage)` - checks that string is at least (or at most) of given length
