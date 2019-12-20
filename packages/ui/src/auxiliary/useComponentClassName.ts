import * as React from 'react'
import { GlobalClassNamePrefixContext } from '../contexts'

export const useComponentClassName = (className: string) => {
	const prefix = React.useContext(GlobalClassNamePrefixContext)

	return `${prefix}${className}`
}
