---
title: Value rendering components
---

Contember Interface provides a number of high-level components that you can use to easily render field values, as well as low-level components that you can use to create custom field rendering solutions.

## Field
The `Field` component is the most basic field rendering component in Contember Interface. It is used to display the value of a single field from your data model.

To use the Field component, you must specify the name of the field you want to display using the `field` prop. You can also use the `format` prop to specify a callback function for custom value formatting. The `format prop is passed the field value as an argument, and you can return a formatted version of the value from the callback.

Here is an example of how to use the Field component to display the value of a "title" field:

```typescript jsx
<Field field="title" />
```
And here is an example of how to use the format prop to apply custom formatting to the field value:

```typescript jsx
<Field field="price" format={val => `${val} EUR`}/>
```
You can also use dot notation to traverse through has-one relations and display related fields. For example, to display the "name" field of a related "category" entity, you can use the following syntax:

```typescript jsx
<Field field="category.name" />
```
This is equivalent to using the Field component within a HasOne component:

```typescript jsx
<HasOne field="category">
	<Field field="name" />
</HasOne>
```

## FieldView

Another component you can use to render field values is the `FieldView` component. You can specify the field name using the `field` prop, or use the `fields` prop to specify an array of field names. You must also provide a `render` prop, which is a callback that receives one or more [`FieldAccessor`](../data-binding/overview.md#accessors) objects as arguments (depending on the number of fields specified). The value of the field is available on the `value` property of the FieldAccessor object.

#### Example of FieldView for a single field:
```typescript jsx
<FieldView
	field="contactName"
	render={(field) => (
		<>
			<dt>Contact name:</dt>
			<dd>{field.value}</dd>
		</>
	)}
/>
```

#### Example of FieldView with multiple fields
```typescript jsx
<FieldView
	fields={['phoneNumberPrefix', 'phoneNumber']}
	render={(phoneNumberPrefix, phoneNumber) => (
		<>
			<dt>Phone</dt>
			<dd>{`${phoneNumberPrefix.value}${phoneNumber.value}`}</dd>
		</>
	)}
/>
```

## EntityView

The `EntityView` component is a powerful tool for rendering the values of a single entity. To use the `EntityView` component, you must provide a `render` prop, which is a callback function that receives an [`EntityAccessor`](../data-binding/overview.md#accessors) object as an argument. The `EntityAccessor` object provides methods for accessing fields and entities in an entity tree using methods like `getField`, `getEntity` or `getEntityList`.

You can also use the `field` prop to specify a relationship to another entity, in which case the `EntityAccessor` object will provide access to the related entity.

Here is an example of how to use the EntityView component to render the values of an entity:

#### Example how to use EntityView
```typescript jsx
<EntityView
	render={(entity) => (
		<>
			<dt>Title</dt>
			<dd>{entity.getField('title').value.substring(0, 20)}...</dd>
			<dt>Price</dt>
			<dd>{Math.round(entity.getField('price').value)} EUR</dd>
		</>
	)}
/>
```
#### Example how to use EntityView with a `field` prop to access related entity:
```typescript jsx
<EntityView
	field="category"
	render={(category) => (
		<>
			<dt>Category</dt>
			<dd>{category.getField('name').value ?? 'undefined category'}</dd>
		</>
	)}
/>
```
