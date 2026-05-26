---
title: Skipping validation errors
---

## <span className="version">Engine 1.2+</span> Skipping validation errors

The `skippedErrors` feature in Contember allows users to specify a list of errors that should be ignored during validation of a migration. This can be useful in cases where a migration became invalid due to improvements and new checks in validator, but cannot be changed, because it is already applied.

To skip errors, open a migration file producing errors and add `skippedErrors` field. It is an array of objects, each of which contains a code and a path field. The code field specifies the error code, and the path field specifies the path to the element in the migration that caused the error. Path field is optional.

It is important to note that only individual migrations can have skipped errors, and the final migrated state must be valid. This means that any errors that are skipped in one migration must be fixed in a later migration in order for the migration process to be successful.

#### Example:

```json5
{
	"skippedErrors": [
		{
			"code": "ACL_INVALID_CONDITION",
			"path": "roles.reader.entities.ContentReference.predicates.test"
		}
	],
	"formatVersion": 3,
	"modifications": [
		// Modifications here...
	]
}
```

In this example, the `ACL_INVALID_CONDITION` error will be ignored for the test predicate in the ContentReference entity for the reader role.

### <span className="version">Engine 1.3+</span> `skipUntil`

In each error object, you can specify a `skipUntil` allowing to skip given validation until a specificed migration. This feature is useful when more migrations becomes invalid due to changes in the validator or data structure.

Example:

```json5
{
	"skippedErrors": [
		{
			"code": "ACL_INVALID_CONDITION",
			"path": "roles.reader.entities.ContentReference.predicates.test",
			/* highlight-start */
			"skipUntil": "2023-07-01-101530-abcd"
			/* highlight-end */
		}
	],
	"formatVersion": 3,
	"modifications": [
		// Modifications here...
	]
}
```

In the above example, the "ACL_INVALID_CONDITION" error is ignored for a specific predicate in the ContentReference entity for the reader role. Additionally, subsequent validations will be skipped until the migration `2023-07-01-101530-abcd`.
