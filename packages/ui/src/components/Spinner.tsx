import * as React from 'react'
import { useComponentClassName } from '../auxiliary'

export const Spinner = React.memo(() => <div className={useComponentClassName('spinner')} />)
Spinner.displayName = 'Spinner'
