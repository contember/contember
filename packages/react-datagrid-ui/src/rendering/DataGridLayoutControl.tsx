import { Button, ButtonList, Divider, TableRowsIcon } from '@contember/ui'
import { DataGridRenderingCommonProps } from '../types'
import { LayoutGridIcon } from 'lucide-react'
import { ReactNode, useCallback } from 'react'

export type DataGridLayoutControlPublicProps = {
	tile?: ReactNode
}

export type DataGridLayoutControlProps =
	& DataGridRenderingCommonProps
	& DataGridLayoutControlPublicProps

export const DataGridLayoutControl = ({ stateMethods: { setLayout }, desiredState: { layout }, tile }: DataGridLayoutControlProps) => {
	const setDefaultView = useCallback(() => setLayout('default'), [setLayout])
	const setTileView = useCallback(() => setLayout('tiles'), [setLayout])

	if (!tile) {
		return null
	}

	return <>
		<ButtonList gap="gutter">
			<Button onClick={setTileView} size="small" distinction="seamless" intent={layout === 'tiles' ? undefined : 'default'}>
				<LayoutGridIcon />
			</Button>
			<Button onClick={setDefaultView} size="small" distinction="seamless" intent={layout === 'default' ? undefined : 'default'}>
				<TableRowsIcon />
			</Button>
		</ButtonList>

		<Divider gap={false} />
	</>
}
