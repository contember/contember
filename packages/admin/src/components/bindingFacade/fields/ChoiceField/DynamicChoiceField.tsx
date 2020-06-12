import {
	BindingError,
	BoxedQualifiedEntityList,
	Component,
	EntityAccessor,
	EntityListAccessor,
	EntityListSubTree,
	Field,
	FieldAccessor,
	HasMany,
	HasOne,
	PRIMARY_KEY_NAME,
	QualifiedEntityList,
	QualifiedFieldList,
	QueryLanguage,
	RelativeEntityList,
	RelativeSingleEntity,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	useEnvironment,
	useMutationState,
	useParentEntityAccessor,
} from '@contember/binding'
import { assertNever } from '@contember/utils'
import * as React from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'

export type BaseDynamicChoiceFieldProps =
	| {
			renderOptionText: (entityAccessor: EntityAccessor) => string
			options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
			optionFieldStaticFactory: React.ReactNode
	  }
	| {
			options: string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList
	  }

export type DynamicSingleChoiceFieldProps = SugaredRelativeSingleEntity
export type DynamicMultipleChoiceFieldProps = SugaredRelativeEntityList

export type DynamicChoiceFieldProps = (
	| ({
			arity: 'single'
	  } & DynamicSingleChoiceFieldProps)
	| ({
			arity: 'multiple'
	  } & DynamicMultipleChoiceFieldProps)
) &
	BaseDynamicChoiceFieldProps

export const useDynamicChoiceField = <DynamicArity extends ChoiceFieldData.ChoiceArity>(
	props: DynamicChoiceFieldProps,
): ChoiceFieldData.MetadataByArity[DynamicArity] => {
	const parentEntity = useParentEntityAccessor()
	const environment = useEnvironment()
	const isMutating = useMutationState()

	const desugaredRelativePath = React.useMemo<RelativeSingleEntity | RelativeEntityList>(() => {
		if (props.arity === 'single') {
			return QueryLanguage.desugarRelativeSingleEntity(props, environment)
		} else if (props.arity === 'multiple') {
			return QueryLanguage.desugarRelativeEntityList(props, environment)
		}
		assertNever(props)
	}, [environment, props])
	const desugaredOptionPath = React.useMemo<QualifiedFieldList | QualifiedEntityList>(() => {
		if ('renderOptionText' in props) {
			return QueryLanguage.desugarQualifiedEntityList(
				typeof props.options === 'string' || !('entities' in props.options)
					? {
							entities: props.options,
					  }
					: props.options,
				environment,
			)
		}
		return QueryLanguage.desugarQualifiedFieldList(
			typeof props.options === 'string' || !('fields' in props.options)
				? {
						fields: props.options,
				  }
				: props.options,
			environment,
		)
	}, [environment, props])
	const subTreeData = parentEntity.getSubTree(new BoxedQualifiedEntityList(desugaredOptionPath))

	const arity = props.arity
	const currentValueEntity: EntityListAccessor | EntityAccessor = React.useMemo(() => {
		if (arity === 'single') {
			return parentEntity.getRelativeSingleEntity(desugaredRelativePath as RelativeSingleEntity)
		} else if (arity === 'multiple') {
			return parentEntity.getRelativeEntityList(desugaredRelativePath as RelativeEntityList)
		}
		assertNever(arity)
	}, [parentEntity, desugaredRelativePath, arity])

	const filteredOptions = Array.from(subTreeData)

	const optionEntities = React.useMemo(() => {
		const entities: EntityAccessor[] = []
		for (const entity of filteredOptions) {
			entities.push(entity.getRelativeSingleEntity(desugaredOptionPath))
		}
		return entities
	}, [desugaredOptionPath, filteredOptions])

	const currentlyChosenEntities =
		currentValueEntity instanceof EntityListAccessor ? Array.from(currentValueEntity) : [currentValueEntity]

	const currentValues = React.useMemo(() => {
		const values: ChoiceFieldData.ValueRepresentation[] = []

		for (const entity of currentlyChosenEntities) {
			if (entity instanceof EntityAccessor) {
				const currentKey = entity.key
				const index = filteredOptions.findIndex((entity: EntityAccessor) => {
					const key = entity.primaryKey
					return !!key && key === currentKey
				})
				if (index > -1) {
					values.push(index)
				}
			}
		}

		return values
	}, [currentlyChosenEntities, filteredOptions])

	const normalizedData = React.useMemo(
		() =>
			optionEntities.map(
				(item, i): ChoiceFieldData.SingleDatum => {
					let label: string = ''

					if ('renderOptionText' in props) {
						if (props.renderOptionText) {
							label = props.renderOptionText(item)
						} else if (process.env.NODE_ENV === 'development') {
							throw new BindingError(
								`Cannot use a ChoiceField with custom fields but without providing the 'renderOptionText' prop.`,
							)
						}
					} else if ('field' in desugaredOptionPath) {
						const field = item.getField(desugaredOptionPath.field)
						label = field instanceof FieldAccessor && typeof field.currentValue === 'string' ? field.currentValue : ''
					}

					return {
						key: i,
						label,

						// We can get away with the "!" since this collection was created from filteredData above.
						// If this is actually an unpersisted entity, we've got a huge problem.
						actualValue: item.primaryKey!,
					}
				},
			),
		[desugaredOptionPath, optionEntities, props],
	)

	const baseMetadata: ChoiceFieldData.BaseChoiceMetadata = {
		data: normalizedData,
		errors: currentValueEntity.errors,
		isMutating,
		environment,
	}

	if (props.arity === 'single') {
		const metadata: ChoiceFieldData.SingleChoiceFieldMetadata = {
			...baseMetadata,
			currentValue: currentValues.length ? currentValues[0] : -1,
			onChange: (newValue: ChoiceFieldData.ValueRepresentation) => {
				const entity = currentlyChosenEntities[0]
				if (entity === undefined || !(currentValueEntity instanceof EntityAccessor)) {
					return
				}

				// TODO field names
				// TODO we maybe shouldn't even use currentValueEntity for hasOne connections
				if (newValue === -1) {
					currentValueEntity.disconnectEntityAtField?.('TODO')
				} else {
					currentValueEntity.connectEntityAtField?.('TODO', filteredOptions[newValue])
				}
			},
		}
		return metadata as ChoiceFieldData.MetadataByArity[DynamicArity]
	} else if (props.arity === 'multiple') {
		const metadata: ChoiceFieldData.MultipleChoiceFieldMetadata = {
			...baseMetadata,
			currentValues: currentValues,
			onChange: (optionKey: ChoiceFieldData.ValueRepresentation, isChosen: boolean) => {
				if (currentValueEntity instanceof EntityListAccessor) {
					if (isChosen) {
						currentValueEntity.connectEntity?.(optionEntities[optionKey])
					} else {
						currentValueEntity.disconnectEntity?.(optionEntities[optionKey])
					}
				}
			},
		}
		return metadata as ChoiceFieldData.MetadataByArity[DynamicArity]
	}
	assertNever(props)
}

