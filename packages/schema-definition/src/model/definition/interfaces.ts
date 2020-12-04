import { Interface } from './types'
import OneHasManyDefinitionX from './OneHasManyDefinition'
import OneHasOneDefinitionX from './OneHasOneDefinition'
import ManyHasOneDefinitionX from './ManyHasOneDefinition'
import ManyHasManyDefinitionX from './ManyHasManyDefinition'
import ManyHasManyInverseDefinitionX from './ManyHasManyInverseDefinition'
import OneHasOneInverseDefinitionX from './OneHasOneInverseDefinition'

export type OneHasManyDefinition = Interface<OneHasManyDefinitionX>
export type OneHasOneDefinition = Interface<OneHasOneDefinitionX>
export type ManyHasOneDefinition = Interface<ManyHasOneDefinitionX>
export type ManyHasManyDefinition = Interface<ManyHasManyDefinitionX>
export type ManyHasManyInverseDefinition = Interface<ManyHasManyInverseDefinitionX>
export type OneHasOneInverseDefinition = Interface<OneHasOneInverseDefinitionX>

/** @deprecated use ManyHasManyInverseDefinition */
export type ManyHasManyInversedDefinition = Interface<ManyHasManyInverseDefinitionX>
/** @deprecated use OneHasOneInverseDefinition */
export type OneHasOneInversedDefinition = Interface<OneHasOneInverseDefinitionX>
