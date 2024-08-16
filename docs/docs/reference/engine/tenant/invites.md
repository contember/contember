---
title: User invitations
---

The `invite` mutation provides a way to add a new member to a specified project within the system.

#### Example: sending and invitation

```graphql
mutation {
  invite(
    email: "john@doe.com",
    projectSlug: "my-blog",
    memberships: [
      {
        role: "editor",
        variables: [{name: "language", values: ["en}]
      }
    ],
    options: {
        mailVariant: "en_us",  # Optional
        method: RESET_PASSWORD  # Recommended
    }
  ) {
    ok
    error {
      code
    }
  }
}
```

### Invite permissions

By default, users with the global roles `super_admin` and `project_admin`, along with project-level `admin`, are authorized to issue invitations. However, you can extend this capability to other user roles by configuring [Tenant ACL permissions](/reference/engine/schema/acl.md#tenant-permissions).

### Existing vs new users

If the specified email address already corresponds to a user in the system, that user will simply be added to the designated project. If the user does not yet exist, a new account will be created, and login instructions will be sent to the provided email address.

### Password handling

By default, the invitation process auto-generates a password and sends it via email. However, it's recommended to set the invite method to `RESET_PASSWORD`. This way, a reset token is sent instead of a generated password. Ensure your [mail templates](./mail-templates.md) are appropriately configured to include the password setup link. Note that the default method will transition to `RESET_PASSWORD` in future updates.

### Customizing Email Templates

You can specify a preferred email template variant by setting the `mailVariant` option, as outlined in the [mail templates](./mail-templates.md) section.
