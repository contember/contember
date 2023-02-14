import { Justification } from '@contember/ui'
import { ReactNode } from 'react'
import { DataGridRendererInnerProps } from '../types'

export interface DataGridHeaderCellPublicProps {
	header?: ReactNode
	shrunk?: boolean
	headerJustification?: Justification
	ascOrderIcon?: ReactNode
	descOrderIcon?: ReactNode
}

export interface DataGridCellPublicProps {
	justification?: Justification
	shrunk?: boolean
	hidden?: boolean
	canBeHidden?: boolean
}


export type DataGridColumnPublicProps =
	& DataGridCellPublicProps
	& DataGridHeaderCellPublicProps

export type DataGridRenderingCommonProps = DataGridRendererInnerProps<DataGridColumnPublicProps>
