import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { LayoutChrome, LayoutChromeProps } from './LayoutChrome'

interface LayoutProps extends LayoutChromeProps {
  className?: string
}

export const Layout = memo(({
  className,
  children,
  sidebarHeader,
  sidebarFooter,
  switchers,
  navigation,
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
      >
        {children}
      </LayoutChrome>
    </div>
  )
})
