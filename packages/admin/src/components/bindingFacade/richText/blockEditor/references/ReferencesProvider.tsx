import { createContext, FC, ReactNode } from 'react'
import { BindingError } from '@contember/binding'
import { GetReferencedEntity } from './useGetReferencedEntity'

export const ReferencesContext = createContext<GetReferencedEntity>(() => {
	throw new BindingError()
})

export type ReferencesProviderProps = {
	getReferencedEntity: GetReferencedEntity,
	children: ReactNode
}

export const ReferencesProvider: FC<ReferencesProviderProps> = ({ children, getReferencedEntity }) => {

	return (
		<ReferencesContext.Provider value={getReferencedEntity}>
			{children}
		</ReferencesContext.Provider>
	)
}
