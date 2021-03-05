import { useContext } from 'react'
import { DirtinessContext } from './DirtinessContext'

export const useDirtinessState = () => useContext(DirtinessContext)
