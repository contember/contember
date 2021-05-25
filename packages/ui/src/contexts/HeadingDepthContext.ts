import { createContext } from 'react'
import type { HeadingDepth } from '../types'

export const HeadingDepthContext = createContext<HeadingDepth>(1)
