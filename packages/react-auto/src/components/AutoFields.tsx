import { Component } from '@contember/react-binding'
import { AutoField } from './AutoField'
import { LinkComponent } from './types'

export type AutoFieldsProps = {
	LinkComponent?: LinkComponent
	excludedFields?: string[]
	excludedEntities?: string[]
}

/**
 * @group Auto Admin
 */
export const AutoFields = Component<AutoFieldsProps>(
	(props, env) => {
		const schema = env.getSchema()
		const entity = env.getSubTreeNode().entity
		const fields = Array.from(entity.fields.values()).filter(it => props.excludedFields === undefined || !props.excludedFields.includes(it.name))

		const autoFields = fields.map(field => (
			<AutoField
				key={field.name}
				schema={schema}
				entityName={entity.name}
				fieldName={field.name}
				LinkComponent={props.LinkComponent}
				excludedEntities={[entity.name, ...(props.excludedEntities ?? [])]}
			/>
		))

		return <>{autoFields}</>
	},
)
