---
title: Routing and pages overview
---


In order to define pages in Contember Interface, you need to export function components from files in the `admin/pages` directory (or its subdirectory).

```typescript jsx
export default () => {
	return (
		<>
			<p>Page content here</p>
		</>
	)
}
```

## [Routing](./routing)

Contember's routing system allows flexible structuring of your interface based on exported components from your files. You can create pages, subpages or nested pages based on your project's needs. This approach offers an intuitive way to design the navigation flow in your application. For more details, refer to the [routing section](./routing) in our documentation.

## [Links and redirects](./links.md)

In Contember, navigating through your application is made easy and intuitive through a range of dedicated components and hooks. These tools simplify the creation of hyperlinks, support static and dynamic parameters, and allow for programmable route changes based on your application's logic. This enables you to build a highly interactive and user-friendly interface, enhancing the overall user experience. For more specific information, please refer to the [links chapter](./links.md).
