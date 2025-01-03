import React, { ReactNode } from 'react'
import { RepeaterCurrentEntityContext, useRepeaterSortedEntities } from '../contexts'
import { Entity } from '@contember/react-binding'

/**
 * Iterates over all entities in the repeater and renders the children for each entity.
 *
 * ## Example
 * ```tsx
 * <RepeaterEachItem>
 *     <div>
 *         <RepeaterRemoveItemTrigger>
 *             <button>Remove</button>
 *          </RepeaterRemoveItemTrigger>
 *          <Field name="title" />
 *     </div>
 * </RepeaterEachItem>
 * ```
 */
export const RepeaterEachItem = ({ children }: { children: ReactNode }) => {
	const entities = useRepeaterSortedEntities()
	return <>
		{entities.map(entity => (
			<Entity key={entity.key} accessor={entity}>
				<RepeaterCurrentEntityContext.Provider value={entity}>
					{children}
				</RepeaterCurrentEntityContext.Provider>
			</Entity>
		))}
	</>
}
