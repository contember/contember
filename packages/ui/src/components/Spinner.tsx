import { memo } from 'react'
import { useComponentClassName } from '../auxiliary'

export const Spinner = memo(() => <div className={useComponentClassName('spinner')} />)
Spinner.displayName = 'Spinner'
