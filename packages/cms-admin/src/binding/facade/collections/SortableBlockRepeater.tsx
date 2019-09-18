import { Box, Button, ButtonGroup, Dropdown, FieldSet } from '@contember/ui'
import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { RelativeSingleField } from '../../bindingTypes'
import { EnvironmentContext, Field, ToMany } from '../../coreComponents'
import { MutationStateContext } from '../../coreComponents/PersistState'
import { DataBindingError, EntityAccessor, EntityCollectionAccessor, FieldAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { Component } from '../auxiliary'
import { DiscriminatedBlocks, NormalizedBlockProps } from '../ui'
import { useNormalizedBlockList } from '../ui/blocks/useNormalizedBlockList'
import { Sortable } from './Sortable'
import { SortableRepeaterProps } from './SortableRepeater'

export interface SortableBlockRepeaterProps extends SortableRepeaterProps {
	discriminationField: RelativeSingleField
	children: React.ReactNode
	emptyMessage?: React.ReactNode
}

export const SortableBlockRepeater = Component<SortableBlockRepeaterProps>(
	props => {
		const environment = React.useContext(EnvironmentContext)
		const isMutating = React.useContext(MutationStateContext)
		const normalizedBlockList: NormalizedBlockProps[] = useNormalizedBlockList(props.children)

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
												<SortableBlock
													normalizedBlockProps={normalizedBlockList}
													discriminationField={props.discriminationField}
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
											<Dropdown
												buttonProps={{
													children: '+ Add new',
												}}
											>
												{({ requestClose }) => (
													<ButtonGroup orientation="vertical">
														{normalizedBlockList.map((blockProps, i) => (
															<Button
																key={i}
																distinction="seamless"
																flow="block"
																disabled={isMutating}
																onClick={() => {
																	requestClose()
																	const targetValue = blockProps.discriminateBy
																	if (filteredEntities.length === 1 && firstDiscriminationNull) {
																		return (
																			firstDiscrimination.updateValue && firstDiscrimination.updateValue(targetValue)
																		)
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
																			if (
																				!(discriminationField instanceof FieldAccessor) ||
																				!discriminationField.updateValue
																			) {
																				return
																			}
																			discriminationField.updateValue(targetValue)
																		})
																}}
															>
																{blockProps.label}
																{blockProps.description && <small>{blockProps.description}</small>}
															</Button>
														))}
													</ButtonGroup>
												)}
											</Dropdown>
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
	props => (
		<ToMany field={props.field}>
			<Sortable sortBy={props.sortBy}>
				<DiscriminatedBlocks name={props.discriminationField} label={props.label}>
					{props.children}
				</DiscriminatedBlocks>
			</Sortable>
		</ToMany>
	),
	'SortableBlockRepeater',
)

interface SortableBlockProps {
	discriminationField: RelativeSingleField
	normalizedBlockProps: NormalizedBlockProps[]
}

const SortableBlock = React.memo<SortableBlockProps>(props => (
	<Field.DataRetriever name={props.discriminationField}>
		{rawMetadata => {
			const data = rawMetadata.data

			if (!(data instanceof EntityAccessor)) {
				throw new DataBindingError(`Corrupt data`)
			}
			const field = data.data.getField(props.discriminationField)

			if (!(field instanceof FieldAccessor)) {
				throw new DataBindingError(`Corrupt data`)
			}

			const selectedBlock = props.normalizedBlockProps.find(block => field.hasValue(block.discriminateBy))

			if (!selectedBlock) {
				return null
			}

			return (
				<Box heading={selectedBlock.label} distinction="seamlessIfNested">
					{selectedBlock.children}
				</Box>
			)
		}}
	</Field.DataRetriever>
))
SortableBlock.displayName = 'SortableBlock'
