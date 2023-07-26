import type { ReactElement, ReactNode } from 'react'
import type { Default } from '../../types'
import { BoxProps } from '../Box'

export interface RenderDialogContentProps<Result> {
	resolve: (value?: Result) => void
}

export interface DialogSettings<Result> {
	bare?: boolean
	container?: HTMLElement
	content: (props: RenderDialogContentProps<Result>) => ReactElement
	footer?: (props: RenderDialogContentProps<Result>) => ReactElement
	gap?: BoxProps['gap']
	heading?: ReactNode
	type?: Default | 'immersive' | 'captivating'
}
