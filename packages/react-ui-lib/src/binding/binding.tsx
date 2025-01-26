import { ReactNode, useEffect } from 'react'
import { AccessorTreeState, DataBindingProvider, useDataBindingEvent } from '@contember/interface'
import { Loader } from '../ui/loader'
import { NavigationGuardDialog } from './navigation-guard-dialog'
import { usePersistErrorHandler } from './hooks'

const PersistErrorHandler = () => {
	useDataBindingEvent('persistError', usePersistErrorHandler())
	return null
}

export interface BindingStateRendererProps {
	accessorTreeState: AccessorTreeState
	children?: ReactNode
}

const BindingStateRenderer = ({ accessorTreeState, children }: BindingStateRendererProps) => {
	useEffect(() => {
		if (accessorTreeState.name === 'error' && accessorTreeState.error.type === 'unauthorized') {
			const backlink = window.location.pathname + window.location.search
			window.location.href = `/?backlink=${encodeURIComponent(backlink)}` // redirect to login with backlink
		}
	}, [accessorTreeState])

	if (accessorTreeState.name === 'initializing') {
		return <Loader />
	}

	if (accessorTreeState.name === 'error') {
		if (accessorTreeState.error.type === 'unauthorized') {
			return null // This results in a redirect for now, and so the actual handling is in an effect
		}
		if (import.meta.env.DEV) {
			throw accessorTreeState.error
		}

		return <div>{accessorTreeState.error.type}</div>
	}

	return <>{children}</>
}

/**
 * Props for the {@link Binding} component.
 */
export type BindingProps = {
	/**
	 * The content to be wrapped by the Binding component.
	 */
	children: ReactNode
}

/**
 * Props {@link BindingProps}.
 *
 * `Binding` component - Core data management wrapper for Contember applications
 *
 * #### Subcomponents
 * - {@link NavigationGuardDialog}: Prevents accidental navigation with unsaved changes
 *
 * #### Example
 * ```tsx
 * <Binding>
 *   <EntitySubTree entity="Article(id: $id)">
 *     <ArticleForm />
 *   </EntitySubTree>
 * </Binding>
 * ```
 */
export const Binding = ({ children }: BindingProps) => {
	return (
		<DataBindingProvider stateComponent={BindingStateRenderer}>
			<NavigationGuardDialog />
			<PersistErrorHandler />
			{children}
		</DataBindingProvider>
	)
}
