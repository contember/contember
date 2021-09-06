import { EnvironmentContext, useEnvironment } from '@contember/binding'
import {
	ComponentType,
	Fragment,
	isValidElement,
	ReactElement,
	ReactNode,
	ReactNodeArray,
	useMemo,
	useRef,
} from 'react'
import { PageErrorBoundary } from './PageErrorBoundary'
import { useCurrentRequest } from '../../routing'
import { Message } from '@contember/ui'
import { MiscPageLayout } from '../MiscPageLayout'

export type PageProvider<P> = ComponentType & {
	getPageName(props: P): string
}

export type PageProviderElement = ReactElement<any, PageProvider<any>>

export interface PagesProps {
	children: PageProviderElement[] | PageProviderElement
	layout?: ComponentType<{ children?: ReactNode }>
}

function isPageProviderElement(el: ReactNode): el is PageProviderElement {
	return isValidElement(el) && typeof el.type !== 'string' && typeof (el.type as any).getPageName === 'function'
}

function isPageList(children: ReactNodeArray): children is PageProviderElement[] {
	return children.every(child => isPageProviderElement(child))
}

/**
 * Pages element specifies collection of pages (component Page or component with getPageName static method).
 */
export const Pages = (props: PagesProps) => {
	const rootEnv = useEnvironment()
	const request = useCurrentRequest()
	const requestId = useRef<number>(0)
	const Layout = props.layout ?? Fragment

	const pageMap = useMemo(
		() => {
			const pageList = Array.isArray(props.children) ? props.children : [props.children]

			if (!isPageList(pageList)) {
				throw new Error('Pages has a child which is not a Page')
			}

			return new Map(pageList.map(child => [child.type.getPageName(child.props), child]))
		},
		[props.children],
	)

	const page = request ? pageMap.get(request.pageName) : undefined

	if (request === null || page === undefined) {
		return (
			<MiscPageLayout>
				<Message type="danger" size="large">Page not found</Message>
			</MiscPageLayout>
		)
	}

	const requestEnv = rootEnv
		.updateDimensionsIfNecessary(request.dimensions, rootEnv.getAllDimensions())
		.putDelta(request.parameters)

	return (
		<EnvironmentContext.Provider value={requestEnv}>
			<Layout>
				<PageErrorBoundary key={requestId.current++}>{page}</PageErrorBoundary>
			</Layout>
		</EnvironmentContext.Provider>
	)
}
