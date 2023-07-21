export const Button = ({
  onClick,
  children,
}: {
  children?: string,
  onClick: () => void,
 }) => {
  return <button
    onClick={() => {
      onClick()
    }}
    style={{ backgroundColor: 'var(--cui-control-background-color)', border: '1px solid', borderRadius: '0.25em', color: 'rgb(var(--cui-rgb-text-0))', padding: '0.25em 0.33em' }}
  >
    {children}
  </button>
}
