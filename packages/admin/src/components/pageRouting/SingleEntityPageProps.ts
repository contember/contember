import { SingleEntityDataProviderProps } from '../../binding'

export interface SingleEntityPageProps extends Omit<SingleEntityDataProviderProps, 'subTreeIdentifier'> {
	pageName: string
}
