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
 * Binding component - Core data management wrapper for Contember applications
 *
 * #### Purpose
 * Provides essential data binding, error handling, and navigation protection for application screens
 *
 * #### Features
 * - Wraps content with DataBindingProvider
 * - Automatic loading state handling
 * - Navigation loss prevention
 * - Global error handling:
 *   - Unauthorized redirects
 *   - Persistence error toasts
 *   - Development error boundaries
 *
 * #### Subcomponents
 * 1. `NavigationGuardDialog`: Prevents accidental navigation with unsaved changes
 * 2. `PersistErrorHandler`: Shows error toasts for persistence failures
 * 3. `BindingStateRenderer`: Handles loading/error states
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
export const Binding = ({ children }: {
	children: ReactNode
}) => {
	return (
		<DataBindingProvider stateComponent={BindingStateRenderer}>
			<NavigationGuardDialog />
			<PersistErrorHandler />
			{children}
		</DataBindingProvider>
	)
}
