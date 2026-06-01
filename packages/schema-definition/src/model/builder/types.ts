import EntityBuilder from './EntityBuilder.js'

export type EntityConfigurator = (entityBuilder: EntityBuilder) => EntityBuilder
export type AddEntityCallback = (name: string, configurator: EntityConfigurator) => void
