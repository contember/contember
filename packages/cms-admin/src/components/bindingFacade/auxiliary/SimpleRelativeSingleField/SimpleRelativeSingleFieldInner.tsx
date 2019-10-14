import { FormGroup } from '@contember/ui'
import * as React from 'react'
import { AccessorContext } from '../../../../binding/accessorRetrievers'
import { FieldMetadata } from '../../../../binding/coreComponents'
import { EntityAccessor } from '../../../../binding/dao'
import { SimpleRelativeSingleFieldProxyProps } from './SimpleRelativeSingleFieldProxy'

export type SimpleRelativeSingleFieldInnerProps = SimpleRelativeSingleFieldProxyProps & {
	immediateParentEntity: EntityAccessor
	fieldMetadata: FieldMetadata
}

export const SimpleRelativeSingleFieldInner = React.memo(
	({ fieldMetadata, immediateParentEntity, render, ...props }: SimpleRelativeSingleFieldInnerProps) => {
		if (!render) {
			return null
		}
		return (
			<FormGroup
				label={
					props.label && (
						<AccessorContext.Provider value={immediateParentEntity}>
							{fieldMetadata.environment.applySystemMiddleware('labelMiddleware', props.label)}
						</AccessorContext.Provider>
					)
				}
				size={props.size}
				labelDescription={
					props.labelDescription && (
						<AccessorContext.Provider value={immediateParentEntity}>{props.labelDescription}</AccessorContext.Provider>
					)
				}
				labelPosition={props.labelPosition}
				description={
					props.description && (
						<AccessorContext.Provider value={immediateParentEntity}>{props.description}</AccessorContext.Provider>
					)
				}
				errors={fieldMetadata.errors}
			>
				{render(fieldMetadata, props)}
			</FormGroup>
		)
	},
)
SimpleRelativeSingleFieldInner.displayName = 'SimpleRelativeSingleFieldInner'
