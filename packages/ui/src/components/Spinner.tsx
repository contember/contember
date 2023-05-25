import { useClassName } from '@contember/utilities'
import { memo } from 'react'

/**
 * @group UI
 */
export const Spinner = memo(() => <div className={useClassName('spinner')} />)
Spinner.displayName = 'Spinner'
