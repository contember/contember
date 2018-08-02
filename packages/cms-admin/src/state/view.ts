export default interface ViewState
{
  loading: boolean,
  name: string | null
  id: string | null
}

export const emptyViewState: ViewState = {
  loading: false,
  name: null,
  id: null,
}
