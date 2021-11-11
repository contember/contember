import { createContext, FC } from 'react'
import { BindingError } from '@contember/binding'
import { GetReferencedEntity } from './useGetReferencedEntity'

export const ReferencesContext = createContext<GetReferencedEntity>(() => {
	throw new BindingError()
})
export const ReferencesProvider: FC<{ getReferencedEntity: GetReferencedEntity}> = ({ children, getReferencedEntity }) => {

	return <ReferencesContext.Provider value={getReferencedEntity}>
		{children}
	</ReferencesContext.Provider>
}
