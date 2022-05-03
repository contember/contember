import { Model } from '@contember/schema'
import { Fragment, h } from 'preact'
import { formatEntityAnchor, formatFieldAnchor } from './utils'

export const FieldType = ({ field }: { field: Model.AnyField }) => {
	const nullableFlag = 'nullable' in field && field.nullable ? <span class={'font-bold color-black'}>?</span> : ''
	const target = 'target' in field ?
		<a href={`#${formatEntityAnchor(field.target)}`} class={'text-blue-500 underline'}>{field.target}</a> : ''
	const targetField = 'ownedBy' in field
		? <a href={`#${formatFieldAnchor(field.target, field.ownedBy)}`}
			 class={'text-blue-500 underline'}>#{field.ownedBy}</a>
		: 'inversedBy' in field && field.inversedBy
			? <a href={`#${formatFieldAnchor(field.target, field.inversedBy)}`}
				 class={'text-blue-500 underline'}>#{field.inversedBy}</a>
			: ''
	switch (field.type) {
		case 'ManyHasMany':
			return <Fragment>{target}[] {targetField} (m:n)</Fragment>
		case 'OneHasMany':
			return <Fragment>{target}[] {targetField} (1:n)</Fragment>
		case 'OneHasOne':
			return <Fragment>{nullableFlag} {target} {targetField} (1:1)</Fragment>
		case 'ManyHasOne':
			return <Fragment>{nullableFlag} {target} {targetField} (m:1)</Fragment>

		default:
			return <Fragment>{nullableFlag} {field.type}</Fragment>
	}
}
