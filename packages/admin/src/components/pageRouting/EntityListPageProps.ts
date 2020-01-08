import { EntityListDataProviderProps } from '@contember/binding'

export interface EntityListPageProps extends Omit<EntityListDataProviderProps, 'subTreeIdentifier'> {
	pageName: string
}
