---
title: Links and redirects
---

Contember's `Link` component and `useRedirect` hook offer powerful navigation capabilities within your application. The `Link` component creates hyperlinks to various routes, with support for both static and dynamic route parameters. The `useRedirect` hook, on the other hand, provides programmable navigation, letting you change routes based on application logic. These tools facilitate a highly navigable and interactive user interface. Further details can be found in the main documentation
section.

## Links

The `Link` component allows you to create a link to a specific route in your application. The `to` prop specifies the destination page: 

```typescript jsx
<Link to="articles/list">View article</Link>
```

To pass parameters, you can enclose them in parentheses. There are two types of route parameters that you can pass: literal arguments and variable arguments. 

Literal arguments are simple static strings or numbers that can be passed directly, like this:

```typescript jsx
<Link to="articles/list(view: 'grid')">View article</Link>
```

Variable arguments allow you to pass dynamic values as part of a link. This is useful when you need to pass data from the current request or context to the target page. To pass a variable argument in a link, you can use the `$` symbol followed by the name of the variable in the `to` prop. You can then pass the value of the variable using the parameters prop, or use one of predefined available variables.

To pass a custom parameter, you can use a `$variable` in the `to` prop and pass the value using the `parameters` prop, like this:

```typescript jsx
<Link to="articles/list(view: $myViewParam)" parameters={{myViewParam: 'someValue'}}>View articles</Link>
```

The example will generate url `/articles/list?view=someValue`.

The `$request` predefined variable allows you to access the route parameters of the current request. For example, if you are on a page with a URL like `/articles/list?view=grid`, you can access the `view` parameter like this:

```typescript jsx
<Link to="articles/list(view: $request.view)">View articles</Link>
```

If you want to use a value from the current context entity, you can use the `$entity` variable, like this:

```typescript jsx
<Link to="articles/edit(view: $entity.id)">Edit article</Link>
```

You can also traverse through relations by chaining together multiple properties, like this:

```typescript jsx
<Link to="articles/edit(view: $entity.category.id)">Edit category</Link>
```

In addition to the Link component, there is also a `LinkButton` component, which is a Link component styled as a button.

## `useRedirect` hook

The `useRedirect` hook allows you to programmatically navigate to a different page within Contember. It returns a callback function that accepts two arguments:

- `target`: The target page to navigate to, in the same format as the `to` prop in the `Link` component.
- `parameters` (optional): An object containing any custom parameters that need to be passed to the target page.

To use `useRedirect`, you can call the hook in your function component, and then use the returned callback function to navigate to the desired page.

```typescript jsx
import { useRedirect } from '@contember/admin'

const MyComponent = () => {
	const redirect = useRedirect()
	const handleClick = () => {
		redirect('articles/list(view: $myView)', { myView: 'grid' })
	}

	return (
		<button onClick={handleClick}>View articles</button>
	)
}
```

In the example above, clicking the button will navigate to the articles list page with the view parameter set to grid.
