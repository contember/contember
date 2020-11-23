import {
	DataBindingProvider,
	EntityAccessor,
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import * as React from 'react'
import RequestState from '../../state/request'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { useRedirect } from './useRedirect'

export type CreatePageProps = SugaredUnconstrainedQualifiedSingleEntity &
	EntitySubTreeAdditionalProps &
	EntitySubTreeAdditionalCreationProps & {
		pageName: string
		children: React.ReactNode
		redirectOnSuccess?: (currentState: RequestState, persistedId: string) => RequestState
		rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
	}

const CreatePage: Partial<PageProvider<CreatePageProps>> & React.ComponentType<CreatePageProps> = React.memo(
	({ pageName, children, rendererProps, redirectOnSuccess, ...entityProps }: CreatePageProps) => {
		const redirect = useRedirect()

		const onPersistSuccess = React.useMemo<EntityAccessor.PersistSuccessHandler | undefined>(() => {
			if (!redirectOnSuccess) {
				return undefined
			}
			return (getAccessor, options) => {
				if (options.successType === 'nothingToPersist') {
					return
				}
				redirect(request => redirectOnSuccess(request, options.unstable_persistedEntityIds[0]))
			}
		}, [redirectOnSuccess, redirect])

		return (
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<EntitySubTree
					{...entityProps}
					entityComponent={MutableSingleEntityRenderer}
					entityProps={rendererProps}
					onPersistSuccess={onPersistSuccess}
					isCreating
				>
					{children}
				</EntitySubTree>
			</DataBindingProvider>
		)
	},
)

CreatePage.displayName = 'CreatePage'
CreatePage.getPageName = (props: CreatePageProps) => props.pageName

export { CreatePage }
