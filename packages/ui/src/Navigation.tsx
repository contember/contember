import * as React from 'react'

namespace Navigation {
	export interface CustomTarget {
		pageName: string
		parameters?: any
	}

	export type MiddlewareProps = {
		target: string | CustomTarget
		children?: React.ReactNode
	} & (
		| {
				Component: React.ComponentType<{
					navigate: () => void
					isActive: boolean
					children?: React.ReactNode
				}>
		  }
		| {
				linkProps?: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
		  })

	export type Middleware = React.ComponentType<MiddlewareProps>

	export const MiddlewareContext = React.createContext<Middleware>(({ target, children, ...props }) => {
		if (typeof target !== 'string') {
			throw new Error(`If you wish to support custom targets, implement your own navigation middleware.`)
		}

		if ('Component' in props) {
			const Component = props.Component
			return (
				<Component
					isActive={location.href === target}
					navigate={() => {
						location.href = target
					}}
				>
					{children}
				</Component>
			)
		}
		return (
			<a href={target} {...props.linkProps}>
				{children}
			</a>
		)
	})
}

export { Navigation }
