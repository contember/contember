import { Input, Model } from "cms-common"

export const isUniqueWhere = (entity: Model.Entity, where: Input.UniqueWhere): boolean => {
  if (where[entity.primary] !== undefined) {
    return true
  }
  for (const unique of entity.unique.map(it => it.fields)) {
    if ((() => {
      for (const field of unique) {
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
