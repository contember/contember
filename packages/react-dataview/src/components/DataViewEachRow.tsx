import { ReactNode } from 'react'
import { Entity, EntityAccessor } from '@contember/react-binding'
import { useDataViewEntityListAccessor } from '../contexts'

/**
 * Renders children for each row in the DataView.
 *
 * ## Example
 * ```tsx
 * <DataViewEachRow>
 *     <Field field="name" />
 * </DataViewEachRow>
 * ```
 */
export const DataViewEachRow = ({ children }: { children: ReactNode }) => {
	const accessor = useDataViewEntityListAccessor()
	if (!accessor) {
		return null
	}
	return <>
		{Array.from(accessor, (entity: EntityAccessor) => {
			return (
				<Entity key={entity.key} accessor={entity}>
					{children}
				</Entity>
			)
		})}
	</>
}
