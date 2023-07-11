import { useClassName } from '@contember/react-utils'
import { memo } from 'react'

/**
 * @group UI
 */
export const Spinner = memo(() => <div className={useClassName('spinner')} />)
Spinner.displayName = 'Spinner'
