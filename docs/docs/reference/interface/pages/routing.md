---
title: Routing
---

Page names (and basically URL path) are constructed automatically. The resulting page name for the page will be determined by the file and function name, with slashes separating them. For example, the `default` export from a file named `post.tsx` will have the page name `post`, while a function exported as `edit` from a same file will be named `post/edit`. If a function is in a subdirectory, its path will also include the subdirectory name. For instance, a function named `edit` exported from
`post/category.tsx` will have the name `post/category/edit`.

## Routing options

To define pages in Contember, you can use different exports. Each function exported from a page component defines a separate page. If you're looking for more advanced routing setups, understanding how to leverage different exports will be beneficial.

### Default Export

The `default` export is used to create the base page. It is given the name of the file.

```typescript jsx
export default () => {
	return (
		<>
			<p>Post overview here</p>
		</>
	)
}
```

In the above example, if this was the `default` export from a file named `post.tsx`, the page name would be `post`.

### Named Exports

Named exports allow you to define subpages. The name of the function you export will be added to the URL path after a slash. For example:

```typescript jsx
export const Edit = () => {
	return (
		<>
			<p>Edit post here</p>
		</>
	)
}
```

In this case, if the `Edit` function was exported from a file named `post.tsx`, the page name would be `post/edit`.

### Exports from Subdirectories

If your function is within a subdirectory, its path will also include the subdirectory name. This allows you to further nest your pages and organize your interface. For example, if you have a function named `Edit` exported from `post/category.tsx`, the page name would be `post/category/edit`.

```typescript jsx
export const Edit = () => {
	return (
		<>
			<p>Edit post category here</p>
		</>
	)
}
```

### Multiple Named Exports from a Single File

Building upon the routing options provided by Contember, you can define multiple pages from a single file using multiple named exports.

Consider the following example from a file named `post.tsx`, where we're exporting two different components: `Create` and `Edit`.

```typescript jsx
// This is the Create Post page
export const Create = () => {
	return (
		<>
			<p>Here is where you can create a new post.</p>
		</>
	)
}

// This is the Edit Post page
export const Edit = () => {
	return (
		<>
			<p>Here is where you can edit an existing post.</p>
		</>
	)
}
```

With this setup, you're defining two new pages within your Contember interface:

1. `post/create` - This page is rendered when the `Create` component is called.
2. `post/edit` - This page is rendered when the `Edit` component is called.

The names used for the exports, in this case, `Create` and `Edit`, will be reflected in the URL path for their respective pages. It's beneficial to use descriptive names as they give the user an understanding of the page's content or function.
