import { useClassName } from '@contember/utilities'
import { memo } from 'react'
import { LayoutChrome, LayoutChromeProps } from './LayoutChrome'

export interface LayoutProps extends LayoutChromeProps {
	className?: string
}

/**
 * The `Layout` component is a component that builds main layout of the admin.
 *
 * @example
 * ```
 * <Layout
 *   sidebarHeader="Project name"
 *   navigation={
 *     <Menu>
 *       <Menu.Item title="Articles" to="articleList"/>
 *     </Menu>
 *   }
 * />
 * ```
 *
 * @group Layout UI
 */
export const Layout = memo(({
	className,
	children,
	sidebarHeader,
	sidebarFooter,
	switchers,
	navigation,
	scheme,
	theme,
	themeContent,
	themeControls,
	pageScheme,
	pageTheme,
	pageThemeContent,
	pageThemeControls,
	titleScheme,
	titleTheme,
	titleThemeContent,
	titleThemeControls,
}: LayoutProps) => {
	return (
		<div className={useClassName(['layout', 'legacy-layout'], className)}>
			<LayoutChrome
				sidebarHeader={sidebarHeader}
				sidebarFooter={sidebarFooter}
				navigation={navigation}
				switchers={switchers}
				scheme={scheme}
				theme={theme}
				themeContent={themeContent}
				themeControls={themeControls}
				pageScheme={pageScheme}
				pageTheme={pageTheme}
				pageThemeContent={pageThemeContent}
				pageThemeControls={pageThemeControls}
				titleScheme={titleScheme}
				titleTheme={titleTheme}
				titleThemeContent={titleThemeContent}
				titleThemeControls={titleThemeControls}
			>
				{children}
			</LayoutChrome>
		</div>
	)
})
