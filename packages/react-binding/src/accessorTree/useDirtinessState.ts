import { useContext } from 'react'
import { DirtinessContext } from './DirtinessContext.js'

export const useDirtinessState = () => useContext(DirtinessContext)
