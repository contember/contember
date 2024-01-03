# Contember Rich Text renderer

This package provides a React renderer for Contember Rich Text format.

## Installation

```bash
yarn add @contember/react-richtext-renderer
```

## Usage for blocks

```tsx
import { RichTextBlocksRenderer } from '@contember/react-richtext-renderer'

const App = () => {
	const blocks = [] // blocks from Contember API

	return (
		<RichTextBlocksRenderer
			blocks={blocks}
			sourceField={'content'}
			referencesField={'references'}
			referenceDiscriminationField={'type'}
		/>
	)
}
```

## Usage for standalone rich text field

```tsx
import { RichTextFieldRenderer } from '@contember/react-richtext-renderer'

const App = () => {
	const value = {} // value from Contember API

	return (
		<RichTextFieldRenderer
			source={value}
		/>
	)
}
```

## Custom elements

```tsx
import { RichTextBlocksRenderer } from '@contember/react-richtext-renderer'

const App = () => {
	// ...    
	return (
		<RichTextBlocksRenderer
			// ...
			renderElement={it => {
				if (it.element.type === 'blockquote') {
					return <blockquote>{it.children}</blockquote>
				}
				return it.fallback
			}}
		/>
	)
}
```

## Custom leafs

```tsx
import { RichTextBlocksRenderer } from '@contember/react-richtext-renderer'

const App = () => {
	// ...    
	return (
		<RichTextBlocksRenderer
			// ...
			renderLeaf={it => {
				if (it.leaf.isSup) {
					return <sup>{it.fallback}</sup>
				}
				return it.fallback
			}}
		/>
	)
}
```

Make sure to use `it.fallback` instead of `it.children` in `renderLeaf` callback, to render already applied leafs as well.

## Custom references

```tsx
import { RichTextBlocksRenderer } from '@contember/react-richtext-renderer'

const App = () => {
	// ...    
	return (
		<RichTextBlocksRenderer
			// ...
			referenceRenderers={{
				image: ({ reference }) => <img src={reference.url} />,
			}}
		/>
	)
}
```
