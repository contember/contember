import { Pages as PagesBase, PagesProps } from '@contember/react-routing'
import { SpinnerOverlay } from '@contember/ui'
import { PageErrorBoundary } from './PageErrorBoundary'

export type {
	PagesProps,
	PageProps,
	PagesMapElement,
	PageModule,
	PageProvider,
	PageProviderElement,
	LazyPageModule,
	PagesMap,
} from '@contember/react-routing'

export {
	Page,
} from '@contember/react-routing'


export const Pages = (props: PagesProps) => {
	return (
		<PagesBase
			suspenseFallback={<SpinnerOverlay />}
			ErrorBoundary={PageErrorBoundary}
			{...props}
		/>
	)
}
