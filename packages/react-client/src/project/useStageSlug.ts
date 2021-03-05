import { useContext } from 'react'
import { StageSlugContext } from './StageSlugContext'

export const useStageSlug = () => useContext(StageSlugContext)
