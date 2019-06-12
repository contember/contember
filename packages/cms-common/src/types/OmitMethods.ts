export type OmitMethods<Obj, Methods> = Pick<Obj, Exclude<keyof Obj, Methods>>
