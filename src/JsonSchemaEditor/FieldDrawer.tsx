import React, { useImperativeHandle, useState } from 'react'
import { Drawer } from 'antd'
import Field from './Field'

interface DrawerAccess {
  route: string[] | undefined
  field: string | undefined
}

const FieldDrawerBase = (props: any, ref: React.Ref<unknown> | undefined) => {
  const [access, setAccess] = useState({
    route: undefined,
    field: undefined
  } as DrawerAccess)
  const [visible, setVisible] = useState(false)
  useImperativeHandle(ref, () => ({
    setDrawer: (route: string[] | undefined, field: string | undefined, isVisible = true) => {
      setVisible(isVisible)
      setAccess({
        route,
        field
      })
    }
  }))

  const { route, field } = access

  const onClose = () => {
    setVisible(false)
  }

  return (
    <Drawer title="详细" width={500} onClose={onClose} visible={visible} extra="在此做出的修改均会自动保存">
      {route !== undefined ? <Field route={route} field={field} canNotRename /> : null}
    </Drawer>
  )
}

const FieldDrawer = React.forwardRef(FieldDrawerBase)

export default FieldDrawer
