import { Button, ButtonList, Divider, TableRowsIcon } from '@contember/ui'
import { LayoutGridIcon } from 'lucide-react'
import { ReactNode, useCallback } from 'react'
import { useDataGridSetLayout, useDataGridLayout } from '@contember/react-datagrid'

export type DataGridLayoutControlPublicProps = {
	tile?: ReactNode
}

export type DataGridLayoutControlProps =
	& DataGridLayoutControlPublicProps

export const DataGridLayoutControl = ({ tile } : DataGridLayoutControlProps) => {
	const setView = useDataGridSetLayout()
	const setDefaultView = useCallback(() => setView('default'), [setView])
	const setTileView = useCallback(() => setView('tiles'), [setView])
	const layout = useDataGridLayout()

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
