import { act } from '@testing-library/react'
import { UserEvent } from '@testing-library/user-event/dist/types/setup/setup'
import { sleep } from '../sleep'

/**
 * 未编写完成的操作 baseSelect 组件的方法
 * @param user
 * @param dom
 */
export const changeBaseSelect = async (user: UserEvent, dom: Element, targetValue: string) => {
  await act(async () => {
    // 切换为 string
    const messTypeSelector = dom.querySelector('.ant-select-selector')! as HTMLElement

    await user.click(messTypeSelector)
  })

  // 由于点击呼出 list 时，会短暂的不可点击，所以等待一段时间
  await sleep(2000)

  await act(async () => {
    const userEventNoneNode = document.querySelector('.ant-select-dropdown')! as HTMLElement
    userEventNoneNode.style.pointerEvents = 'auto'
    const stringItemContainer = document.querySelector(
      `.ant-select-item-option[title="${targetValue}"]`
    )! as HTMLElement

    await user.click(stringItemContainer)
  })
}
