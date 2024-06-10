---
title: Assume membership
---

Contember's assume membership feature allows identities to temporarily assume a different set of memberships for a single request. This can be useful in certain scenarios where an identity needs to perform an action that requires permissions that they do not have in their current memberships.

### Sending using `x-contember-assume-membership` header

The assume membership feature is enabled by sending a special request header called `x-contember-assume-membership` with a JSON encoded object matching the following type:
```typescript
{
	memberships: {
		role: string,
		variables: {
			name: string,
			values: string[]
		}[]
	}
}
```

#### Example of the x-contember-assume-membership header in use:
```
x-contember-assign-membership: {"memberships": [{"role": "editor", "variables": [{"name": "lang", "values": ["en"]}]}]}
```
This header would allow the identity to temporarily assume the editor role with a `lang` variable set to `en`.

### Sending in a request body

You can also enable this feature in a GraphQL request by including additional `assumeMembership` field in the JSON-encoded request body.

#### Example of how you can structure the request body:

```json5
{
	"assumeMembership": {
		"memberships": [
			{
				"role": "editor",
				"variables": [
					{ "name": "lang", "values": ["en"] }
				]
			}
		]
	},
	// other standard GraphQL fields like query, variables or operationName
}
```

In this example, the `assumeMembership` field is added to the request body, which contains an object with the same structure as the `x-contember-assume-membership` header. You can specify the role and any variables for the assumed membership in the same way as with the header.

If you send the `assumeMembership` field in the request body, it will take precedence over `x-contember-assume-membership` header that may also be present in the request.

### ACL Definition

To allow an identity to use the assume membership feature, the appropriate permissions must be defined in the ACL under the `content.assumeMembership` field of the role definition. Here is an example of how to do this:

#### Example how to define a role with ability to assume a membership:

```typescript
export const authorRole = acl.createRole('author', {
	content: {
		assumeMembership: {reader: true}
	}
)
```
This would allow identities with the `author` role to assume the `reader` role.

### Memberships validity

It's important to note that when a user assumes a membership, their existing memberships are replaced with the assumed memberships. This means that the user will only have the permissions of the assumed role while the membership is assumed. Assumed memberships are only valid for the single request where the x-contember-assume-membership header is present.


### Use Case
There are many use cases for this feature. For example, it can be useful in situations where an admin user wants to see how the content appears to an ordinary user.

Another common use case for the "assume membership" feature is when you have an authentication proxy server in front of your Contember instance. The proxy server can add the `x-contember-assume-membership` header to the request before it reaches Contember, allowing the authenticated user to act as a different user with different permissions.
