// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Component, Field, useEntity } from '@contember/react-binding'

import { formatString } from '../utils/formatString'
import { LinkComponent, LinkComponentProps } from './types'

export type AutoLabelProps = {
	field: string
	LinkComponent?: LinkComponent
	linkAction?: LinkComponentProps['action']
}

/**
 * @group Auto Admin
 */
export const AutoLabel = Component<AutoLabelProps>(
	({ field, LinkComponent, linkAction }, env) => {
		const entity = useEntity()
		const entitySchema = env.getSubTreeNode().entity
		const humanFieldSchema = entitySchema.fields.get(field)!

		const optionLabel = <Field field={field} format={it => formatString(humanFieldSchema.type, it)} />
		return LinkComponent
			? (
				<LinkComponent action={linkAction ?? 'edit'} entityName={entitySchema.name} entityId={entity.idOnServer!}>
					{optionLabel}
				</LinkComponent>
			)
			: optionLabel
	},
	({ field }) => {
		return <Field field={field} />
	},
)
