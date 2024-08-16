---
title: SEO
---

In this guide, we will present one of the ways you can work with SEO fields in Contember. You can take it as a continuation of the quickstart tutorial.


## 1. Schema definition

First, we have to define the schema. Here we have chosen four fields we want to edit.

1. `title` (for `<title>` tag)
2. `description` (for `<meta name="description" />`)
3. `ogTitle` (for `<meta property="og:title" />`)
4. `ogDescription` (`<meta property="og:description " />`)


For this, we define an entity in our schema with fields. We are making only the `title` field required (using the `.notNull()` call). We save it in a new file.

```tsx title="api/model/Seo.ts"
import { c } from '@contember/schema-definition'

export class Seo {
	title = c.stringColumn().notNull()
	description = c.stringColumn()
	ogTitle = c.stringColumn()
	ogDescription = c.stringColumn()
}
```

Let's say we have just one type of page represented by an existing `Article` entity.

:::note Multiple page-like entities

In our headless CMS starter kit, we have two entities representing a "page" on the front-end of your site, which need SEO attributes. These are `Page` (a page that presents static information - such as "Contact" or "About us") and `Article` (a blog-like article). You may have even more.

To add SEO fields to all of these pages you can create a single `Seo` entity and then create relations for all of your page-like entities. Just repeat the steps below for each of these entities.

:::

To connect it to the `Article` entity we add the relation to the entity:

```tsx title="api/model/Article.ts"
import { c } from '@contember/schema-definition'
// highlight-next-line
import { Seo } from './Seo'

export class Article {
	// some specific fields…

	// highlight-next-line
	seo = c.oneHasOne(Seo, 'article').notNull().removeOrphan()
}
```

We specify that the field is called `Seo` and one Article can have just one Seo and vice versa (thus `oneHasOne` relation). The `notNull()` call marks it as non-nullable, so `Article` must always have a `Seo` entity connected. To delete a `Seo` when we delete an `Article` we add the `removeOrphan` call.

Note, that if you have already created some articles you can't mark this field as `notNull`, because the migration would fail. Just remove the `notNull` call in that case.

To specify the other side of the relation we add a field to the `Seo` entity we created earlier.

```tsx title="api/model/Seo.ts"
import { c } from '@contember/schema-definition'
// highlight-next-line
import { Article } from './Article'

export class Seo {
	title = c.stringColumn().notNull()
	description = c.stringColumn()
	ogTitle = c.stringColumn()
	ogDescription = c.stringColumn()

	// highlight-next-line
	article = c.oneHasOneInverse(Article, 'seo')
}
```

To create migration for this we run `npm run contember migration:diff . add-seo` command and then choose `Yes and execute immediately` to create the migration file and execute it on our local machine.

## 2. Add fields to the administration

Now, we have these fields in our database and API, but we need to add them to our administration. To easily reuse them in different parts of our administration we can create a component that will encapsulate all the fields. We create a new file for it:

```tsx title="admin/components/Seo.tsx"
import { Component, TextAreaField, TextField } from '@contember/admin'

export const Seo = Component(
	() => (
		<>
			<TextField field="seo.title" label="Title" />
			<TextAreaField field="seo.description" label="Description" />
			<TextField field="seo.ogTitle" label="Open Graph title (for facebook)" />
			<TextAreaField field="seo.ogDescription" label="Open Graph description (for facebook)" />
		</>
	),
)
```

Then we can use use the newly created component in existing administration pages like this:

```tsx title="admin/pages/articleEdit.tsx"
import * as React from 'react'
import { EditPage, RichTextField, TextField } from '@contember/admin'
// highlight-next-line
import { Seo } from '../components/Seo'

export default () => (
	<EditPage entity="Article(id = $id)" rendererProps={{ title: 'Edit Article' }}>
		<TextField field="title" label="Title" />
		<RichTextField field="content" label="Content" />
		// highlight-next-line
		<Seo />
	</CreatePage>
)
```

Congratulations - you have just created your first custom component and used it!

## Optional: Using the article's title as a SEO title

Most of the time your article or page has a title that you use as a title in SEO fields. This can be achieved using the `DerivedFieldLink` component.

First, let's modify our `Seo` component to take the name of the field we should copy the title from.

```tsx title="admin/components/Seo.tsx"
import { Component, TextAreaField, TextField } from '@contember/admin'

/* highlight-start */
interface SeoProps {
	titleField?: string
}
/* highlight-end */

/* highlight-start */
export const Seo = Component<SeoProps>(
	({ titleField }) => (
/* highlight-end */
		<>
			<TextField field="seo.title" label="Title" />
			<TextAreaField field="seo.description" label="Description" />
			<TextField field="seo.ogTitle" label="Open Graph title (for facebook)" />
			<TextAreaField field="seo.ogDescription" label="Open Graph description (for facebook)" />
		</>
	),
)
```

And then, when the prop is passed, we use the `DerivedFieldLink` component. Thus when the source field (title of the article) is edited, the change is mirrored in the derived fields (`seo.title` and `seo.ogTitle`).

```tsx title="admin/components/Seo.tsx"
import { Component, TextAreaField, TextField } from '@contember/admin'

interface SeoProps {
	titleField?: string
}

export const Seo = Component<SeoProps>(
	({ titleField }) => (
		<>
			<TextField field="seo.title" label="Title" />
			<TextAreaField field="seo.description" label="Description" />
			<TextField field="seo.ogTitle" label="Open Graph title (for facebook)" />
			<TextAreaField field="seo.ogDescription" label="Open Graph description (for facebook)" />

			{/* highlight-start */}
			{titleField && (
				<>
					<DerivedFieldLink sourceField={titleField} derivedField="seo.title" />
					<DerivedFieldLink sourceField={titleField} derivedField="seo.ogTitle" />
				</>
			)}
			{/* highlight-end */}
		</>
	),
)
```
