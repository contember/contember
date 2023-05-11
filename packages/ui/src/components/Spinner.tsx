import { memo } from 'react'
import { useComponentClassName } from '../auxiliary'

/**
 * @group UI
 */
export const Spinner = memo(() => <div className={useComponentClassName('spinner')} />)
Spinner.displayName = 'Spinner'
