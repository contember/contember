import { Model } from '@contember/schema'
import { h, Fragment } from 'preact'
import { EntityLink } from './EntityLink.js'
import { FieldLink } from './FieldLink.js'

export const FieldType = ({ field }: { field: Model.AnyField }) => {
	if (field.type === 'ManyHasMany') {
		return <>
			<EntityLink entity={field.target}/>[]{' '}
			<TargetField field={field}/> (m:n)
		</>

	} else if (field.type === 'OneHasMany') {
		return <>
			<EntityLink entity={field.target}/>[]{' '}
			<TargetField field={field}/> (1:n)
		</>

	} else if (field.type === 'OneHasOne') {
		return <>
			<NullableMark field={field} />
			<EntityLink entity={field.target}/>{' '}
			<TargetField field={field}/> (1:1)
		</>

	} else if (field.type === 'ManyHasOne') {
		return <>
			<NullableMark field={field} />
			<EntityLink entity={field.target}/>{' '}
			<TargetField field={field}/> (m:1)
		</>

	} else {
		return <>
			<NullableMark field={field} />
			{field.type}
		</>

	}
}

const TargetField = ({ field }: {field: Model.AnyRelation}) => {
	if ('ownedBy' in field) {
		return <FieldLink entity={field.target} field={field.ownedBy} noEntityLabel />
	}
	if (field.inversedBy) {
		return <FieldLink entity={field.target} field={field.inversedBy} noEntityLabel />
	}
	return null
}

const NullableMark = (props: { field: Model.NullableRelation | Model.AnyColumn }) => {
	return props.field.nullable ? <span class={'font-bold color-black'}>? </span> : null
}
