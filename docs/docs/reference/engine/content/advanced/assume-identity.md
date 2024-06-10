---
title: Assume identity
---


The "assume identity" feature allows you to change the identity associated with your request for the purposes of event log. This can be useful in cases where you want to modify data as a different user, for example when using an admin account to perform actions on behalf of another user.

:::note
Keep in mind that this does not change your membership or permissions, it only affects the event log.
:::

### Sending a request

To assume an identity, you need to add a special request header called x-contember-assume-identity with the UUID of the identity you want to assume.

##### Example how to assume an identity specified in a header value:

```
x-contember-assume-identity: 8b7787d6-d26e-4bf3-8b7c-a9a9c7e2f8e8
```

This will make all changes to data performed by this request to be associated with the identity specified in the header.

### ACL Definition

To use this feature, you must first enable it for the role you are using by setting `system.assumeIdentity` to `true` in your ACL definition

#### Example how to define a role with ability to assume an identity:

```typescript
export const adminRole = acl.createRole('admin', {
  system: {
    assumeIdentity: true,
  },
})
```	
