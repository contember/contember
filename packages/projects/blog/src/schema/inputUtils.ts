import { Entity } from "./model";
import { UniqueWhere } from "./input";

export const isUniqueWhere = (entity: Entity, where: UniqueWhere): boolean => {
  if (where[entity.primary] !== undefined) {
    return true
  }
  for (let unique of (entity.unique || []).map(it => it.fields)) {
    if ((() => {
      for (let field of unique) {
        if (where[field] == undefined) {
          return false
        }
      }
      return true
    })()) {
      return true
    }
  }
  return false
}
