import * as React from 'react'

export type Params = { [key: string]: {} }

export interface PageProps<P extends Params = Params, N extends keyof P = keyof Params> {
	name: N
	children: (params: P[N]) => React.ReactNode
}

/**
 * Page specifies one page. It must have a `name` prop and it's child must be a function which takes page's params and returns React node to render.
 */
export default class Page<P extends Params, N extends keyof P = keyof P, K = P[N]> extends React.Component<{
	name: N
	children: (params: K) => React.ReactNode
}> {
	render(): React.ReactNode {
		throw new Error(
			`The <Page /> component doesn't work if it is not placed as a direct child of the <Pages /> component`
		)
	}
}
