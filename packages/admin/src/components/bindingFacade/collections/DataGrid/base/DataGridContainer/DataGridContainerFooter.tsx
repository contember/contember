import { Button, LayoutPageStickyContainer, Stack } from '@contember/ui'
import { memo, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridDictionary } from '../dataGridDictionary'
import type { DataGridContainerProps } from './Types'

interface DataGridContainerFooterProps
  extends Pick<
    DataGridContainerProps,
    | 'desiredState'
    | 'updatePaging'
  > {
    pagesCount?: number
    pagingSummary: ReactNode
  }

export const DataGridContainerFooter = memo<DataGridContainerFooterProps>(({
  desiredState,
  pagesCount,
  pagingSummary,
  updatePaging,
}) => {
  const { paging: { pageIndex, itemsPerPage } } = desiredState

  const formatMessage = useMessageFormatter(dataGridDictionary)

  return (
    <LayoutPageStickyContainer
      left="var(--cui-layout-page-padding-left)"
      right="var(--cui-layout-page-padding-right)"
    >
      <Stack wrap align="center" direction="horizontal" justify="space-between">
        <Stack direction="horizontal" justify="space-between" gap="small">
          <Button
            distinction="seamless"
            disabled={pageIndex === 0}
            onClick={() => updatePaging({ type: 'goToFirstPage' })}
          >
            {formatMessage('dataGrid.paging.first')}
          </Button>
          <Button disabled={pageIndex === 0} onClick={() => updatePaging({ type: 'goToPreviousPage' })}>
            {formatMessage('dataGrid.paging.previous')}
          </Button>
          {itemsPerPage !== null && (
            <>
              <Button
                disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
                onClick={() => updatePaging({ type: 'goToNextPage' })}
              >
                {formatMessage('dataGrid.paging.next')}
              </Button>
              <Button
                distinction="seamless"
                disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
                onClick={() =>
                  pagesCount !== undefined && updatePaging({ type: 'goToPage', newPageIndex: pagesCount - 1 })
                }
              >
                {formatMessage('dataGrid.paging.last')}
              </Button>
            </>
          )}
        </Stack>
        <div>{pagingSummary}</div>
      </Stack>
    </LayoutPageStickyContainer>
  )
})
