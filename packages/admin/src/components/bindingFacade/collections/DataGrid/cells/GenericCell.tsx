import { Component } from '@contember/react-binding'
import type { FunctionComponent } from 'react'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'

export type GenericCellProps = DataGridColumnPublicProps

/**
 * Cell for displaying arbitrary content such as buttons. This cell does not support sorting or filtering.
 *
 * @example
 * ```
 * <GenericCell canBeHidden={false} justification="justifyEnd">
 * 	<LinkButton to={`article/edit(id: $entity.id)`} Component={AnchorButton}>Edit</LinkButton>
 * 	<DeleteEntityButton title="Delete" immediatePersist={true} />
 * </GenericCell>
 * ```
 *
 * @group Data grid
 */
export const GenericCell: FunctionComponent<GenericCellProps> = Component(props => {
	return (
		<DataGridColumn<string> {...props} enableOrdering={false} enableFiltering={false}>
			{props.children}
		</DataGridColumn>
	)
}, 'GenericCell')
