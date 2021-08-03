import { Component as ReactComponent, ReactNode } from 'react'

export interface Params {
	[key: string]: {}
}

export interface PageProps<P extends Params = Params, N extends keyof P = keyof Params> {
	name: N
	children: (params: P[N]) => ReactNode
}

/**
 * Page specifies one page. It must have a `name` prop and it's child must be a function which takes page's params and returns React node to render.
 */
export class Page<P extends Params, N extends keyof P = keyof P, K = P[N]> extends ReactComponent<{
	name: N
	children: (params: K) => ReactNode
}> {
	override render(): ReactNode {
		throw new Error(
			`The <Page /> component doesn't work if it is not placed as a direct child of the <Pages /> component`,
		)
	}
}
