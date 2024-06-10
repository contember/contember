---
title: Request debugging
---

Debugging information provided in a response can be useful for identifying and troubleshooting issues with your Contember application. It provides details about the executed SQL queries, along with other useful information.

In development mode, it is always enabled. On production, the `x-contember-debug: 1` header can be used to enable debugging information for a single request.

### ACL definition

Note that debugging information is only included in the response if the role used for the request has debugging enabled in its ACL definition. By default, the admin role has debugging enabled, but for other roles it must be explicitly enabled in the ACL definition. For example:

```typescript
export const editor = acl.createRole('editor', {
	debug: true,
})
```
