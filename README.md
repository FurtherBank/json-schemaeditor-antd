# json-schemaeditor-antd

[![NPM version][npm-image]][npm-url] [![Package quality][quality-image]][quality-url] [![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/json-schemaeditor-antd.svg?logo=npm
[npm-url]: https://npmjs.org/package/json-schemaeditor-antd
[quality-image]: https://packagequality.com/shield/json-schemaeditor-antd.svg
[quality-url]: https://packagequality.com/#?package=json-schemaeditor-antd
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/json-schemaeditor-antd.svg?logo=npm
[download-url]: https://npmjs.org/package/json-schemaeditor-antd

该项目是一个基于 antd 搭建的可使用 JSON Schema 约束的 JSON 编辑器。主要面向 json 编辑，对 JSON Schema 的各类特性支持友好，对各种特性组合的情况考虑深入，支持很多特性组合用法。相对其它一些同类产品，支持 oneOf/anyOf 嵌套且组合 $ref、编辑元模式等特性功能。

## 预览和文档

[github pages](https://furtherbank.github.io/json-schemaeditor-antd)

[gitee pages](https://furtherbank.gitee.io/json-schemaeditor-antd)

## 使用方法/功能介绍

老规矩，首先 `npm install`：

```bash
npm install json-schemaeditor-antd
```

[![json-schemaeditor-antd](https://nodei.co/npm/json-schemaeditor-antd.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/json-schemaeditor-antd/)

然后在你的 jsx 中引入即可：

```jsx
const JsonSchemaEditor, { metaSchema } = 'json-schemaeditor-antd'

// metaSchema 是元模式，如果不需要使用元模式编辑 Json Schema，可以不引入

<JsonSchemaEditor data={data} schema={schema}
  onChange={(jsonData) => {
    console.log(jsonData)
  }}
/>
```

组件就三个属性：data，schema，onChange: (value: any) => void

按照受控用法使用即可。如果你需要使用 umd 格式的包，可以引入 `json-schemaeditor-antd/dist`

> 注意：
>
> 1. 注意提前安装好 `peerDependencies`。具体可以直接查看项目中的 package.json
> 2. 使用时如果 schema ts 报错，在后面加 as any 就 🆗 了。schema 的正确性可以自己先确认好。该项目使用 ajv 来做 schema 的验证和检验。如果 schema 有问题你可以看到报错窗口，且会以无 schema 的方式来展示 editor。
>
>    初次排查了一下，找到了一些原因：
>
>    - 对 `type`字段的值的类型 `JSONSchema6TypeName`是 JSON Schema 允许的类型值字符串的枚举。一般导入的 json 会把其 `type`字段判定为 `string`类型，而非枚举值(虽然 json 里面确实是符合)而报错
>
> 3. 状态的修改满足 [immutable 约定](https://www.yuque.com/furtherbank/frontend/react#slACC)

本人前端小白一枚，这还是第一次打包上传 npm，实际使用时可能会有很多问题。

如果发现了该项目的 bug，或者有什么建议、发现项目的设计缺陷等等，欢迎大家随时提 issue！本菜鸟会想办法尽快解决的

### Editor 组件的 ref

Editor 组件将编辑器全局上下文 ctx 暴露在了`useImperativeHandle`中。

可通过`ctx.store`获取存储状态的 redux store；

可通过`ctx.executeAction(type, params)`执行动作修改数据；

ctx 相关的函数与参数可以从`src/JsonSchemaEditor/context/index.ts`中查阅。

关于可用动作的更多信息，详见 [Reducer](#Reducer)

### id of all the fields

每个字段的组件，都有一个 id 属性与之对应，可以通过 id 属性得到该字段组件的 root dom。如 `rootdata.user.abc[1]`，对应的 id 为 `user.abc.1`。

注意：

1. 根节点的 id 由传入 editor 的 id 属性决定，且不应用前缀
2. 目前 id 和 schemaEntry 都没做转义处理。请不要向属性名中加入 `.`或 `/`字符，会出错。
3. 可以通过`options.idPerfix`指定组件的 id 前缀。前缀会直接拼接到 id 字符串前，没有分隔符。(暂未实装)
4. 有些字段组件可能没有渲染到屏幕上或者隐藏了，有通过 id 拿组件 dom 而拿不到的可能。

### options (暂未实装)

> In most cases, you don't need to configure anything.

idPerfix, defaultValueFunction,

#### schemaDefault

> This field is used to specify the default value for the function field defined by the editor. You can also specify them in specific schema field to override the default values set.

displaydesc, notinautofill

##### draggable

> Whether an array item can be dragged. Even if set to true, drag-and-drop is limited by the items field in the schema.

type: boolean

default: true

#### ui

denseGrid,

## JSON Schema 简单说明

json-schema 是一种可递归的文法模式，来描述一个 json 文件应该满足哪些性质。该项目目前统一使用 [draft6](http://json-schema.org/specification-links.html#draft-6) 规范版本。

[JSON Schema 入门 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/355175938)

下面简要叙述 json-schema 规范定义与该编辑器使用的不同之处：

- 校验提示功能完全基于 ajv 实现
- 此外，该编辑器中定义了一些新的 json schema 关键词，用于对编辑器 ui 进行更进一步的个性化设置。这些新定义的关键词不会对 json 数据的校验产生影响。具体有哪些关键词，以及这些关键词对于 ui 表现的影响，您可以在下面对关键词的定义中找到。

### 关键字说明

#### 根

| 关键字    | 作用                                                          | 值类型 | 备注              |
| --------- | ------------------------------------------------------------- | ------ | ----------------- |
| `$schema` | 采用的 jsonschema 草稿                                        | url    | 该项目使用 draft6 |
| `$id`     | 作为该 schema 的 uri 地址`<br>`(不过实际使用时一般不写该字段) | string |                   |

#### 通用模式

这个就是 schema 类型的 schema 定义。

| 关键字 | 作用 | 值类型 | 备注 |
| --- | --- | --- | --- |
| `title`,`description` | 变量展示的名称(如果该变量为一个 object 的字段，会覆盖其属性名)和介绍<br />对于 title 属性在编辑器中显示的实际影响，请参阅 | string |  |
| `type` | 变量的类型。(number, integer, null, array, object, boolean, string) | string |  |
| `enum` | 限定变量值为枚举值之一。可以使用枚举模式表示<br />枚举的展示模式：下拉框，单选框 | \<type\>[] |  |
| [`const`](https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.1.3) | 唯一可能性变量 | \<type> |  |
| `$ref` | 对其它 schema 的引用。<br />此处额外定义的信息会覆盖引用 | uri->schema |  |
| `oneOf`/`anyOf` | 变量满足的模式必须只满足/至少满足其中之一<br />在项目中涉及到了对满足的模式进行选择的问题。 | schema[] |  |
| `default` | 变量的默认值。生成时使用 | \<type\> | 额外特性 |

另注：如果 schema 为布尔值，则直接对应判定的变量是否有效。`true`或者 `{}`，任何值都有效。`false`或者 `{"not": {}}`任何值都无效

#### 布尔/null

null 是不需要显示的。

#### 数字/整数

| 关键字 | 作用 | 值类型 | 备注 |
| --- | --- | --- | --- |
| `mininum`,`maxinum`<br />`exclusiveMinimum`<br />`exclusiveMaximum` | 数字最小值/最大值<br />`exclusive`为不包括该值的 | number |  |
| `multipleOf` | 整数专用，可以被其整除 | int |  |

#### 字符串

https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.3

| 关键字                  | 作用           | 值类型 | 备注 |
| ----------------------- | -------------- | ------ | ---- |
| `minLength`,`maxLength` | 最小/最大长度  | int    |      |
| `pattern`               | 符合的正则     | regex  |      |
| `format`                | 格式，就是正则 | string |      |

#### 数组

`type`为 `"array"`

https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.4

| 关键字 | 作用 | 值类型 | 备注 |
| --- | --- | --- | --- |
| `items` | 如果是 schema，认为数组每一个元素均符合此模式<br />如果是 schema[]，认为数组从开头到结尾一个个符合对应 index 的模式<br />从 `prefixItems`匹配结束后的索引开始匹配 | schema\|schema[] | 2020-12 变成了 additional 功能，使用[`prefixItems`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.1.1)替代 |
| `additionalItems` | `items`设置为数组时，对于数组，仅当项设置为数组时。如果是模式，则该模式在 items 数组指定的项之后验证项。如果为 false，则其他项将导致验证失败。 | schema |  |
| `minItems`,`maxItems` | 长度最小/最大 | int |  |
| [`contains`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.1.3) | 数组中必须有元素符合该模式。从开始识别，不受前面的关键词影响<br />该关键词只涉及验证。创建另说 | schema |  |
| `minContains`,`maxContains` | 限制符合 `contains`模式元素的个数。 | int | 6 没有 |

数组短优化：

如果数组 items 的所有可能只有 string/number/boolean/null 其中之一，且 string 不使用长模式，则数组会使用列表短模式，缩小显示空间进行优化。

#### 对象

[draft 2020-12](https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.5) [draft 6](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-01#section-6.15)

| 关键字 | 作用 | 值类型 | 备注 |
| --- | --- | --- | --- |
| [`properties`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.1) | 可以出现的属性字段和字段变量的信息。以 key-value 形式表示<br />其它属性再通过 `patternProperties`和 `additionalProperties`验证，不通过则失败 | object<string, schema> |  |
| [`patternProperties`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.2) | 认为满足**正则表达式属性名**的字段，满足 value 的模式 | object<regex, schema> |  |
| [`additionalProperties`](https://json-schema.org/draft/2020-12/json-schema-core.html#additionalProperties) | 只对 `properties`和 `patternProperties`未验证的属性字段进行验证，<br />验证这些字段（注：这些字段不关注字段名。）是否符合值的模式<br />比如，这个属性为 false 就是不允许其它属性(不设置为 true) | schema |  |
| [`propertyNames`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.4) | 对象所有**属性名**必须满足该模式<br />注意属性名一定是字符串 | schema |  |
| `required` | 对象必须要具有的字段列表。<br />默认按照 | string[] |  |
| `minProperties`,`maxProperties` | 限制属性字段数量 | int |  |
| [`dependencies`](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-01#section-6.21) | 表明特定属性存在时才可以存在键属性。<br />如果值为 `string[]`，数组中属性名对应属性都存在，键属性才可以存在。<br />如果值为 `Schema`，整个数据需要满足这个 `Schema`，键属性才可以存在。 | object<string,string[]>\|object<string, Schema> | 暂未实装 |

schema 定义一个嵌套的 object，读取属性时是 `root.layer1.layer2`；但是读取对应 schema 时是 `root.properties.layer1.properties.layer2`。每一层属性多读一层 `properties`。

在设计中，默认是仅具备 `required`的属性，然后选择框中包括 `properties`的其它属性。可以再加属性。 `dependencies`不对属性选择进行特殊设置，只是不可用的属性禁止勾选。

验证并不冲突。

关于 ui 嵌入 schema 里面，这样就可以保持一致。但是考虑到别的用 uischema，所以我认为，uischema 不能和 schema 扯上联系。uischema 应该改成 uioptions 配置。

### JSON Schema 各版本介绍及区别

可以从 [Specification | JSON Schema (json-schema.org)](http://json-schema.org/specification.html) 查看目前广泛应用的 JSON Schema 版本的说明。所有的版本可以通过这个链接查询 [Specification Links | JSON Schema (json-schema.org)](http://json-schema.org/specification-links.html)

按照规范所说，目前得到广泛应用的有这些版本：

- 2020-12
- 2019-09
- draft-07
- draft-06
- draft-04

其中，这里给出了兼容性表格：

| 版本 | 与上一个版本兼容 | 迁移链接 | 备注 |
| --- | --- | --- | --- |
| draft-04 | / |  |  |
| draft-06 | 否 | [JSON Schema Draft-06 Release Notes (json-schema.org)](http://json-schema.org/draft-06/json-schema-release-notes.html) |  |
| draft-07 | 是 | [JSON Schema Draft-07 Release Notes (json-schema.org)](http://json-schema.org/draft-07/json-schema-release-notes.html) |  |
| 2019-09 | 否 | [JSON Schema 2019-09 Release Notes (json-schema.org)](http://json-schema.org/draft/2019-09/release-notes.html) |  |
| 2020-12 | 否 | [JSON Schema 2020-12 Release Notes (json-schema.org)](http://json-schema.org/draft/2020-12/release-notes.html) |  |

该应用默认支持 draft 6 和 draft 7 作为使用的 schema。对于低版本的 schema，如 draft 4，需要通过一些工具(如 [ajv-cli](https://github.com/ajv-validator/ajv-cli#migrate-schemas))转译到高版本 schema 才能使用。

在 demo 中 $schema.eslint.json 就是一个迁移后转为 draft 7 的 schema

不过该编辑器不提供自动转到高等级 schema 的方式(如果以后真的非常需要会转)。

## 设计概念定义

### 模式假设

编辑器应用 schema 对 ui 进行个性化的配置，但是要使得这个过程能够按照预期正常工作，需要 schema 满足以下假设：

1. 编辑的过程中，模式是不变的
2. `required`的属性都具备在 `properties`中
3. 设置了 `type`属性后，才会给对应属性类型约束
4. `oneOf`、`anyOf`、`enum`、`const`不同时存在
5. 如果存在 `oneOf`或 `anyOf`，其选项相连不出现循环引用，而且之外不存在验证属性如果出现了层叠的 `oneOf`和 `anyOf`，不会出现重复引用项
6. `properties`和 `patternProperties`不能匹配到同一名称
7. 如果是多模式验证，满足**替换假设**。否则某些特性会无法正常工作。详见 [采用多 schema](#采用多schema)

### 短字段

> `object`和 `array`下属的字段中，可能很多字段的组件只需要占用很少的空间。如果可以通过 `schema`识别这些字段，并将这些字段使用网格布局展示，可以大大提高空间利用率。这些字段被称之为**短字段**。下面是具体的判别标准：

字段的 schema 需要满足以下前提，才有可能成为短字段：

- `type`只有一种可能性
- 没有 `oneOf`/`anyOf`选项

满足前提的字段，是否为短字段，依次按照以下规则判断：

1. 格式为短格式的 `string`，为**短字段**(优先级最高)
2. 如果该字段具有 `view`关键词(使用了自定义 `view`)，取决于 `view`定义的 `shortable`属性
3. 使用默认组件展示，如果该字段的 `type`是 `integer/number`或者 `boolean/null`；或者具有 `enum`/`const` ，该字段是**短字段**。

短字段在对象和数组中可通过网格状密集展示，比长字段需要更小的展示空间，提高屏幕的利用效率。

短字段的操作空间放入了字段右侧的按钮中，点击按钮可以选择并作出相应操作。

可以证明，所有嵌套格式的非 `enum`/`const`/自定义 `view`选项都是**长字段**。

可以在 [模式限制的特性索引](#模式限制的特性索引) 中查看某些字段设置和长短字段展示两者联系的具体说明。

另外需要注意，自定义 `view`组件，

### 操作空间(即 可执行的操作)

实际上这里不把所有操作都列出来，有些不需要列。又一些非通用的操作，比如 [创建](#创建) [重命名](#重命名) ，后面有说明，自行看链接。

#### 复制粘贴(待实装)

列表模式下可以复制多个项（复制成数组），并将项依次插入列表中。

粘贴时会进行**浅验证**

#### 撤销恢复

真的就是一个简单的撤销和恢复操作啊。但是，做这个真的是对 react 和 redux 给了解透彻了才可以！

### 浅验证

通过模式对数据进行简单粗浅的验证，相对整个的模式验证更省时。具体说明如下：

1. 如果模式具有 const 或者 enum 定义，返回这两个关键词的验证结果。
2. 如果模式定义了唯一的类型，且和数据类型相同，分为以下情况：
   - 如果数据是对象，对模式中 `required`内的字段值进行浅验证。
   - 如果数据是数组，对数组每项字段值进行浅验证。
   - 在对象或数组中，对其内字段进行浅验证时，如果这些字段的类型是对象或数组，只判断类型是否正确，不再继续递归对内部字段进行浅验证。
   - 如果数据是字符串且有格式属性，会匹配格式是否正确
   - 其它类型只要相同就返回 `true`
3. 模式没有明确的类型定义，返回 `true`

注意，浅验证不会对具备 oneOf/anyOf 的字段进行验证，会直接返回 `true`。

### 组件接口

对于每一个字段，都最终存在一个 Field 组件与之对应。不过实际用于展示的组件，需要通过 Field 渲染确定。通过 `getEditComponent`函数确定通过怎样的组件渲染这一个字段。

实际渲染的组件可以通过 IField 接口进行如下的操作：

- 取得字段路径
- 取得字段 data
- 取得该字段的 mergedSchema

## 具体信息说明

### ajv 的配置相关

该编辑器目前采用 ajv 进行有效性验证，不过基于 ajv 默认配置之外，增加了以下设置：

- 通过 `ajv.addFormat()`添加了对一些格式的验证方法
- 增加了后续可能会出现的连接词(暂未实装)

### 模式的模式——元模式

本身描述 JSON Schema 的模式称为元模式。元模式用于验证 JSON 模式是否正确。

该项目中直接使用 draft6 元模式可以正常工作，不过为更方便编辑，项目对元模式内容进行了拓展，并以一些通用约定做了特殊限制。详见导出的 `metaSchema`

### 关注到多个 schema

在特定的情况下，一个值是否满足模式，需要通过多个 schema 进行验证。

具体情况有：

1. 使用了 `$ref`
2. 一个对象的属性同时匹配 `properties`和 `patternProperties`
3. `oneOf`, `anyOf`, `allOf`

在这里的设置是，一个模式入口引用了一个模式性质的映射 `Map<$ref, schemaInfo>`，放在编辑器上下文 `ctx`中。

#### 替换假设

在涉及到多个 schema 对象的时候，schema 的验证结果是所有涉及到的 schema 验证结果各自的**与**合并(实际上这么做不是很好的选择)。

对于从一个入口得到的 schema 有$ref 字段而涉及到多个 schema 对象的时候，我们假设，其表现与将牵扯到的 schema 进行合并没有区别。合并通过 object.assign 的方式，将\$ref 引用者的属性覆盖到被引用的属性值上。

如果你在使用 `$ref`的模式中，`$ref`引用者和被引用者都具有不同或者相同的验证属性时，结果才与满足替换假设的情况有差别。

一般情况下，除非你是故意的，就不会这么做。

对于 `$ref`引用得到模式的最佳实践是，`$ref`引用者不加入任何验证相关属性。最多就是加入 title,description 等描述性字段替换被引用者这些字段的值。

编辑器在 ui 支持方面对以上假设做了一个唯一的例外：`properties`和 `patternProperties`的属性是可以合并(而非被替换)的，在 `additionalProperties`为 `true`的情况下(想一想为何需要这个条件？)，可以将多个不同 schema 的相同属性，引一个 `$ref`单独放置，可以减少一些 schema 的代码量。

### 验证错误

如果数据验证错误，会在对应处出现一个 ❌，鼠标移到上面可以查看错误信息详情。

此外还可以对字段进行以下操作：

- `reset`重置：重置字段值为默认值
- `detail`详细：从右侧抽屉对话框中查看字段详细值。此时 ui 不应用对应 schema 的任何特性。注意：需要保证抽屉组件可见时只能通过抽屉组件编辑数据，否则可能会报错。

如果字段的类型错误，会使用字段 `data`的类型所对应的组件。

## 模式限制的特性索引

这一篇主要说明在不同的模式限制下，字段编辑器的一些表现，以及其会涉及到的特性。其中，很多特性的具体应用条件、参数可以在 `FieldOption`脚本文件中找到。如果想要对这些特性进行定制设计，可以在其中进行修改(后续会对一些选项开放 options 入参)。

如果不通过模式对数据进行任何限制，该编辑器只是一个普通的 json 编辑器。

### const/enum

`const`和 `enum`必然为短字段，无论其值类型如何(或者说有多大多长)。仅用一个单项选择来选择枚举选项，每个选项用其常量名称作为显示，具体内容通过菜单进入**详细**查看。

此外，如果 `enum`的选项数量大于 6，我们还会给予一个搜索框，可以搜索筛选可能的选项。(todo)

> 为什么设置 `const`和 `enum`必然为短字段？
>
> 一般使用 `enum`的字段，我们很多时候只是把 enum 的值当作所有可能选项中的一种可能性，具体值只需要和其它不同，而且语义化就可以。但是对于 `enum`字段可能涉及到的复杂的处理信息和逻辑，我们一般不会放入这里

#### 常量名称

一个数据作为 `const`或者 `enum`选项的值，由于只使用一个短组件显示，所以需要对应一个名称。称之为**常量名称** `constName`。

数组做为常量，名称为 `Array[{length}]`。对象名称为 `name.toString()`，此外为 `Object[keys.length]`

可以设置 `constName: string`或 `enumName: string[]`来替换默认的常量名称。（未实装）

注意将数据的**常量名称**、字段的**标题名称**和模式的**模式名称**区分开来。

### oneOf/anyOf

对于具备 oneOf/anyOf 的字段，会通过一个树选择组件，来处理数据实际满足的模式。可以正确处理 oneOf/anyOf 连续嵌套的情况，但必须要满足对应的 [模式假设](#模式假设)

注：allOf 仅做验证，在 ui 方面没有特殊支持。

#### 实际变量入口映射

对于具有 oneOf/anyOf 的模式字段，值满足的实际模式还需要通过选项来映射到实际的入口。所以在 `Field`中，对于字段的模式入口，有 `schemaEntry`和 `valueEntry`两个概念。

#### 模式名称

oneOf/anyOf 下的模式作为选项需要有一个名称，称为**模式名称**。

模式优先使用 `title`属性作为名称，其次匹配模式限定的数据类型作为名称。`

注意将数据的**常量名称**、字段的**标题名称**和模式的**模式名称**区分开来。

#### 选项判定细节

正常来说，判断一份数据属于 oneOf/anyOf 的哪一个选项时，就是将每一个选项的模式分别对数据进行验证，如果数据匹配一个模式，就认为该数据属于这个模式对应的选项。这样的判定方式相当于将 `anyOf`当作 `oneOf`进行使用。如果仅让 `anyOf`作验证，可以

但是这么做有两个非常明显的缺点：

1. 实现中需要一一展开模式，并且对每一个选项的数据都要进行验证，非常费时，对于一个不太大的数据，编译+验证时间甚至会达到秒的数量级 (一个一般大的模式，每个选项验证大概需要 20ms)
2. 如果数据并不满足任何模式，但是和某个模式非常相似，那么也无法提供模式对于编辑的确定性支持

因此，在这里使用了**浅验证**作为每个选项验证的方式。如果数据经浅验证有多个选项符合(尤其是 anyOf 的情况)，会认为数据是第一个符合的选项。

#### 选项切换时数据最大兼容

如果一些选项的类型都是对象，那么在这些选项中进行切换时，会对原有的一些属性进行保留。不过只会保留新模式中 `properties`和 `patternProperties`匹配的指定属性。其它属性(无论 `additionalProperties`是否允许这些属性的存在)都会被删除。

### allOf

> 目前只做验证，ui 支持已提上日程，暂未实现，静候佳音

目前对 allOf 会进行一些 ui 层面上的支持。

具有 allOf 的模式验证相当于所有 allOf 的模式项与 allOf 之外的关键词的满足情况的与，类似于给 schema 加了多个 ref。

具体支持的方法是，将 allOf 所有项的 schema 进行展开，然后按照选项顺序应用其它的 schema 性质，后面顺序的会覆盖掉前面顺序的。最后其它 schema 性质会合并到 allOf 展开的 schema 性质表。

allOf 可以支持嵌套+ref 引用，但是不允许递归，会查询一个 allOf 进行展开时引用的所有 schema 的 refs。

### 不确定类型

不确定类型会有一个选择组件来处理该字段的类型。实际上，在这里并不建议使用多类型的模式，且 ajv 的严格模式也不推荐显式定义字段为多类型。

如果有这样的需求，使用 `oneOf`关键字会更好。

### 单一类型

#### object

##### 短字段显示

一个 `object`对象会使用**两个列表**展示其所属的所有字段。

对象的所有短字段会在**第一个列表**统一展示，独立于其它的字段。属性的列表使用网格布局制作，在 `options`中可指定网格布局的 `dense`选项。(未实装)

##### 属性展示顺序(暂未实装)

会依据模式的 `order`作为关键字排序作为属性的展示顺序。

##### dependencies

dependencies 的值有两种可能类型，`string[]`和 `Schema`。前者是当数组项中各属性存在时，键属性才可以存在，后者是整个实例满足 `Schema`时才可以存在。

不过实际上，经过简单思考，dependencies 对于属性的可见性不应当产生影响。只是在属性创建和删除时对属性产生影响，包括：

1. 创建新属性时，如果具有 dependencies 的属性不符合 dependencies 存在条件，不能进行创建，且不会在自动提示中出现。注：对 `Schema`形式的依赖，只进行浅验证。
2. 删除某属性时，如果该属性在另一些属性中是 `string[]`形式的依赖，会额外删除这另一些属性注：该连带删除特性不对 `Schema`形式的依赖起作用。因为需要通过删除后二次计算再删除的方式实现。

##### 创建

会提前检查是否所有的可创建属性均已创建，如果是这种情况，你将无法看到创建属性按钮并进行属性创建操作。

创建一个属性时，会提示输入新属性的名称然后进行创建。通过 `propertyCache`，可以读取到所有在模式中定义的属性名，用于创建时输入的自动补全。

会通过模式定义检查输入的属性名是否可以新建，且会检查是否重复。

创建时，会通过属性对应的模式生成默认值。

##### 重命名

属性的重命名有一定的限制。

对于一个对象的属性，如果其属于 `properties`中，则不可命名。如果位于 `patternProperties`中，命名只能符合对应的正则式。此外可以自由命名。如果新的字段名符合上面两种情况，再次进行命名时，依照规则，新字段名的命名空间会受到上面规则的限制。

##### 标题名称

一个字段可能会有别名，该名称取决于对应模式的 `title`值。不过字段必须**不可重命名**时才会使用别名展示。

此外，数组项也可以使用别名展示。如果设置了标题名称，数组将不可使用 `extra`短模式展示。

`title`属性设置特殊的字符串，可以采用特殊的模式进行显示：(未实装)

- `$i`：替换成数组的 index
- `${propertyName}`：替换成对应属性的描述组件显示

##### 删除

在 `required`内的字段不可被删除。

#### array

##### 短字段显示

会通过 `prefixItems`和 `items`关键词对应的项，分为**两个列表**进行展示。

每一个列表是否采用短字段的方法展示，遵循以下规则：

1. 如果列表内所有的字段都是短字段，那么这个数组的每个项都会通过短字段展示。(允许短字段等级为 `short`)
2. 在此之上，如果所有字段均没有设置 `title`属性，短字段展示可以省去每项标题(索引)占用的空间，从而更密集的展示数据。 (称为 `extra`短模式，允许短字段等级为 `extra`)

##### 创建

会提前检查是否可以继续创建项，当不能创建时，你将无法看到创建按钮并进行创建操作。创建会自动依据新项目对应的模式生成默认值。

##### 根列表模式

如果根节点在模式中定义为数组，且实际类型也为数组，那么会以**两栏列表**的方式展示数据。其中左侧列表可以拖拽选中多个项目进行复制和粘贴操作。(暂未实装)

#### string

##### 字符串格式

https://ajv.js.org/packages/ajv-formats.html

> 注：目前有一些格式的专用编辑组件还未实装，不过验证是有效的

在字符串的 `format`中设置。除此之外，还增加了一些其它格式：

| 格式名 | 描述 | 格式类型 | 特殊组件 |
| --- | --- | --- | --- |
| uri |  | `longFormats` |  |
| uri-reference |  | `longFormats` |  |
| base-64 |  | `extraLongFormats` | 二进制编辑器（未实装） |
| color | 颜色。~~支持 rgb/rgba/cmyk 等多种颜色格式是否可能？~~ |  | 颜色选择框（未实装） |
| row | 单行加长输入，不做验证 | `longFormats` | input 加长版 |
| multiline | 多行输入，不做验证 | `extraLongFormats` |  |
| code:\<language> | 特定语言代码（未实装） | `extraLongFormats` | monaco-editor（未实装） |
| file:\<file-type> | 文件名（未实装） |  | 文件上传框（未实装）<br />特殊的文件会读取展示，如图片，但是未实装 |

string 的一些格式并不支持短优化，这时会作为一个长组件显示。长格式分为两种：**单行长格式** `longFormats`和**跨行长格式** `extraLongFormats`。

**单行长格式**的组件仍然在一行展示，但是长度增加。 **跨行长格式**的组件会另起一行显示，可以跨域多行。

> 目前格式的一个 issue：
>
> 格式的验证可以是一个函数或者正则表达式。说实话，格式除了它搞的之外，应该自己重定义。格式必须有一个验证函数和默认值。默认值为什么必须要？如果你一个字段有 `oneOf`，每个选项对应一种字符串格式。那你切换的时候，没有换过去格式的默认字符串值，你就无了。换成空字符串，你就不知道哪一项了。

#### number/integer/boolean/null

- 必然为短字段

## 自定义 view（仅设计）

在 schema 中可以通过 view 字段

```json
{
  "view": {
    "type": "your_view_type",
    "params": {
      "any": "any"
    }
  }
}
```

可以自定义 json-schemaeditor 的 view 组件并发布到 npm。这样，在使用 json-schemaeditor 时，可以通过配置文件 `json-schemaeidtor.json`（是用 json 引包还是 js require 引入？）使用自定义的 view 组件。

> 注：自定义 view 组件和字符串自定义格式组件不一样，前者不限于在字符串类型中使用。

### 自定义 view 组件

自定义 view 组件需要配置如下：

1. 数据有效条件该配置类型为 schema，表示怎样模式的数据可以使用该组件编辑。
2. 配置有效条件该配置类型为 schema，表示 view 字段的 params 应该是怎样的。
3. 组件信息包括组件类 type(这个字段是 view 的 type 的值) 组件短优化情况(short/long/extralong)

```json
{
  "type": "your_view_type"
}
```

然后再加上一些目录约定。。。

### 内置 view 组件

- 根列表(已实现，但未抽象成 view)
- 根目录
- 曲线
- 渐变
- 可视化图表
-

## Reducer

Editor 组件通过 `useImperativeHandle`将 store 给暴露了出来，可以拿到 store 然后直接 dispatch 动作进行修改。下面主要介绍动作：

```typescript
// 示例：在 gifts 下新建字段 1(数组push入第二个数组元素)，其值为 { "name": "gold", "number": 10 }
const action = {
  type: 'create',
  route: ['gifts'],
  field: '1',
  value: {
    name: 'gold',
    number: 10
  }
}
```

对于一个 `Field`组件，自己的访问是 `access`，自己父级是 `route`，子是 `access+sfield`

| 可能调用的动作            | 更新           | 说明                 |
| ------------------------- | -------------- | -------------------- |
| create(access+sfield)     | access,+sfield | 从 access 处新建属性 |
| change(route,field)       | field          | 改变自己的值         |
| delete(route, field)      | route          | 从父节点删除自己     |
| rename(route, field)      | route,field    | 改变自己的属性键     |
| moveup/down(route, field) | route, field   | 将自己上移/下移      |
| setdata(value)            |                | 直接更新             |
| undo/redo                 |                | 撤销/恢复            |

注意，向 `reducer`传入动作后，仅对动作是否可以在 json 层面上直接执行做一次验证，不会在 schema 层面上判断对应动作是否应当执行。如果向 `reducer`传入的动作不可执行，会通过控制台输出错误。

## 项目测试

目前项目的测试(单元测试、集成测试等)还相当不全，只能覆盖主流程不出错，测试覆盖率也仅达到了`70%`左右。

会尽快补全的 o(T ヘ To)。

## 其它问题

### 环境相关

在这次上传 npm 的大更新之后，使用 [dumi](https://d.umijs.org/zh-CN) 作为开发环境。

虽然 dumi 也有些坑，但还算是可靠的组件库开发方案了。

### antd

该项目并未将 antd 打包进入，使用你自己的 antd 依赖项。

> antd 可以通过 babel 简化按需引入，该项目使用了这个特性。  
> 但是不知为何(可能是打包配置的原因，不过没有仔细研究)，导入项目包不一起加载 antd 的 css 文件，必须要手动加载完整`antd.css`才能应用样式(如果是使用了 umi 等框架，框架会自动帮你加载)

同时，项目使用的 antd 主题取决于你使用的 antd 主题。开发时使用了紧凑主题。

测试项目是否可用时，在 umi 项目下该组件可正常导入并生效。

### 个人开发配置

> 记录一下个人开发环境的情况，出问题可以做一个参照

v0.1.4 之前：os: windows 11 nodejs v14.18.0 npm v6.14.15

v0.1.4：os: windows 11 nodejs v16.14.2 npm v8.5.0

## 尚未解决问题

- [ ] 部分样式需要好好优化
- [ ] 短优化项展示列数响应式增加(但是不能直接用 antd list 的响应式，它只看窗口宽度不看 dom 宽度)
- [ ] 无 default 默认值设置的不是太好
- [ ] 转义特殊字符属性名
- [ ] 测试补全

## 后续更新特性

在这里畅所欲言，但凡可以的都行。~~能不能实装就永远也不知道了~~

- [ ] 前面写着尚未实装的特性
- [ ] order 和 dependence 关键字支持
- [ ] 可以读外部文件和网络上的 schema，可以直接读或给一个接口处理。
- [ ] json-pointer 跳转
- [ ] 菜单栏及相应功能(目前设计也未明确)
- [ ] list 翻页+虚拟列表
- [ ] 键盘无缝跳转，以及焦点
- [ ] format 自验证及默认值生成
- [ ] anchor
- [ ] 动作副作用，可以让面板有实际的操作
- [ ] 面包屑导引局部编辑(路由)
- [ ] 如果可以，支持 xml/yaml/bson，以及非标准 jsonschema(甚至后续有可能还会自己提出一个优化后的 schema 草案)
- [ ] 插入文件及文件显示接口
- [ ] 低版本 schema 兼容性(目前只能通过转移到高版本 schema 解决)

# 关于 json-schema 生态

json-schema 的编辑器实际上可以整一个很大的生态。因为世界上有很大比例的配置都是 json 的格式。作者在下面收集一些关于 json-schema 生态的一些内容：常用 json-schema 收集：https://www.schemastore.org/json/

[npm-image]: https://img.shields.io/npm/v/json-schemaeditor-antd.svg?logo=npm
[npm-url]: https://npmjs.org/package/json-schemaeditor-antd
[quality-image]: https://packagequality.com/shield/json-schemaeditor-antd.svg
[quality-url]: https://packagequality.com/#?package=json-schemaeditor-antd
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/json-schemaeditor-antd.svg?logo=npm
[download-url]: https://npmjs.org/package/json-schemaeditor-antd
