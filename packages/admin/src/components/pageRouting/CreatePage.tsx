import {
	DataBindingProvider,
	EntityAccessor,
	EntitySubTree,
	EntitySubTreeAdditionalCreationProps,
	EntitySubTreeAdditionalProps,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import { ComponentType, memo, ReactNode, useMemo } from 'react'
import RequestState from '../../state/request'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { useRedirect } from './useRedirect'

export type CreatePageProps = Omit<SugaredUnconstrainedQualifiedSingleEntity, 'isCreating'> &
	EntitySubTreeAdditionalProps &
	EntitySubTreeAdditionalCreationProps & {
		pageName: string
		children: ReactNode
		redirectOnSuccess?: (currentState: RequestState, persistedId: string) => RequestState
		rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
	}

const CreatePage: Partial<PageProvider<CreatePageProps>> & ComponentType<CreatePageProps> = memo(
	({ pageName, children, rendererProps, redirectOnSuccess, ...entityProps }: CreatePageProps) => {
		const redirect = useRedirect()

		const onPersistSuccess = useMemo<EntityAccessor.PersistSuccessHandler | undefined>(() => {
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
