import * as React from 'react'
import { StageSlugContext } from './StageSlugContext'

export const useStageSlug = () => React.useContext(StageSlugContext)
