import * as React from 'react'

namespace Navigation {
	export interface CustomTo {
		pageName: string
		parameters?: any
	}

	export type MiddlewareProps = {
		to: string | CustomTo
		children?: React.ReactNode
	} & (
		| {
				Component: React.ComponentType<{
					navigate: () => void
					isActive: boolean
					children?: React.ReactNode
				}>
		  }
		| Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)

	export type Middleware = React.ComponentType<MiddlewareProps>

	export const MiddlewareContext = React.createContext<Middleware>(({ to, children, ...props }) => {
		if (typeof to !== 'string') {
			throw new Error(`If you wish to support custom targets, implement your own navigation middleware.`)
		}

		if ('Component' in props) {
			const Component = props.Component
			return (
				<Component
					isActive={location.pathname === to}
					navigate={() => {
						location.href = to
					}}
				>
					{children}
				</Component>
			)
		}
		return (
			<a href={to} {...props}>
				{children}
			</a>
		)
	})

	export type IsActive = (to: string | CustomTo) => boolean

	export const IsActiveContext = React.createContext<IsActive>(to => false)

	export const useIsActive = (to: string | CustomTo | undefined) => {
		const isActiveContext = React.useContext(IsActiveContext)
		if (to === undefined) {
			return false
		}
		return isActiveContext(to)
	}
}

export { Navigation }
