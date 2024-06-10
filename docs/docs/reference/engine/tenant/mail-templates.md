---
title: Mail templates
---

Mail templates in Contember enable tailored communication for emails dispatched by the Tenant API. Via the `/tenant` path and with either the `SUPER_ADMIN` or `PROJECT_ADMIN` global roles, users can create and manage these templates seamlessly.

## Mail Types
Contember provides three primary mail types, each serving specific communication needs:

- **NEW_USER_INVITED**: This mail type welcomes newly invited users. Often, it's the first touchpoint a new user has with the platform, typically containing details for setting up their account or accessing the platform's resources.

- **EXISTING_USER_INVITED**: Deployed when inviting an already registered user to a new project. It's a notification template, guiding users to the new project or functionalities they've been given access to.

- **RESET_PASSWORD_REQUEST**: For situations when a user forgets their password. This email directs users to reset their password, ensuring they regain access to their account.

Each of these mail types comes with a straightforward default template. Additionally, in Contember Cloud setups, enhanced custom templates are present, which users can modify or overwrite based on their preferences.
Of course! I'll include more detailed information about the GraphQL mutations by elaborating on the structure of the input.

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
           variant: "en-US",                  # Optional: for different variants like locales
           useLayout: true                    # Optional: set to false for custom designs
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
- `type`: The type of the mail, i.e., `NEW_USER_INVITED`, `EXISTING_USER_INVITED`, or `RESET_PASSWORD_REQUEST`.
- `subject`: The email's subject.
- `content`: The email's main content, with Mustache variables for dynamic information.
- `projectSlug`: To specify a particular project.
- `variant`: For different template variants, such as language or design.
- `useLayout`: A flag to determine whether to use the default layout.

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

:::note
`projectSlug` is available since Engine 1.3+
:::
