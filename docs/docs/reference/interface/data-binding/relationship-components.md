---
title: Relationship components
---

Contember Contember Interface React SDK provides relationship components that allow you to traverse relationships in the entity tree and provide a convenient way to access and display related entities.

The `HasMany` and `HasOne` components are the main relationship components. The `HasMany` component is used to manage "has-many" relationships, while the `HasOne` component is used to manage "has-one" relationships.

## HasMany
The `HasMany` component automatically iterates over a list of related entities and renders its children for each item in the list. You can use this component to easily render a list of related entities, such as a list of tags.

Here is an example of how to use the HasMany component to render a list of related entities:
#### Example of HasManyUsage
```typescript jsx
<HasMany field="tags">
	<Field field="name" />
</HasMany>
```

You can also specify a `listComponent` prop to customize the rendering of the list. The `listComponent` prop is a React component that is called with an `accessor` prop (of type [`EntityListAccessor`](../data-binding/overview.md#accessors)) and a `children` prop. You can use the `accessor` prop to access the list of entities, and the children prop to render the list items. You can also specify `listProps`, which are props passed down to a `listComponent`.

#### Example how to use custom listComponent
```typescript jsx
const ListRenderer = ({ accessor, children, emptyMessage }) => {
	if (accessor.isEmpty()) {
			return <h2>{emptyMessage}</h2>
	}
	return (
		<ul>
			{Array.from(accessor.entities).map(entity => (
				<Entity key={entity.key} accessor={entity}>
					<li>{children}</li>
				</Entity>
			))}
		</ul>
	)
}

<HasMany field="tags" listComponent={ListRenderer} listProps={{ emptyMessage: 'No tags' }}>
	<Field field="name" />
</HasMany>
```

Note that you must wrap the individual items into `Entity` component to correctly switch the context.

## HasOne
The `HasOne` component is used to manage "has-one" relationships, and allows you to switch the context to a related entity.

#### Example how to use HasOne component

```typescript jsx
<HasOne field="category">
	<Field field="name" />
</HasOne>
```

## Repeater

The `Repeater` component is a powerful tool for managing has-many relationships in forms. It allows you to add, remove, and sort items in a list, making it easy to manage complex data structures.

To use the `Repeater` component, you must specify the `field` prop, which specifies the field on the entity that holds the list of items. You can also specify the `sortableBy` prop, which allows users to sort the items in the list by a specified field.

#### Example how to use a `Repeater`
```typescript jsx
<Repeater field="answers" sortableBy="order">
	<TextField field="answer" label="Answer"/>
</Repeater>
```
The example considers following model:
```typescript
export class Question {
	answers = def.oneHasMany(Answer, 'question')
}
export class Answer {
	question = def.manyHasOne(Question, 'answers')
	answer = def.stringColumn()
	order = def.intColumn()
}
```

The `Repeater` component in offers a number of props that allow you to customize its behavior and UI. Here are a few examples:
- `enableRemoving`: Set this prop to `false` to disable the ability to remove items from the list.
- `enableAddingNew`: Set this prop to `false` to disable the ability to add new items to the list.
- `label`: Use this prop to specify the label for the items in the list.

You can find more information in the API documentation of `Repeater`.

### Custom components in `Repeater`

The Repeater component provides two props for customizing the UI: `containerComponent` and `itemComponent`. These props allow you to specify your own components to render the container and each item in the list. You can also pass extra props to these components using `containerComponentExtraProps` and `itemComponentExtraProps`.


#### Example of custom Repeater components
```typescript jsx
export const TableRepeaterItem = ({ children }: RepeaterItemProps) => (
	<TableRow>{children}</TableRow>
)

export const TableRepeaterContainer = ({ children }: RepeaterFieldContainerProps) => (
	<Table>{children}</Table>
)
```
```typescript jsx
<Repeater
	field='items'
	sortableBy='order'
	itemComponent={TableRepeaterItem}
	containerComponent={TableRepeaterContainer}
>
	<TableCell>
		<TextField field='foo' />
	</TableCell>
	<TableCell>
		<TextField field='bar' />
	</TableCell>
</Repeater>
```
:::note
Note that the example is very simplified and does not support features like removing or adding items.
:::
