import {
	DataBindingProvider,
	PersistResultSuccessType,
	SingleEntitySubTree,
	SingleEntitySubTreeAdditionalProps,
	SuccessfulPersistResult,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding'
import * as React from 'react'
import RequestState from '../../state/request'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import { PageProvider } from './PageProvider'
import { useRedirect } from './useRedirect'

export interface CreatePageProps extends SugaredUnconstrainedQualifiedSingleEntity, SingleEntitySubTreeAdditionalProps {
	pageName: string
	children: React.ReactNode
	redirectOnSuccess?: (currentState: RequestState, persistedId: string) => RequestState
	rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
}

const CreatePage: Partial<PageProvider<CreatePageProps>> & React.ComponentType<CreatePageProps> = React.memo(
	({ pageName, children, rendererProps, redirectOnSuccess, ...entityProps }: CreatePageProps) => {
		const redirect = useRedirect()

		const onSuccessfulPersist = React.useMemo(() => {
			if (!redirectOnSuccess) {
				return undefined
			}
			return (result: SuccessfulPersistResult) => {
				if (result.type === PersistResultSuccessType.NothingToPersist) {
					return
				}
				redirect(request => redirectOnSuccess(request, result.persistedEntityIds[0]))
			}
		}, [redirectOnSuccess, redirect])

		return (
			<DataBindingProvider stateComponent={FeedbackRenderer} onSuccessfulPersist={onSuccessfulPersist}>
				<SingleEntitySubTree
					{...entityProps}
					entityComponent={MutableSingleEntityRenderer}
					entityProps={rendererProps}
					isCreating
				>
					{children}
				</SingleEntitySubTree>
			</DataBindingProvider>
		)
	},
)

CreatePage.displayName = 'CreatePage'
CreatePage.getPageName = (props: CreatePageProps) => props.pageName

export { CreatePage }
