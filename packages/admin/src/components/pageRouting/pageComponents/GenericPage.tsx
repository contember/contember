import { LayoutPage, LayoutPageProps } from '@contember/ui'
import { ReactNode } from 'react'
import { pageComponent } from './pageComponent'

export type GenericPageProps =
	& Omit<LayoutPageProps, 'children'>
	& {
		pageName?: string
		children: ReactNode
	}

/**
 * Page for generic content. To use data binding, you must provide {@link @contember/binding#DataBindingProvider}
 *
 * @example
 * ```
 * <GenericPage>
 *   <p>Welcome to Contember.</p>
 * </GenericPage>
 * ```
 *
 * @group Pages
 */
export const GenericPage = pageComponent(
	({ children, ...props }: GenericPageProps) => <LayoutPage {...props}>{children}</LayoutPage>,
	'GenericPage',
)
