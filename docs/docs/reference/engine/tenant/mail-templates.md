---
title: Mail templates
---

Mail templates in Contember enable tailored communication for emails dispatched by the Tenant API. Via the `/tenant` path and with either the `SUPER_ADMIN` or `PROJECT_ADMIN` global roles, users can create and manage these templates seamlessly.

## Mail Types

| Type | Sent when | Available since |
|---|---|---|
| `NEW_USER_INVITED` | A new person is invited via `invite` with method `CREATE_PASSWORD` or `RESET_PASSWORD`. First touchpoint, typically links to account setup. | 1.x |
| `EXISTING_USER_INVITED` | A person that already exists is added to a new project via `invite`. Notification only. | 1.x |
| `RESET_PASSWORD_REQUEST` | `createResetPasswordRequest` is called for an existing person. Carries the reset token / link. | 1.x |
| `PASSWORDLESS_SIGN_IN` | `initSignInPasswordless` succeeds. Carries the magic link and OTP info. | 1.x |
| `FORCED_SIGN_OUT` | An admin force-signs-out the person via `forceSignOutPerson`. Informational notice that all sessions were ended. | 2.2 |

Each type ships with a default template. In Contember Cloud setups, enhanced custom templates are pre-installed and can be modified or overwritten.

## Managing Templates via GraphQL

### Adding a Mail Template  
  Utilize the `addMailTemplate` mutation to introduce a new email template. Below is a comprehensive example, showcasing all possible fields:

   ```graphql
   mutation {
       addMailTemplate(template: {
           type: NEW_USER_INVITED,
           subject: "Welcome to Our Platform",
           content: "Hello {{email}}, get started with our platform!",
           projectSlug: "YourProjectSlug",     # Optional: for project-specific templates
           variant: "en-US",                   # Optional: for different variants like locales
           useLayout: true,                    # Optional: set to false for custom designs
           replyTo: "support@example.com"      # Optional: Reply-To header
       }) {
           ok,
           error {
               code,
               developerMessage
           }
       }
   }
   ```
  Input breakdown:
- `type`: The mail type — one of the values from the table above (`NEW_USER_INVITED`, `EXISTING_USER_INVITED`, `RESET_PASSWORD_REQUEST`, `PASSWORDLESS_SIGN_IN`, `FORCED_SIGN_OUT`).
- `subject`: The email's subject.
- `content`: The email's main content, with Mustache variables for dynamic information.
- `projectSlug`: To specify a particular project.
- `variant`: For different template variants, such as language or design.
- `useLayout`: A flag to determine whether to use the default layout.
- `replyTo`: Optional. Sets the `Reply-To` header on the outgoing mail. Omit (or pass `null`) to leave the default.

- **Removing a Mail Template**:  
To delete a custom template, use the `removeMailTemplate` mutation. When removed, the system defaults back to the original template.

 ```graphql
 mutation {
     removeMailTemplate(templateIdentifier: {
         type: NEW_USER_INVITED,
         projectSlug: "YourProjectSlug",     # Optional: for project-specific templates
         variant: "en-US"                   # Optional: for different variants like locales
     }) {
         ok,
         error {
             code,
             developerMessage
         }
     }
 }
 ```
Input breakdown:
- `type`: The type of the mail to remove.
- `projectSlug`: To specify a particular project.
- `variant`: To specify which variant to remove, if any.

## Key Details

- **Global vs. Project-specific Templates**: By default, templates are global. To create a project-specific template, include the `projectSlug`. Such project-specific templates will always have precedence over global ones.

- **Template Variants**: Especially relevant for projects serving diverse audiences, Contember supports the creation of variant templates. Whether for different languages or thematic designs, variants ensure your emails are contextually apt. To use a variant, include the `variant` parameter in a mutaiton.

- **Custom Layout**: For those seeking granular control over design, use the `useLayout: false` flag. This means your template won't inherit the standard layout (white centered box on light gray background), granting you carte blanche on the HTML structure.

## Mustache Variables in Templates

Contember uses Mustache for dynamic content in templates. Here are the variables available for each mail type:

- **NEW_USER_INVITED**:
  - `{{email}}`: Recipient's email.
  - `{{password}}`: Password (if available).
  - `{{token}}`: Token for account validation (if available).
  - `{{project}}`: Project name.
  - `{{projectSlug}}`: Project identifier.
  - availability of `password` and `token` variable depends on [invitation method](./invites.md#password-handling)

- **EXISTING_USER_INVITED**:
  - `{{email}}`: Recipient's email.
  - `{{project}}`: New project's name they've been invited to.
  - `{{projectSlug}}`: Project identifier.

- **RESET_PASSWORD_REQUEST**:
  - `{{email}}`: Recipient's email.
  - `{{token}}`: Token for password reset.
  - `{{project}}`: Project name (if available).
  - `{{projectSlug}}`: Project identifier (if available).

- **PASSWORDLESS_SIGN_IN**:
- `{{email}}`: Recipient's email.
- `{{token}}`: Token for passwordless sign-in.
- `{{project}}`: Project name (if available).
- `{{projectSlug}}`: Project identifier (if available).
- `{{url}}`: URL for passwordless sign-in.

- **FORCED_SIGN_OUT** *(since 2.2)*:
- `{{email}}`: Recipient's email.
- `{{reason}}`: Optional reason supplied by the admin to `forceSignOutPerson`. Empty when no reason was provided.

:::note
`projectSlug` is available since Engine 1.3+
:::

Any `addMailTemplate` / `removeMailTemplate` call is recorded as a `mail_template_change` entry in the [audit log](./audit-log.md).
