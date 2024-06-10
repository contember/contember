---
title: Tenant Permissions
---

The Tenant permissions feature in Contember allows you to fine-tune control over various actions and roles. These permissions are specified under the `tenant` field when you define a role.

## <span className="version">Engine 1.3+</span> Invite Permissions

The `invite` permission controls the ability to invite other users to a project. You can use either a simple boolean value or a more advanced [membership match rule](#understanding-membership-match-rules) object. If `invite` is set to `true`, the existing rules under `manage` will apply.

#### Example: Simple Invite Permission

```typescript
export const editorRole = acl.createRole('editor', {
  tenant: {
    invite: true,
  },
});
```

:::note
Before Engine 1.3, the `invite` and `unmanagedInvite` allowed only a boolean value. 
:::

### <span className="version">Engine 1.3+</span> Unmanaged Invite Permissions

Similar to `invite`, the `unmanagedInvite` field can accept a boolean value or a [membership match rule](#understanding-membership-match-rules)  object. This permission allows you to use the `unmanagedInvite` mutation.

### <span className="version">Engine 1.3+</span> View Permissions

The `view` field enables you to specify which roles and their associated variables a user can view.

#### Example: View Permissions

```typescript
export const editorRole = acl.createRole('editor', {
  tenant: {
    view: {
      editor: {
        variables: {
          language: true,
        },
      },
    },
  },
});
```

### Manage Permissions

The `manage` field helps you specify the roles and their variables that a user can manage.

#### Example: Manage Permissions

```typescript
export const editorRole = acl.createRole('editor', {
  tenant: {
    manage: {
      editor: {
        variables: true,
      },
    },
  },
});
```

## Understanding membership match rules

The membership match rules is an object that enables you to define more granular rules for managing memberships, roles, and variables. It comes into play when you set values for `invite`, `unmanagedInvite`, `view`, and `manage` fields in the `tenant` permissions.

This rule allows you to:

- Define which roles can be managed
- Specify what variables within those roles can be managed

For example, if you only want to allow a user to manage the `editor` role and assign any value to the `language` variable but restrict values for the `site` variable, your rule would look like this:

```typescript
{
  editor: {
    variables: {
      language: true,
      site: 'assignable_site',
    },
  },
}
```
