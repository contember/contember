export type DataGridLayout = 'default' | 'tiles'
export type SetDataGridLayout = (layout: DataGridLayout) => void

export type DataGridLayoutState = {
	view: DataGridLayout
}

export type DataGridLayoutMethods = {
	setView: SetDataGridLayout
}
