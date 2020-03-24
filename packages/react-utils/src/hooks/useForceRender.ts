import * as React from 'react'

export const useForceRender = () => {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0)
	return forceRender
}
