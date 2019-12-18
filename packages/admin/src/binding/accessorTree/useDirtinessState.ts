import * as React from 'react'
import { DirtinessContext } from './DirtinessContext'

export const useDirtinessState = () => React.useContext(DirtinessContext)
