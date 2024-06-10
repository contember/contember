---
title: Data binding
---


Contember Interface is a powerful tool for creating React-based applications, and the Data binding feature is one of its key components.

Data binding refers to the process of binding data from a GraphQL server to a React component, and vice versa. In Contember, data binding is fully automated and does not require any manual coding, allowing developers to focus on creating the user experience rather than worrying about data fetching, updating, or saving.

## DataBinding provider

In order to use data binding components in your application, you must be within a DataBindingProvider context. This context is automatically created by entity-aware pages such as `EditPage` or `ListPage`, but you can also create it manually by wrapping your component tree with a `DataBindingProvider` component.

```typescript jsx
import { DataBindingProvider, FeedbackRenderer, GenericPage } from '@contember/admin'

export default () => {
	return (
		<GenericPage>
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				{/*databinding components here*/}
			</DataBindingProvider>
		</GenericPage>
	)
}

```

## Entity subtree context
In addition to the `DataBindingProvider` context, you must also be within an entity context in order to use data binding components. Entity-aware pages such as `EditPage` or `ListPage` automatically create an entity context.

In a single DataBindingProvider context, there might be many entity subtrees. Usually, the entity-aware pages creates a single entity subtree (or entity list subtree). Others subtrees may be created by component as `SelectField`.

You can also use low level components like EntitySubTree or EntityListSubTree to create a custom entity subtrees.

## Data binding components

The most basic data binding component is the `Field` component. It fetches a single field from the current entity and renders its value. By default, the Field component does not support editing the value. To use the `Field` component, simply specify the field name in the `field` prop:

```typescript jsx
<Field field='title' />
```

You can also traverse through relations separated by dots

```typescript jsx
<Field field='category.name' />
```

This is equivalent to use it within HasOne component:
```typescript jsx
<HasOne field='category'>
	<Field field='name' />
</HasOne>
```

When the relationship between two entities is "has-one", you can use the HasOne component to access fields on the related entity.

When the relationship is "has-many", you can use the `HasMany` component to iterate over the related entities and access their fields.

```typescript jsx
<HasMany field='tags'>
	<Field field='name' />
</HasMany>
```

## Custom components

You can define custom components, but if the component uses data binding, you must use `Component` HOC to ensure that it is properly integrated with the data binding system. For details, see [custom components](./custom-components.md).

## Two pass rendering and static render phase

Before a data binding component can be rendered, Contember needs to know what data it needs. This is done during the "static render" phase. Every data binding component has a static render method that provides information about the required fields and other dependencies.

Contember uses this information to create a GraphQL query that fetches the required data. It also uses this information to create a mutation that saves the data. As a user, you don't have to worry about creating queries and mutations. You just use and create components.

![databinding](/assets/databinding.svg)


## Accessors

In Contember Interface, accessors are objects that provide access to entities and fields in the entity tree. They are used to manage the data model and provide a convenient way to access and manipulate data from within your management interface.

You can access accessors in several ways in Contember Interface. One way is through callbacks in components such as `EntityView` and `FieldView`, which receive accessors as arguments. You can also use hooks such as `useEntity`, `useField`, and `useEntityList` to retrieve accessors from the entity tree.

There are several types of accessors in Contember Interface, each of which represents a different aspect of the data model:

### EntityAccessor
`EntityAccessor` represents a single entity in the entity tree. It provides access to the relationships and fields of the entity and allows you to retrieve their values, as well as access to other entity-level metadata such as the entity ID and any errors associated with the entity. Entity accessor also provides methods to mutate the state, like `connectEntityAtField`, `disconnectEntityAtField` or `deleteEntity`.

### FieldAccessor
`FieldAccessor` represents a single field of an entity. It provides access to the value of the field and allows you to update the value, as well as access to metadata such as field errors.

### EntityListAccessor
`EntityListAccessor` represents a list of entities (either top level or in has-many relation). It is iterable and provides access to the individual entities in the list (of type `EntityAccessor`), as well as metadata such as the length of the list, errors etc.
