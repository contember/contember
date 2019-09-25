import EntityBuilder from './EntityBuilder'

export type EntityConfigurator = (entityBuilder: EntityBuilder) => EntityBuilder
export type AddEntityCallback = (name: string, configurator: EntityConfigurator) => void
