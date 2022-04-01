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

## RichTextRenderer

Here is simple exmaple of how to use the `RichTextRenderer` component with custom references and elements.

```tsx
import { RichTextRenderer } from '@contember/react-client'
import Image from './myComponents/Image'
import Gallery from './myComponents/Gallery'
import Quote from './myComponents/Quote'
import Link from './myComponents/Link'

<RichTextRenderer
	sourceField="json"
	renderElement={(props) => {
		if (props.element.type === 'link' && props.reference) {
			return <Link label={props.element.children[0].text} url={props.reference.target} />
		}

		return props.fallback
	}}
	referenceRenderers={{
		image: (reference) => <Image reference={reference} />,
		gallery: (reference) => <Gallery reference={reference} />,
		quote: (reference) => <Quote reference={reference} />,
	}}
/>
```

| Prop                 | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `sourceField`        | The field in the GraphQL that contains the rich text. |
| `renderElement`      | Function that renders an element.                     |
| `referenceRenderers` | Object that maps reference types to renderers.        |
