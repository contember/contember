import * as React from 'react'
import { ProjectSlugContext } from './ProjectSlugContext'

export const useProjectSlug = () => React.useContext(ProjectSlugContext)
