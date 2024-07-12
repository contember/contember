import { useReducer } from 'react'

export const useForceRender = () => {
	const [, forceRender] = useReducer((s: number) => s + 1, 0)
	return forceRender
}