export const DynamicChoiceField = Component<DynamicChoiceFieldProps & ChoiceFieldData.MetadataPropsByArity>(
	props => {
		const metadata = useDynamicChoiceField(props)

		return props.children(metadata as any) // 🙁
	},
	(props: DynamicChoiceFieldProps, environment) => {
		let reference: React.ReactNode
		let entityListDataProvider: React.ReactNode

		const idField = <Field field={PRIMARY_KEY_NAME} />
		if (props.arity === 'single') {
			reference = <HasOne field={props.field}>{idField}</HasOne>
		} else if (props.arity === 'multiple') {
			reference = <HasMany field={props.field}>{idField}</HasMany>
		} else {
			assertNever(props)
		}

		if ('renderOptionText' in props) {
			const sugaredEntityList: SugaredQualifiedEntityList =
				typeof props.options === 'string' || !('entities' in props.options)
					? {
							entities: props.options,
					  }
					: props.options
			entityListDataProvider = (
				<EntityListSubTree {...sugaredEntityList}>{props.optionFieldStaticFactory}</EntityListSubTree>
			)
		} else {
			const sugaredFieldList: SugaredQualifiedFieldList =
				typeof props.options === 'string' || !('fields' in props.options)
					? {
							fields: props.options,
					  }
					: props.options
			const fieldList = QueryLanguage.desugarQualifiedFieldList(sugaredFieldList, environment)
			entityListDataProvider = (
				<EntityListSubTree {...fieldList} entities={fieldList}>
					<Field field={fieldList.field} />
				</EntityListSubTree>
			)
		}

		return (
			<>
				{entityListDataProvider}
				{reference}
			</>
		)
	},
	'DynamicChoiceField',
)
DynamicChoiceField.displayName = 'DynamicChoiceField'
