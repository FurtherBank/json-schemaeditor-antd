import { IFieldEditProps } from './types'

interface ValueTypeMapper {
  [k: string]: any
  string: string
  boolean: boolean
  number: number
  array: any[]
  null: null
}

export const getValueCom = <T extends string>(valueType: T, props: IFieldEditProps<ValueTypeMapper[T]>) => {
  switch (valueType) {
    case 'const':
      // const equalConst = _.isEqual(data, space.get('const'));
      return (
        <Space style={{ flex: 1 }}>
          <Input key="const" size="small" value={toConstName(data)} disabled allowClear={false} />
        </Space>
      )
    case 'enum':
      const enumIndex = exactIndexOf(space.get('enum'), data)
      return (
        <Input.Group compact style={{ display: 'flex', flex: 1 }}>
          <Select
            key="enum"
            size="small"
            options={space.get('enum').map((value: any, i: number) => {
              return {
                value: i,
                label: toConstName(value)
              }
            })}
            className="resolve-flex"
            style={{ flex: 1 }}
            onChange={(value) => {
              doAction('change', route, field, space.get('enum')[value])
            }}
            value={enumIndex === -1 ? '' : enumIndex}
            allowClear={false}
          />
        </Input.Group>
      )
    case 'string':
      return getStringFormatCom(format)
    case 'number':
      return (
        <CInputNumber
          size="small"
          key="value"
          value={data}
          validate
          onValueChange={valueChangeAction}
          onPressEnter={(e: any) => {
            e.target.blur()
          }}
          style={{ flex: 1 }}
        />
      )
    case 'boolean':
      return (
        <Switch
          checkedChildren="true"
          unCheckedChildren="false"
          checked={data}
          onChange={valueChangeAction}
          size="small"
        />
      )
    case 'null':
      return <span>null</span>
    default:
      return null
  }
}
