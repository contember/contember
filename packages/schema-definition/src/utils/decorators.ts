export type EntityConstructor<T = any> = { new(): T }
export type DecoratorFunction<T> = (cls: EntityConstructor<T>, context?: ClassDecoratorContext) => void
