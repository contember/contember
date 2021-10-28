import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { LayoutChrome, LayoutChromeProps } from './LayoutChrome'

export interface LayoutProps extends LayoutChromeProps {
  className?: string
}

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
}: LayoutProps) => {
	const prefix = useClassNamePrefix()
  const classList = classNames(
    `${prefix}layout`,
    className,
  )

  return (
    <div className={classList}>
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
      >
        {children}
      </LayoutChrome>
    </div>
  )
})
