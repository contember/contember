import type { ReactElement, ReactNode } from 'react'
import type { Default } from '../../types'
import { BoxProps } from '../Box'

export interface RenderDialogContentProps<Result> {
	resolve: (value?: Result) => void
}

export interface DialogSettings<Result> {
	content: (props: RenderDialogContentProps<Result>) => ReactElement
	container?: HTMLElement
	type?: Default | 'immersive' | 'captivating'
	bare?: boolean
	heading?: ReactNode
	gap?: BoxProps['gap']
}
