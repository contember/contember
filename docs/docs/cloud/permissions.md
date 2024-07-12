---
title: Cloud memberships
---

## Organization Member Roles and Permissions

In the Contember Cloud Selfcare, we provide different roles that you can assign to members within your organization. Each role comes with specific permissions that determine what actions members can perform. It's essential to understand these roles and their associated permissions to effectively manage your organization.

### 1. Roles for the Organization

#### Owner

The **Owner** role is the highest level of authority within the organization. Owners have full control over the organization, including its settings, billing, and member management. There must be at least one Owner in the organization at all times.

#### Admin

The **Admin** role is the second-highest authority in the organization. Admins have broad permissions, enabling them to manage most aspects of the organization, except billing and some specific member-related actions.

#### Billing

The **Billing** role is responsible for managing the organization's billing settings and payment methods. Users with this role can handle billing-related tasks but have limited access to other aspects of the organization.

#### Developer

The **Developer** role is for members involved in project development. They have permissions to create and manage, as well as start and stop project activities. They cannot delete a project. 

#### Guest

The **Guest** role is for providing limited access to external collaborators. Guests have viewing privileges for projects and metrics, but they cannot perform any modifications within the organization.

### 2. Project-Specific Roles

#### Project Developer

The **Project Developer** role is specifically assigned at the project level. Members with this role have permissions to work on a particular project, allowing them to create, manage, and start/stop project activities.

#### Project Guest

Similar to the Project Developer role, the **Project Guest** role is specific to individual projects. Members with this role are granted viewing access to a specific project, without the ability to make any changes.

It's important to note that the Project Developer and Project Guest roles are distinct from the organization-wide roles and are managed separately for each project.

### Permissions matrix

<div class="acl-table">

|                               | Owner | Admin | Billing | Developer | Guest | Project Developer | Project Guest |
|-------------------------------|--------------------------------|--------------------------------|--------------------------------|--------------------------------|--------------------------------|--------------------------------|--------------------------------|
| View projects                 | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> |
| View metrics                  | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> |
| View members                  | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  |
| Manage owner / billing member | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  |
| Manage other members          | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  |
| Create projects               | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  |
| Start / stop project          | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  |
| Edit project settings         | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  |
| Delete project                | <span class="acl-y">YES</span> | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  |
| View billing                  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  |
| Manage billing                | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-y">YES</span> | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  | <span class="acl-n">NO</span>  |

</div>
