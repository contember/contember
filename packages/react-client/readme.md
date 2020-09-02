# `@contember/react-client`

## Usage
If you wish to communicate with any Contember API, wrap your code with the `ContemberClient` component:
```tsx
import { ContemberClient } from '@contember/react-client'

<ContemberClient
	apiBaseUrl="https://api.example.com"
	project="PROJECT-SLUG"
	sessionToken="SESSION-TOKEN"
	stage="STAGE-SLUG"
>
  ...
</ContemberClient>
```

## Notable APIs
You'll have to look at the code for now, sorry.
- `<RichTextRenderer />`
- `useFileUpload`
- `useContentApiRequest` / `useTenantApiRequest` / `useSystemApiRequest`
