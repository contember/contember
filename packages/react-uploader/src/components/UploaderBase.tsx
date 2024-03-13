import { Component, HasOne } from '@contember/react-binding'
import { UploaderBaseFieldProps } from '../types'
import { ReactNode } from 'react'

export type UploaderBaseProps =
	& UploaderBaseFieldProps
	& {
		children: ReactNode
	}
export const UploaderBase = Component<UploaderBaseProps>(({ baseField, children }) => {
	return baseField ? <HasOne field={baseField}>{children}</HasOne> : <>{children}</>
})
