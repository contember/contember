import { createControlledDataGrid, createDataGrid, createDataGridRenderer } from '@contember/react-datagrid'
import { DataGridColumnPublicProps } from './types'
import { DataGridContainer, DataGridContainerPublicProps } from './rendering'
import { SpinnerContainer } from '@contember/ui'

const DataGridRenderer = createDataGridRenderer<DataGridColumnPublicProps, DataGridContainerPublicProps>({
	Fallback: SpinnerContainer,
	Container: DataGridContainer,
	StaticRender: props => <>{props.tile}</>,
	ColumnStaticRender: props => <>{props.column.header}</>,
})

/**
 * Main DataGrid component. Requires cells as a children.
 *
 * @example
 * ```
 * <DataGrid
 *   entities="Article"
 *   itemsPerPage={50}
 * >
 *   <TextCell header="Title" field="title" />
 *   <TextCell header="Author" field="author.name" />
 * </DataGrid>
 * ```
 *
 * @group Data grid
 */
export const DataGrid = createDataGrid(DataGridRenderer)

/**
 * Supplementary DataGrid component for advanced use. Using this component, you can access and modify internal state such as filters or pagination. Use this component together with a {@link useDataGrid} hook.
 *
 * @example
 * ```
 * const dataGrid = useDataGrid({
 *   entities: "Article",
 * })
 * const applyFilter = () => {
 *     dataGrid.stateMethods.setFilter('title', myFilter)
 * }
 * <ControlledDataGrid {...dataGrid}>
 *   <TextCell header="Title" field="title" />
 *   <TextCell header="Author" field="author.name" />
 * </ControlledDataGrid>
 * ```
 *
 *
 * @group Data grid
 */
export const ControlledDataGrid = createControlledDataGrid(DataGridRenderer)
