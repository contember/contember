import { Component, QueryLanguage, Schema } from '@contember/binding'
import { Stack } from '@contember/ui'
import { LinkButton, RoutingLinkTarget } from '../../routing'
import { DataGrid, DataGridContainerPublicProps, DataGridProps, DeleteEntityButton, GenericCell } from '../bindingFacade'
import { AutoCell } from './AutoCell'

export type AutoGridProps =
	& DataGridContainerPublicProps
	& {
		entities: DataGridProps<never>['entities']
		createViewLinkTarget?: (entity: string) => RoutingLinkTarget
		createEditLinkTarget?: (entity: string) => RoutingLinkTarget
	}

/**
 * @group Auto Admin
 */
export const AutoGrid = Component<AutoGridProps>(
	(props: AutoGridProps, env) => {
		const schema = env.getSchema()
		const entities = QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, env)
		const { createViewLinkTarget, createEditLinkTarget, ...dataGridProps } = props
		const columns = createDataGridColumns(schema, entities.entityName, createViewLinkTarget, createEditLinkTarget)

		return <DataGrid {...dataGridProps} children={columns} />
	},
)

const createDataGridColumns = (
	schema: Schema,
	entityName: string,
	createViewLinkTarget?: (entity: string) => RoutingLinkTarget,
	createEditLinkTarget?: (entity: string) => RoutingLinkTarget,
) => {
	const entitySchema = schema.getEntity(entityName)

	const fieldColumns = Array.from(entitySchema.fields.values()).map(it => (
		<AutoCell key={it.name} schema={schema} entityName={entityName} fieldName={it.name} createEntityLink={createViewLinkTarget} />
	))

	const actionColumn = (
		<GenericCell key="action" shrunk>
			<Stack horizontal>
				{createEditLinkTarget && (
					<LinkButton accent="strong" to={createEditLinkTarget(entityName)} distinction="seamless" size="small">
						edit
					</LinkButton>
				)}
				<DeleteEntityButton />
			</Stack>
		</GenericCell>
	)

	return [...fieldColumns, actionColumn]
}
