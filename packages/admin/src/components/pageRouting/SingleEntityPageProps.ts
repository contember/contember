import { SingleEntityDataProviderProps } from '@contember/binding'

export interface SingleEntityPageProps extends Omit<SingleEntityDataProviderProps, 'subTreeIdentifier'> {
	pageName: string
}
