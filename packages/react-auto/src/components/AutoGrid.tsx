import { Component, QueryLanguage, Schema, SugaredQualifiedEntityList, useEntity } from '@contember/react-binding'
import { DeleteEntityButton } from '@contember/react-binding-ui'
import { DataGrid, DataGridContainerPublicProps, GenericCell } from '@contember/react-datagrid-ui'
import { AnchorButton } from '@contember/ui'
import { AutoCell } from './AutoCell'
import { LinkComponent } from './types'

export type AutoGridProps =
	& DataGridContainerPublicProps
	& {
		entities: SugaredQualifiedEntityList['entities']
		LinkComponent?: LinkComponent
	}

/**
 * @group Auto Admin
 */
export const AutoGrid = Component<AutoGridProps>(
	(props: AutoGridProps, env) => {
		const schema = env.getSchema()
		const entities = QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, env)
		const { LinkComponent, ...dataGridProps } = props
		const columns = createDataGridColumns(schema, entities.entityName, LinkComponent)

		return <DataGrid {...dataGridProps} children={columns} />
	},
)

const createDataGridColumns = (
	schema: Schema,
	entityName: string,
	LinkComponent?: LinkComponent,
) => {
	const entitySchema = schema.getEntity(entityName)

	const fieldColumns = Array.from(entitySchema.fields.values()).map(it => (
		<AutoCell key={it.name} schema={schema} entityName={entityName} fieldName={it.name} LinkComponent={LinkComponent} />
	))

	const actionColumn = (
		<GenericCell key="action" shrunk>
			<EditLink LinkComponent={LinkComponent} />
			<DeleteEntityButton />
		</GenericCell>
	)

	return [...fieldColumns, actionColumn]
}

const EditLink = ({ LinkComponent }: { LinkComponent?: LinkComponent }) => {
	const entity = useEntity()
	if (!LinkComponent) {
		return null
	}
	return (
		<LinkComponent entityName={entity.name} entityId={entity.id} action={'edit'} Component={AnchorButton}>
			edit
		</LinkComponent>
	)
}
