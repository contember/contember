import type { ReactNode } from 'react'

export interface RadioOption {
	label: ReactNode
	labelDescription?: ReactNode
	value: string
}
