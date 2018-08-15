import * as React from 'react'

export type Params = { [key: string]: {} }

export interface PageProps<P extends Params = Params, N extends keyof P = keyof Params> {
	name: N
	children: (params: P[N]) => React.ReactNode
}

export default class Page<P extends Params, N extends keyof P = keyof P, K = P[N]> extends React.Component<{
	name: N
	children: (params: K) => React.ReactNode
}> {
	render(): React.ReactNode {
		throw new Error(`Page component doesn't work if it is not places as a direct child of Admin component`)
	}
}
