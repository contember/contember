import { FunctionComponent, memo } from 'react'
import { PageProvider } from '../Pages'
import { getPageName } from './getPageName'

export type PageComponent<T> =
	& T
	& PageProvider<T extends (props: infer P) => any ? P : never>

export const pageComponent = <T>(component: T, displayName: string): PageComponent<T> => {
	const c = memo(component as FunctionComponent)
	c.displayName = displayName
	;(c as Partial<PageProvider<any>>).getPageName = getPageName

	return c as unknown as PageComponent<T>
}
