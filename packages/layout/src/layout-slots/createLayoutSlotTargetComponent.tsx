import { LayoutSlotTarget, LayoutSlotTargetProps } from './LayoutSlotTarget'

export function createLayoutSlotTargetComponent(name: string, displayName?: string) {
  const Slot = ({ className, ...props }: Omit<LayoutSlotTargetProps, 'name'>) => {
    return (
      <LayoutSlotTarget name={name} className={[`${name}-slot`, className]} {...props} />
    )
  }

  Slot.displayName = displayName ?? `LayoutSlotTarget(${name})`

  return Slot
}
