import { Component, Field } from '@contember/binding'
import { Link, RoutingLinkTarget } from '../../routing'
import { formatString } from './utils'

export type AutoLabelProps = {
	field: string
	createLink?: (entity: string) => RoutingLinkTarget
}

/**
 * @group Auto Admin
 */
export const AutoLabel = Component<AutoLabelProps>(
	({ field, createLink }, env) => {
		const entity = env.getSubTreeNode().entity
		const humanFieldSchema = entity.fields.get(field)!

		const optionLabel = <Field field={field} format={it => formatString(humanFieldSchema.type, it)} />
		return createLink ? <Link to={createLink(entity.name)}>{optionLabel}</Link> : optionLabel
	},
)
