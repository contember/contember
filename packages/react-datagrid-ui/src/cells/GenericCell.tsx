import { createGenericCell } from '@contember/react-datagrid'
import { DataGridColumnPublicProps } from '../types'

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
export const GenericCell = createGenericCell<DataGridColumnPublicProps>()
