import { assertNever } from 'cms-common'
import * as React from 'react'
import { FieldName } from '../../../bindingTypes'
import { ToOne } from '../../../coreComponents'
import {
	AccessorTreeRoot,
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityForRemovalAccessor,
	FieldAccessor,
	ReferenceMarker,
} from '../../../dao'
import { Parser } from '../../../queryLanguage'
import { BaseChoiceMetadata, ChoiceArity, ChoiceField, SingleChoiceFieldMetadata } from './ChoiceField'

export type DynamicChoiceFieldProps = ChoiceField.InnerBaseProps & {
	options: FieldName
}

export class DynamicChoiceField extends React.PureComponent<DynamicChoiceFieldProps> {
	public render() {
		const data = this.props.rawMetadata.data

		if (!(data instanceof EntityAccessor)) {
			throw new DataBindingError('Corrupted data')
		}

		const parsedOptions = Parser.parseQueryLanguageExpression(
			this.props.options,
			this.props.optionFieldFactory ? Parser.EntryPoint.QualifiedEntityList : Parser.EntryPoint.QualifiedFieldList,
			this.props.rawMetadata.environment,
		)
		const { toOneProps } = parsedOptions

		const subTreeRootAccessor = data.data.getTreeRoot(this.props.rawMetadata.fieldName)
		const currentValueEntity = data.data.getField(this.props.rawMetadata.fieldName)

		if (!(subTreeRootAccessor instanceof AccessorTreeRoot)) {
			throw new DataBindingError('Corrupted data: dynamic choice field options have not been retrieved.')
		}
		if (
			currentValueEntity === undefined ||
			currentValueEntity instanceof FieldAccessor ||
			currentValueEntity instanceof AccessorTreeRoot
		) {
			throw new DataBindingError('Corrupted data: dynamic choice field must be a reference, not a field or a sub-tree.')
		}

		if (
			this.props.arity === ChoiceArity.Single &&
			!(currentValueEntity instanceof EntityAccessor || currentValueEntity instanceof EntityForRemovalAccessor)
		) {
			throw new DataBindingError('Corrupted data: dynamic single-choice field must be a reference to a single entity.')
		}
		if (this.props.arity === ChoiceArity.Multiple && !(currentValueEntity instanceof EntityCollectionAccessor)) {
			throw new DataBindingError(
				'Corrupted data: dynamic multiple-choice field must be a reference to a collection of entities.',
			)
		}

		const subTreeData = subTreeRootAccessor.root

		if (!(subTreeData instanceof EntityCollectionAccessor)) {
			throw new DataBindingError('Corrupted data')
		}
		const filteredData = subTreeData.entities.filter(
			(accessor): accessor is EntityAccessor => accessor instanceof EntityAccessor && !!accessor.getPersistedKey(),
		)

		const optionEntities: EntityAccessor[] = []

		for (let entity of filteredData) {
			for (let i = toOneProps.length - 1; i >= 0; i--) {
				const props = toOneProps[i]

				const field = entity.data.getField(
					props.field,
					ReferenceMarker.ExpectedCount.UpToOne,
					props.filter,
					props.reducedBy,
				)

				if (field instanceof EntityAccessor) {
					entity = field
				} else {
					throw new DataBindingError('Corrupted data')
				}
			}
			optionEntities.push(entity)
		}

		const entities =
			currentValueEntity instanceof EntityCollectionAccessor ? currentValueEntity.entities : [currentValueEntity]

		const currentValues: ChoiceField.ValueRepresentation[] = []

		for (const entity of entities) {
			if (entity instanceof EntityAccessor) {
				const currentKey = entity.getKey()
				const index = filteredData.findIndex(entity => {
					const key = entity.getPersistedKey()
					return !!key && key === currentKey
				})
				if (index > -1) {
					currentValues.push(index)
				}
			}
		}

		const normalizedData = optionEntities.map(
			(item, i): ChoiceField.SingleDatum => {
				let label: ChoiceField.Label

				if (this.props.optionFieldFactory) {
					label = <ToOne.AccessorRenderer accessor={item}>{this.props.optionFieldFactory}</ToOne.AccessorRenderer>
				} else if ('fieldName' in parsedOptions) {
					const field = item.data.getField(parsedOptions.fieldName)
					label = field instanceof FieldAccessor ? (field.currentValue as ChoiceField.Label) : null
				}

				return {
					key: i,
					label,

					// We can get away with the "!" since this collection was created from filteredData above.
					// If this is actually an unpersisted entity, we've got a huge problem.
					actualValue: item.getPersistedKey()!,
				}
			},
		)

		const baseMetadata: BaseChoiceMetadata = {
			...this.props.rawMetadata,
			data: normalizedData,
			errors: currentValueEntity.errors,
		}

		if (this.props.arity === ChoiceArity.Multiple) {
			return this.props.children({
				...baseMetadata,
				currentValues: currentValues,
				onChange: (optionKey: ChoiceField.ValueRepresentation, isChosen: boolean) => {
					if (currentValueEntity instanceof EntityCollectionAccessor && currentValueEntity.addNew) {
						if (isChosen) {
							currentValueEntity.addNew(optionEntities[optionKey])
						} else {
							const targetEntityId = optionEntities[optionKey].getPersistedKey()

							for (const searchedEntity of currentValueEntity.entities) {
								if (!(searchedEntity instanceof EntityAccessor)) {
									continue
								}
								if (searchedEntity.getPersistedKey() === targetEntityId) {
									searchedEntity.remove && searchedEntity.remove(EntityAccessor.RemovalType.Disconnect)
									break
								}
							}
						}
					}
				},
			})
		} else if (this.props.arity === ChoiceArity.Single) {
			// No idea why this cast is necessary. TS is just being silly here…
			return ((this.props.children as any) as (metadata: SingleChoiceFieldMetadata) => React.ReactNode)({
				...baseMetadata,
				currentValue: currentValues.length ? currentValues[0] : -1,
				onChange: (newValue: ChoiceField.ValueRepresentation) => {
					const entity = entities[0]
					if (entity === undefined) {
						return
					}

					if (newValue === -1) {
						if (entity instanceof EntityAccessor && entity.remove) {
							entity.remove(EntityAccessor.RemovalType.Disconnect)
						}
					} else {
						entity.replaceWith && entity.replaceWith(filteredData[newValue])
					}
				},
			})
		} else {
			return assertNever(this.props)
		}
	}
}
