import { useClassNamePrefix } from './useClassNamePrefix'

export const useComponentClassName = (className: string) => {
	const prefix = useClassNamePrefix()

	return `${prefix}${className}`
}
