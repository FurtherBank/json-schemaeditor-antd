import { test, expect } from '@playwright/test'

test('string', async ({ page }) => {
  await page.goto('http://localhost:8000/#/~demos/cpu-json-editor-app')
  await page.getByRole('textbox').click()
  await page.getByRole('textbox').fill('')
  await page.getByRole('textbox').press('CapsLock')
  await page.getByRole('textbox').fill('I')
  await page.getByRole('textbox').press('CapsLock')
  await page.getByRole('textbox').fill("I'm the most handsome!")
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('button', { name: 'undo' }).click()

  // 这里必须加 await，不然因为 promise 竟时问题会导致最后的测试不过
  await expect(page.getByRole('textbox')).toHaveValue('A basic string')

  await page.getByRole('button', { name: 'redo' }).click()

  await expect(page.getByRole('textbox')).toHaveValue("I'm the most handsome!")
})

test('string[]', async ({ page }) => {
  await page.goto('http://localhost:8000/#/~demos/cpu-json-editor-app')
  await page.getByRole('button', { name: '加载示例' }).click()
  await page.getByRole('dialog', { name: '选择示例' }).getByText('string').click()
  await page.getByText('string[]').click()
  await page.getByRole('button', { name: '选 择' }).click()
  await page.locator('[id="\\30 "]').getByRole('textbox').click()
  await page.locator('[id="\\30 "]').getByRole('textbox').click()
  await page.locator('[id="\\30 "]').getByRole('textbox').press('Control+a')
  await page.locator('[id="\\30 "]').getByRole('textbox').fill('您好，我是这个世界上最帅的帅哥！不容反驳！')
  await page.locator('[id="\\30 "]').getByRole('textbox').press('Enter')
  await page.locator('[id="\\31 "]').getByRole('button', { name: 'arrow-down' }).click()

  await expect(page.locator('[id="\\32 "]').getByRole('textbox')).toHaveValue(
    '我的工作是通过人工智能技术帮助人们回答问题。'
  )

  await page.locator('[id="\\30 "]').getByRole('button', { name: 'arrow-down' }).click()

  await expect(page.locator('[id="\\31 "]').getByRole('textbox')).toHaveValue(
    '您好，我是这个世界上最帅的帅哥！不容反驳！'
  )

  await page.locator('[id="\\31 "]').getByRole('button', { name: 'delete' }).click()

  await expect(page.locator('[id="\\32 "]').getByRole('textbox')).toHaveValue(
    '我是由 OpenAI 训练而来，并且我的知识涵盖了截止到 2021 年的信息。'
  )
})
