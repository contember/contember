import type { ReactElement, ReactNode } from 'react'
import type { Default } from '../../types'
import { BoxProps } from '../Box'

export interface RenderDialogContentProps<Success> {
	resolve: (value: Success) => void
	reject: () => void
}

export interface DialogSettings<Success> {
	content: (props: RenderDialogContentProps<Success>) => ReactElement | null
	container?: HTMLElement
	signal?: AbortSignal
	type?: Default | 'immersive' | 'captivating'
	bare?: boolean
	heading?: ReactNode
	gap?: BoxProps['gap']
}
