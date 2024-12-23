import { Title } from '~/app/components/title'
import { Binding, DeleteEntityDialog, PersistButton } from '~/lib/binding'
import { BackButton } from '~/lib/buttons'
import {
	DataGrid,
	DataGridActionColumn,
	DataGridBooleanColumn,
	DataGridDateColumn,
	DataGridDateTimeColumn,
	DataGridEnumColumn,
	DataGridHasManyColumn,
	DataGridHasOneColumn,
	DataGridLoader,
	DataGridNumberColumn,
	DataGridPagination,
	DataGridTable,
	DataGridTextColumn,
	DataGridToolbar,
	DataGridUuidColumn,
} from '~/lib/datagrid'
import {
	CheckboxField,
	InputField,
	MultiSelectField,
	SelectEnumField,
	SelectField,
	SortableMultiSelectField,
	StandaloneFormContainer,
	TextareaField,
} from '~/lib/form'
import { formatBoolean, formatDate, formatDateTime, formatNumber } from '~/lib/formatting'
import { Slots } from '~/lib/layout'
import { AnchorButton, Button } from '~/lib/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '~/lib/ui/dialog'
import { Loader } from '~/lib/ui/loader'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/lib/ui/tooltip'
import {
	Component,
	EntitySubTree,
	Field,
	HasOne,
	Link,
	PRIMARY_KEY_NAME,
	RedirectOnPersist,
	Schema,
	SchemaColumnType,
	SchemaEntity,
	SchemaRelation,
	useEntity,
	useEntityPersistSuccess,
	useEntitySubTreeLoader,
	useEnvironment,
} from '@contember/interface'
import { DatabaseIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { MouseEvent, ReactNode, useCallback, useMemo, useState } from 'react'

export const Index = () => {
	return (
		<Binding>
			<Slots.Title>
				<Title icon={<DatabaseIcon />}>Auto CRUD</Title>
			</Slots.Title>

			<EntityList />
		</Binding>
	)
}

const EntityList = () => {
	const env = useEnvironment()
	const entities = env.getSchema().getEntityNames()
	entities.sort()

	return (
		<div className="flex flex-col gap-1 items-start">
			{entities.map(entityName => (
				<Link key={entityName} to="auto/list(entity: $entityName)" parameters={{ entityName }}>
					<AnchorButton variant="link">{entityName}</AnchorButton>
				</Link>
			))}
		</div>
	)
}

export const List = () => {
	const entityName = useEnvironment().getParameter('entity')

	if (!entityName || typeof entityName === 'number') {
		return <div>Entity not found</div>
	}

	return <>
		<Binding>
			<Slots.Back>
				<BackButton />
			</Slots.Back>

			<Slots.Title>
				<Title>{entityName}</Title>
			</Slots.Title>

			<Slots.Actions>
				<Link to="auto/create(entity: $entityName)" parameters={{ entityName }}>
					<AnchorButton>New {entityName}</AnchorButton>
				</Link>
			</Slots.Actions>

			<DataGrid entities={entityName}>
				<DataGridToolbar />
				<DataGridLoader>
					<DataGridTable>
						<EntityColumns entityName={entityName} />
					</DataGridTable>
				</DataGridLoader>
				<DataGridPagination />
			</DataGrid>
		</Binding>
	</>
}

export const Create = () => {
	const entityName = useEnvironment().getParameter('entity')

	if (!entityName || typeof entityName === 'number') {
		return <div>Entity not found</div>
	}

	return (
		<Binding>
			<Slots.Back>
				<BackButton />
			</Slots.Back>

			<Slots.Title>
				<Title>New {entityName}</Title>
			</Slots.Title>

			<Slots.Actions>
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity={entityName} isCreating>
				<RedirectOnPersist to={`auto/list(entity: "${entityName}")`} />
				<AutoFields />
			</EntitySubTree>
		</Binding>
	)
}

export const Edit = () => {
	const entityName = useEnvironment().getParameter('entity') as string

	return (
		<Binding>
			<Slots.Back>
				<BackButton />
			</Slots.Back>

			<Slots.Title>
				<Title>Edit {entityName}</Title>
			</Slots.Title>

			<Slots.Actions>
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity={`${entityName}(id = $id)`}>
				<RedirectOnPersist to={`auto/list(entity: "${entityName}")`} />
				<AutoFields />
			</EntitySubTree>
		</Binding>
	)
}

const EntityColumns = Component<{ entityName: string }>(({ entityName }, env) => {
	const entitySchema = env.getSchema().getEntity(entityName)

	return (<>
		<DataGridActionColumn>
			<EntityEditDialog entityName={entityName} />
		</DataGridActionColumn>
		{Array.from(entitySchema.fields).map(([fieldName, fieldSchema]) => (
			<EntityColumn key={fieldName} entityName={entityName} fieldName={fieldName} />
		))}
		<DataGridActionColumn>
			<DeleteEntityDialog trigger={<Button size="sm" variant="destructive"><TrashIcon size={16} /></Button>} />
		</DataGridActionColumn>
	</>)
})


const EntityEditDialog = ({ entityName }: { entityName: string }) => {
	const [open, setOpen] = useState(false)

	return (
		<TooltipProvider>
			<Dialog open={open} onOpenChange={setOpen}>
				<Tooltip>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button size="sm" variant="ghost">
								<PencilIcon size={16} />
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent>
						<Link to="auto/edit(entity: $entityName, id: $entity.id)" parameters={{ entityName }}>
							<AnchorButton size="sm" variant="ghost">
								Open
							</AnchorButton>
						</Link>
					</TooltipContent>
				</Tooltip>
				<DialogContent>
					<EntityEditContent entityName={entityName} close={() => setOpen(false)} />
				</DialogContent>
			</Dialog>
		</TooltipProvider>
	)
}

const EntityEditContent = ({ entityName, close }: { entityName: string; close: () => void }) => {
	const entity = useEntity()
	useEntityPersistSuccess(() => {
		close()
	})
	const params = useMemo(() => ({
		entity: {
			entityName,
			where: { id: entity.idOnServer! },
		} as const,
	}), [entity.idOnServer, entityName])
	const [result] = useEntitySubTreeLoader(params, <AutoFields />)

	if (result.state !== 'loaded' || !result.entity) {
		return <Loader position="static" />
	}

	return (
		<EntitySubTree {...result.entity} treeRootId={result.treeRootId}>
			<AutoFields />
			<PersistButton />
		</EntitySubTree>
	)
}

const EntityColumn = Component<{ entityName: string; fieldName: string }>(({ entityName, fieldName }, env) => {
	const schema = env.getSchema()
	const entitySchema = schema.getEntity(entityName)
	const fieldSchema = schema.getEntityField(entityName, fieldName)

	if (fieldSchema.__typename === '_Column') {
		switch (fieldSchema.type) {
			case 'String':
				return (
					<DataGridTextColumn
						header={fieldSchema.name}
						field={fieldSchema.name}
						format={it => (
							<ClickToEdit
								view={formatString(fieldSchema.type, it)}
								edit={<TextareaField field={fieldSchema.name} label={undefined} />}
							/>
						)}
					/>
				)
			case 'Uuid':
				return <DataGridUuidColumn header={fieldSchema.name} field={fieldSchema.name} />
			case 'Bool':
				return (
					<DataGridBooleanColumn
						header={fieldSchema.name}
						field={fieldSchema.name}
						format={it => (
							<ClickToEdit
								view={formatBoolean(it)}
								edit={<CheckboxField field={fieldSchema.name} label={undefined} />}
							/>
						)}
					/>
				)
			case 'Enum':
				const enumValues = schema.getEnumValues(fieldSchema.enumName!)

				return (
					<DataGridEnumColumn
						header={fieldSchema.name}
						field={fieldSchema.name}
						options={Object.fromEntries(enumValues.map(it => [it, it]))}
					/>
				)
			case 'Integer':
			case 'Double':
				return (
					<DataGridNumberColumn
						header={fieldSchema.name}
						field={fieldSchema.name}
						format={it => (
							<ClickToEdit
								view={formatNumber(it)}
								edit={<InputField field={fieldSchema.name} label={undefined} />}
							/>
						)}
					/>
				)
			case 'Date':
				return (
					<DataGridDateColumn
						header={fieldSchema.name}
						field={fieldSchema.name}
						format={it => (
							<ClickToEdit
								view={formatDate(it)}
								edit={<InputField field={fieldSchema.name} label={undefined} />}
							/>
						)}
					/>
				)
			case 'DateTime':
				return (
					<DataGridDateTimeColumn
						header={fieldSchema.name}
						field={fieldSchema.name}
						format={it => (
							<ClickToEdit
								view={formatDateTime(it)}
								edit={<InputField field={fieldSchema.name} label={undefined} />}
							/>
						)}
					/>
				)
			default:
				return null
		}

	} else {
		const sortableBy = resolveSortableBy(schema, fieldSchema)
		const connectingEntity = resolveConnectingEntity(schema, fieldSchema, sortableBy)

		const targetField = connectingEntity ? connectingEntity.field : fieldSchema
		const targetEntity = schema.getEntity(targetField.targetEntity)
		const humanFieldName = getHumanFriendlyField(targetEntity)
		let optionLabel = <EntityFieldLabel field={humanFieldName} />
		optionLabel = connectingEntity ?
			<HasOne field={connectingEntity.field.name}>{optionLabel}</HasOne> : optionLabel

		if (fieldSchema.type === 'OneHasOne' || fieldSchema.type === 'ManyHasOne') {
			return (
				<DataGridHasOneColumn
					key={fieldSchema.name}
					header={fieldSchema.name}
					field={fieldSchema.name}
				>
					{optionLabel}
				</DataGridHasOneColumn>
			)

		} else {
			return (
				<DataGridHasManyColumn
					key={fieldSchema.name}
					header={fieldSchema.name}
					field={fieldSchema.name}
				>
					{optionLabel}
				</DataGridHasManyColumn>
			)
		}
	}
})

export type AutoFieldProps = {
	schema: Schema
	entityName: string
	fieldName: string
	excludedEntities?: string[]
}

/**
 * @group Auto Admin
 */
const EntityField = Component<AutoFieldProps>(
	({ schema, entityName, fieldName, excludedEntities }) => {
		const field = schema.getEntityField(entityName, fieldName)

		if (field.__typename === '_Column') {
			const common = {
				field: field.name,
				label: field.name,
				required: !field.nullable,
				defaultValue: field.defaultValue as any,
			}

			if (field.name === 'id') {
				return <InputField {...common} inputProps={{ readOnly: true }} />
			}

			switch (field.type) {
				case 'String':
					return <TextareaField {...common} inputProps={{ minRows: 1 }} />
				case 'Uuid':
					return <InputField {...common} />
				case 'Bool':
					return <CheckboxField {...common} />
				case 'Integer':
					return <InputField {...common} />
				case 'Double':
					return <InputField {...common} />
				case 'Date':
					return <InputField {...common} />
				case 'DateTime':
					return <InputField {...common} />
				case 'Enum':
					const enumValues = schema.getEnumValues(field.enumName!)
					const options = Object.fromEntries(enumValues.map(it => [it, it]))

					return <SelectEnumField {...common} options={options} />
				case 'Json':
					return <TextareaField {...common} inputProps={{ minRows: 1 }} />
				default:
					return <StandaloneFormContainer label={field.name}>Unsupported field type {field.type}</StandaloneFormContainer>
			}
		}

		const sortableBy = resolveSortableBy(schema, field)
		const connectingEntity = resolveConnectingEntity(schema, field, sortableBy)

		const targetField = connectingEntity ? connectingEntity.field : field
		const targetEntity = schema.getEntity(targetField.targetEntity)
		const humanFieldName = getHumanFriendlyField(targetEntity)
		const optionLabel = <EntityFieldLabel field={humanFieldName} />
		const otherSide = targetField.side === 'owning' ? targetField.inversedBy : targetField.ownedBy
		const excludedFields = [otherSide, sortableBy].filter(it => it) as string[]

		const createNewForm = excludedEntities === undefined || !excludedEntities.includes(targetEntity.name)
			? <AutoFields excludedFields={excludedFields} excludedEntities={excludedEntities} />
			: undefined

		if (field.type === 'OneHasOne' || field.type === 'ManyHasOne') {
			return (
				<SelectField
					field={field.name}
					label={field.name}
					options={targetEntity.name}
					queryField={[humanFieldName]}
					createNewForm={createNewForm}
				>
					{optionLabel}
				</SelectField>
			)
		}

		if (connectingEntity && sortableBy) {
			return (
				<SortableMultiSelectField
					field={field.name}
					label={field.name}
					options={targetEntity.name}
					queryField={[humanFieldName]}
					sortableBy={sortableBy}
					createNewForm={createNewForm}
					connectAt={connectingEntity.field.name}
				>
					{optionLabel}
				</SortableMultiSelectField>
			)
		}

		return (
			<MultiSelectField
				field={field.name}
				label={field.name}
				options={targetEntity.name}
				queryField={[humanFieldName]}
				createNewForm={createNewForm}
			>
				{optionLabel}
			</MultiSelectField>
		)
	},
)

const formatString = (type: SchemaColumnType, value: any) => {
	if (typeof value !== 'string') {
		return value

	} else if (type === 'Uuid') {
		return <span title={value}>{value.slice(0, 8)}</span>

	} else if (type === 'String') {
		return value.length > 100 ? <span title={value}>{value.slice(0, 100) + '...'}</span> : value

	} else {
		return value
	}
}


const ClickToEdit = Component<{ view: ReactNode; edit: ReactNode }>(
	props => {
		const [edit, setEdit] = useState(false)
		const onClick = useCallback((e: MouseEvent) => e.ctrlKey && setEdit(true), [])
		useEntityPersistSuccess(() => setEdit(false))

		return edit ? <>{props.edit}</> : <div onClick={onClick}>{props.view}</div>
	},
	props => (
		<>
			{props.edit}
			{props.view}
		</>
	),
)

export const getHumanFriendlyField = (entitySchema: SchemaEntity) => {
	for (const field of ['name', 'title', 'heading', 'label', 'caption', 'slug', 'code', 'description']) {
		if (entitySchema.fields.has(field)) {
			return field
		}
	}

	return PRIMARY_KEY_NAME
}

export const resolveConnectingEntity = (schema: Schema, field: SchemaRelation, sortableBy: string | undefined) => {
	if (field.type !== 'OneHasMany' || field.side !== 'inverse') {
		return undefined
	}

	const excludedFields = ['id', field.ownedBy, ...sortableBy ? [sortableBy] : []]
	const connectingEntity = schema.getEntity(field.targetEntity)
	const connectingEntityFields = Array.from(connectingEntity.fields.values()).filter(it => !excludedFields.includes(it.name))

	if (connectingEntityFields.length !== 1 || connectingEntityFields[0].__typename !== '_Relation' || connectingEntityFields[0].type !== 'ManyHasOne') {
		return undefined
	}

	return {
		entity: connectingEntity,
		field: connectingEntityFields[0],
	}
}

export const resolveSortableBy = (schema: Schema, field: SchemaRelation) => {
	if (field.type !== 'OneHasMany' || field.side !== 'inverse') {
		return undefined
	}

	if (field.orderBy === null || field.orderBy.length !== 1 || field.orderBy[0].path.length !== 1) {
		return undefined
	}

	const sortableBy = schema.getEntityField(field.targetEntity, field.orderBy[0].path[0])
	return sortableBy.type === 'Integer' ? sortableBy.name : undefined
}

export type AutoFieldsProps = {
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
			<EntityField
				key={field.name}
				schema={schema}
				entityName={entity.name}
				fieldName={field.name}
				excludedEntities={[entity.name, ...(props.excludedEntities ?? [])]}
			/>
		))

		return <>{autoFields}</>
	},
)

export type AutoLabelProps = {
	field: string
}

const EntityFieldLabel = Component<AutoLabelProps>(
	({ field }, env) => {
		const entitySchema = env.getSubTreeNode().entity
		const humanFieldSchema = entitySchema.fields.get(field)!

		return <Field field={field} format={it => formatString(humanFieldSchema.type, it)} />
	},
	({ field }) => {
		return <Field field={field} />
	},
)
