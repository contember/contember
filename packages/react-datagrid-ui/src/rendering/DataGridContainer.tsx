import { ComponentType, memo } from 'react'
import { Stack } from '@contember/ui'
import { DataGridHeader } from './DataGridHeader'
import { DataGridContent } from './DataGridContent'
import { DataGridFooter } from './DataGridFooter'
import { DataGridRenderingCommonProps } from '../types'
import { useClassName } from '@contember/react-utils'


export const createDataGridContainer = <HeaderProps extends {}, ContentProps extends {}, FooterProps extends {}>({ Header, Content, Footer }: {
	Header: ComponentType<HeaderProps & DataGridRenderingCommonProps>,
	Content: ComponentType<ContentProps & DataGridRenderingCommonProps>,
	Footer: ComponentType<FooterProps & DataGridRenderingCommonProps>,
}) => memo<HeaderProps & ContentProps & FooterProps & DataGridRenderingCommonProps>(props => {
	return (
		<Stack className={`${(useClassName('data-grid-body'))}-body`}>
			<Header {...props} />
			<Content {...props} />
			<Footer {...props} />
		</Stack>
	)
})


export type DataGridContainerProps = typeof DataGridContainer extends ComponentType<infer P> ? P : never
export type DataGridContainerPublicProps = Omit<DataGridContainerProps, keyof DataGridRenderingCommonProps>

export const DataGridContainer = createDataGridContainer({
	Header: DataGridHeader,
	Content: DataGridContent,
	Footer: DataGridFooter,
})
