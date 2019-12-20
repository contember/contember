import { EntityListDataProviderProps } from '../../binding/coreComponents'

export interface EntityListPageProps extends Omit<EntityListDataProviderProps, 'subTreeIdentifier'> {
	pageName: string
}
