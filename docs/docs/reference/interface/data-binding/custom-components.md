---
title: Custom components
---


In Contember, you can create custom components that support data binding. This allows you to build reusable components that fit your specific needs, while still benefiting from the automatic data fetching and saving provided by Contember's data binding system.

## Creating a custom component
To create a custom component that supports data binding, you will need to use the `Component` higher order component from the `@contember/admin` package. This function takes two arguments: the actual component implementation, and a static render function.

The actual component implementation is a regular React component, and you can use it like you would any other component. The static render function, on the other hand, is called during the "static render" phase, and it is used to specify which fields the component depends on.

When the actual implementation does not use hooks, the static render argument is optional - Contember will use the actual implementation for a static render.

Custom components that do not directly use data binding do not need to worry about static render, as Contember will always analyze their children. to support data binding. If the custom component uses hooks, a separate static render function must be provided as a second argument to Component.

### Simple custom data binding component

Simple components, which only wraps other components, can be written as follows:

```tsx
import { Component, TextField, Box } from '@contember/admin'

interface SeoFormProps {
	// ...
}

const SeoForm = Component<SeoFormProps>(
	(props) => {
		return (
			<Box>
				<TextField field={'title'} label={'Title'} />
				<TextField field={'description'} label={'Description'} />
			</Box>
		)
	}
)
```

In this example, `SeoForm` is a custom component that renders a `Box` element with two `TextField` components inside. The `TextField` components are used to edit the title and description fields of the current entity.

:::note
This approach is suitable for simple components that do not use any hooks. If your component uses hooks, you will need to use the Component higher order component with two arguments, as described in the next section.
:::

### Custom data binding component with hooks

Hooks are not available during static render. This is why we need a separate static render function in this case.

```tsx
import { useState } from 'react'
import { Component, TextField, Box, Field, useEntity } from '@contember/admin'

interface SeoFormProps {
	// ...
}

const SeoForm = Component<SeoFormProps>(
	(props) => {
		const entity = useEntity()
		const [state, setState] = useState()
		// ...  
		return (
			<Box>
				<TextField field={'title'} label={'Title'} />
				<TextField field={'description'} label={'Description'} />
			</Box>
		)
	},
	(props) => {
		return (
			<>
				<Field field={'title'} />
				<Field field={'description'} />
			</>
		)
	}
)
```

In this example, the `SeoForm` component uses the `useEntity` and `useState` hooks, and therefore must include a static render function as the second argument for the `Component` higher-order component. During the static render phase, the `Field` components inside the static render function will be analyzed to determine the data dependencies of the SeoForm component.

### Ordinary components without data binding

If a component does not directly use data binding, you don't have to worry about static render as Contember will always analyze its children.

```tsx
const FormWrapper = ({ children }) => {
	const [state, setState] = useState()
	// ...
	return (
		<div /* .... */>
			{children}
		</div>
	)
}

// children will be analyzed:
const form = (
	<FormWrapper>
		<SeoForm />
	</FormWrapper>
)
```


## Using custom components

Once you have created a custom component, you can use it just like any other component. Simply import it and use it in your templates or other components.

#### Example how to use custom component
```typescript jsx
import { EditPage } from '@contember/admin'
import { SeoForm } from './SeoForm'

export default () => (
	<EditPage entity="Article">
		<SeoForm />
	</EditPage>
)
```
