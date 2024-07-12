import { useContext } from 'react'
import { ProjectSlugContext } from './ProjectSlugContext'

export const useProjectSlug = () => useContext(ProjectSlugContext)
