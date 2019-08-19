import { FieldSet } from '@contember/ui'
import * as React from 'react'
import { RelativeSingleField } from '../../bindingTypes'
import { EnvironmentContext, ToMany } from '../../coreComponents'
import { MutationStateContext } from '../../coreComponents/PersistState'
import { EntityAccessor, EntityCollectionAccessor, FieldAccessor, VariableLiteral } from '../../dao'
import { VariableInputTransformer } from '../../model/VariableInputTransformer'
import { QueryLanguage } from '../../queryLanguage'
import { Component } from '../auxiliary'
import { SelectFieldInner } from '../fields'
import { AlternativeFields } from '../ui'
import { Sortable } from './Sortable'
import { SortableRepeaterProps } from './SortableRepeater'

export interface SortableBlockRepeaterProps extends SortableRepeaterProps {
	alternatives: AlternativeFields.ControllerFieldLiteralMetadata[]
	discriminationField: RelativeSingleField
	addNewLabel?: React.ReactNode
	children?: never
	emptyMessage?: React.ReactNode
}

export const SortableBlockRepeater = Component<SortableBlockRepeaterProps>(
	props => {
		const environment = React.useContext(EnvironmentContext)
		const isMutating = React.useContext(MutationStateContext)

		const addNewOptions = React.useMemo(
			() =>
				props.alternatives.map(([value, label, foo], index) => {
					return {
						key: index,
						label,
						actualValue:
							value instanceof VariableLiteral
								? VariableInputTransformer.transformVariableLiteral(value, environment)
								: value,
					}
				}),
			[environment, props.alternatives],
		)

		return QueryLanguage.wrapRelativeEntityList(
			props.field,
			atomicPrimitiveProps => (
				<ToMany.AccessorRetriever {...atomicPrimitiveProps}>
					{(field: EntityCollectionAccessor) => {
						const filteredEntities: EntityAccessor[] = field.entities.filter(
							(item): item is EntityAccessor => item instanceof EntityAccessor,
						)
						const firstEntity = filteredEntities[0]
						const firstDiscrimination = firstEntity.data.getField(props.discriminationField)

						if (!(firstDiscrimination instanceof FieldAccessor)) {
							return
						}
						const firstDiscriminationNull = firstDiscrimination.currentValue === null

						const shouldViewContent = filteredEntities.length > 1 || !firstDiscriminationNull

						return (
							// Intentionally not applying label system middleware
							<FieldSet legend={props.label} errors={field.errors}>
								<div className="cloneable">
									{shouldViewContent && (
										<div className="cloneable-content">
											<Sortable
												entities={field}
												sortBy={props.sortBy}
												label={props.label}
												enableAddingNew={false}
												enableUnlink={props.enableUnlink}
												enableUnlinkAll={props.enableUnlinkAll}
												removeType={props.removeType}
											>
												<AlternativeFields
													label={props.label}
													alternatives={props.alternatives}
													name={props.discriminationField}
													allowBlockTypeChange={true}
												/>
											</Sortable>
										</div>
									)}
									{shouldViewContent || (
										<div className="cloneable-emptyMessage">
											{props.emptyMessage || 'There is no content yet. Try adding a new block.'}
										</div>
									)}
									{field.addNew && (
										<div className="cloneable-button">
											<SelectFieldInner
												label={props.addNewLabel}
												data={addNewOptions}
												currentValue={-1}
												onChange={newValue => {
													if (!(newValue in addNewOptions)) {
														return
													}
													const targetValue = addNewOptions[newValue].actualValue
													if (filteredEntities.length === 1 && firstDiscriminationNull) {
														return firstDiscrimination.updateValue && firstDiscrimination.updateValue(targetValue)
													}
													field.addNew &&
														field.addNew(getAccessor => {
															const accessor = getAccessor()
															const newlyAdded = accessor.entities[accessor.entities.length - 1]
															if (!(newlyAdded instanceof EntityAccessor)) {
																return
															}
															// TODO this will fail horribly if QL is present here
															const discriminationField = newlyAdded.data.getField(props.discriminationField)
															if (!(discriminationField instanceof FieldAccessor) || !discriminationField.updateValue) {
																return
															}
															discriminationField.updateValue(targetValue)
														})
												}}
												environment={environment}
												errors={[]}
												firstOptionCaption="+ Add new"
												isMutating={isMutating}
											/>
										</div>
									)}
								</div>
							</FieldSet>
						)
					}}
				</ToMany.AccessorRetriever>
			),
			environment,
		)
	},
	(props, environment) => (
		<ToMany field={props.field}>
			<Sortable sortBy={props.sortBy}>
				{AlternativeFields.generateSyntheticChildren(
					{
						name: props.discriminationField,
						alternatives: props.alternatives,
						label: props.label,
					},
					environment,
				)}
			</Sortable>
		</ToMany>
	),
	'SortableBlockRepeater',
)
