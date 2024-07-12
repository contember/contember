---
title: Memberships
---

An identity can be a member of any project with some role and optionally variables assigned. This is called a membership. A project admin (and a superadmin) can manage project memberships by default, you can also setup [Tenant ACL permissions](/reference/engine/schema/acl.md#tenant-permissions) for other user roles.

## Creating a project membership

Add an existing identity to a project. For this operation you need to know an identity ID. If you want to add a user by an email check [invite mutation](./invites.md)

```graphql
mutation {
  addProjectMember(
    projectSlug: "my-blog" 
    identityId: "2f673a53-af33-42b1-9e17-e1305fa26d9d"
    memberships: [
      {
        role: "editor",
        variables: [{name: "language", values: ["cs"]}]
      }
    ]
  ) {
    ok
    error {
      code
    } 
  }
}
```

a mutation can fail with following errors:
```graphql
enum AddProjectMemberErrorCode {
  PROJECT_NOT_FOUND
  IDENTITY_NOT_FOUND
  VARIABLE_NOT_FOUND
  ALREADY_MEMBER
}
```

## Updating a project membership

You can update existing member of an project using `updateProjectMember` mutation. Arguments and response structure of the mutation are the same as of `addProjectMeber` mutation. Only error codes differs:

```graphql
enum UpdateProjectMemberErrorCode {
  PROJECT_NOT_FOUND
  VARIABLE_NOT_FOUND
  NOT_MEMBER
}
```

## Revoking a project membership

You can remove a project member using following mutation
```graphql
mutation {
  removeProjectMember(
    projectSlug: "my-blog" 
    identityId: "2f673a53-af33-42b1-9e17-e1305fa26d9d"
  ) {
    ok
    error {
      code
    } 
  }
}
```
## Viewing project members

```graphql
query {
  projectBySlug(slug: "my-blog") {
    name
    members {
      identity {
        id
        person {
          email
        }
      }
      memberships {
        role
        variables {
          name
          values
        }
      }
    }
  }
}
```
