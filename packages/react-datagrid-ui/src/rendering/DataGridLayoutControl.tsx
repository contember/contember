import { Button, ButtonList, Divider, TableRowsIcon } from '@contember/ui'
import { LayoutGridIcon } from 'lucide-react'
import { ReactNode, useCallback } from 'react'
import { useDataGridLayoutMethods, useDataGridLayoutState } from '@contember/react-datagrid'

export type DataGridLayoutControlPublicProps = {
	tile?: ReactNode
}

export type DataGridLayoutControlProps =
	& DataGridLayoutControlPublicProps

export const DataGridLayoutControl = ({ tile } : DataGridLayoutControlProps) => {
	const { setView } = useDataGridLayoutMethods()
	const setDefaultView = useCallback(() => setView('default'), [setView])
	const setTileView = useCallback(() => setView('tiles'), [setView])
	const layout = useDataGridLayoutState().view

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
