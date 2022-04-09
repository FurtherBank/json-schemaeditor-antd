# json-schemaeditor-antd
## 使用方法
核心部分是Editor文件夹的组件。  
直接引用Editor文件夹即可。  
组件就三个属性：data，schema，onChange: (value: any) => void

按照受控用法使用即可。

### ref

Editor组件将store暴露在了`useImperativeHandle`中。如果想要从外部主动更改数据，可以按照redux的store api进行操作。

更多信息详见 [Reducer](#Reducer)

### 使用时注意

1. 状态的修改满足 [immutable 约定](https://www.yuque.com/furtherbank/frontend/react#slACC)

## JSON Schema 简单说明

json-schema是一种可递归的文法模式。
该项目使用draft6

[JSON Schema入门 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/355175938)

### 根

| 关键字    | 作用                 | 值类型 | 备注             |
| --------- | -------------------- | ------ | ---------------- |
| `$schema` | 采用的jsonschema草稿 | url    | 该项目使用draft6 |
| `$id`     | 不知道有什么用       | string |                  |


### 通用模式

这个就是schema类型的schema定义。

| 关键字                | 作用                                                         | 值类型   | 备注     |
| --------------------- | ------------------------------------------------------------ | -------- | -------- |
| `title`,`description` | 变量展示的名称(如果该变量为一个object的字段，会覆盖其属性名)和介绍 <br />对于title属性在编辑器中显示的实际影响，请参阅 | string   |          |
| `type`                | 变量的类型。(number, integer, null, array, object, boolean, string) | string   |          |
| `enum`              | 限定变量值为枚举值之一。可以使用枚举模式表示<br />枚举的展示模式：下拉框，单选框 | \<type\>[] |      |
| [`const`](https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.1.3) | 唯一可能性变量 | \<type> | |
| `$ref` | 对其它schema的引用。<br />此处额外定义的信息会覆盖引用 | uri->schema | |
| `oneOf`/`anyOf` | 变量满足的模式必须只满足/至少满足其中之一<br />在项目中涉及到了对满足的模式进行选择的问题。 | schema[] | |
| `default`             | 变量的默认值。生成时使用                                     | \<type\> | 额外特性 |

另注：如果schema为布尔值，则直接对应判定的变量是否有效。`true`或者`{}`，任何值都有效。`false`或者`{"not": {}}`任何值都无效

### 布尔/null

null是不需要显示的。

### 数字/整数

| 关键字                                                       | 作用                                             | 值类型 | 备注 |
| ------------------------------------------------------------ | ------------------------------------------------ | ------ | ---- |
| `mininum`,`maxinum`<br />`exclusiveMinimum`<br />`exclusiveMaximum` | 数字最小值/最大值<br />`exclusive`为不包括该值的 | number |      |
| `multipleOf`                                                 | 整数专用，可以被其整除                           | int    |      |




### 字符串

https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.3

| 关键字                  | 作用           | 值类型 | 备注 |
| ----------------------- | -------------- | ------ | ---- |
| `minLength`,`maxLength` | 最小/最大长度  | int    |      |
| `pattern`               | 符合的正则     | regex  |      |
| `format`                | 格式，就是正则 | string |      |

### 数组

`type`为`"array"`

https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.4

| 关键字                                                       | 作用                                                         | 值类型            | 备注                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| `items`                                                      | 如果是schema，认为数组每一个元素均符合此模式<br />如果是schema[]，认为数组从开头到结尾一个个符合对应index的模式<br />从`prefixItems`匹配结束后的索引开始匹配 | schema \|schema[] | 2020-12 变成了additional功能，使用[`prefixItems`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.1.1)替代 |
| `additionalItems`                                            | `items`设置为数组时，对于数组，仅当项设置为数组时。如果是模式，则该模式在items数组指定的项之后验证项。如果为false，则其他项将导致验证失败。 | schema            |                                                              |
| `minItems`,`maxItems`                                        | 长度最小/最大                                                | int               |                                                              |
| [`contains`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.1.3) | 数组中必须有元素符合该模式。从开始识别，不受前面的关键词影响<br />该关键词只涉及验证。创建另说 | schema            |                                                              |
| `minContains`,`maxContains`                                  | 限制符合`contains`模式元素的个数。                           | int               | 6没有                                                        |

数组短优化：

如果数组items的所有可能只有string/number/boolean/null其中之一，且string不使用长模式，
则数组会使用列表短模式，缩小显示空间进行优化。

### 对象

https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.5

| 关键字                                                       | 作用                                                         | 值类型                  | 备注     |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------- | -------- |
| [`properties`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.1) | 可以出现的属性字段和字段变量的信息。以key-value形式表示<br />其它属性再通过`patternProperties`和`additionalProperties`验证，不通过则失败 | object<string, schema>  |          |
| [`patternProperties`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.2) | 认为满足**正则表达式属性名**的字段，满足value的模式          | object<regex, schema>   |          |
| [`additionalProperties`](https://json-schema.org/draft/2020-12/json-schema-core.html#additionalProperties) | 只对`properties`和`patternProperties`未验证的属性字段进行验证，<br />验证这些字段（注：这些字段不关注字段名。）是否符合值的模式<br />比如，这个属性为false就是不允许其它属性(不设置为true) | schema                  |          |
| [`propertyNames`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.4) | 对象所有**属性名**必须满足该模式<br />注意属性名一定是字符串 | schema                  |          |
| `required`                                                   | 对象必须要具有的字段列表。<br />默认按照                     | string[]                |          |
| `minProperties`,`maxProperties`                              | 限制属性字段数量                                             | int                     |          |
| `dependencies`                                               | 值属性存在时才可以存在键属性                                 | object<string,string[]> | 暂未实装 |

schema定义一个嵌套的object，读取属性时是`root.layer1.layer2`；但是读取对应schema时是`root.properties.layer1.properties.layer2`。每一层属性多读一层`properties`。

在设计中，默认是仅具备`required`的属性，然后选择框中包括`properties`的其它属性。可以再加属性。
`dependencies`不对属性选择进行特殊设置，只是不可用的属性禁止勾选。

验证并不冲突。

关于ui嵌入schema里面，这样就可以保持一致。
但是考虑到别的用uischema，所以我认为，uischema不能和schema扯上联系。uischema应该改成uioptions配置。

## 设计概念定义

### 模式假设

1. 编辑的过程中，模式是不变的
2. `required`的属性都具备在`properties`中
3. 设置了`type`属性后，才会给对应属性类型约束
4. `oneOf`、`anyOf`、`enum`、`const`不同时存在
5. 如果存在`oneOf`或`anyOf`，其选项相连不出现循环引用，而且之外不存在验证属性
   如果出现了层叠的`oneOf`和`anyOf`，不会出现重复引用项
5. `properties`和`patternProperties`不能匹配到同一名称
6. 如果是多模式验证，满足**替换假设**。否则某些特性会无法正常工作。详见 [采用多schema](#采用多schema)

### 短字段

如果该字段的`type`是`object`或者`array`，或者是长格式展示的`string`；或者是具有`oneOf`字段，那该字段是**长字段**。
此外，如果该字段的`type`是`integer/number`或者`boolean/null`；或者具有`enum`，该字段是**短字段**。  
短字段在对象和数组中优先网格状密集展示。

可以证明，所有嵌套格式的都是**长字段**。枚举选项固定

#### 短字段操作空间

短字段的操作空间放入了字段右侧的按钮中，点击按钮可以选择并作出相应操作。

此外，短字段还可以通过**详细**操作，打开抽屉查看字段的详细值。

### 操作空间(即 可执行的操作)

实际上这里不把所有操作都列出来，有些不需要列。
又一些非通用的操作，比如 [创建](#创建)  [重命名](#重命名) ，后面有说明，自行看链接。

#### 复制粘贴(待实装)

列表模式下可以复制多个项（复制成数组），并将项依次插入列表中。

粘贴时会进行**浅验证**

#### 撤销恢复

真的就是一个简单的撤销和恢复操作啊。  
但是，做这个真的是对react和redux给了解透彻了才可以！

### 浅验证

通过模式对数据进行简单粗浅的验证，相对整个的模式验证更省时。具体说明如下：

1. 如果模式具有const或者enum定义，返回这两个关键词的验证结果。
2. 如果模式定义了唯一的类型，且和数据类型相同，分为以下情况：
   - 如果数据是对象，对模式中`required`内的字段值进行浅验证。
   - 如果数据是数组，对数组每项字段值进行浅验证。
   - 在对象或数组中，对其内字段进行浅验证时，如果这些字段的类型是对象或数组，只判断类型是否正确，不再继续递归对内部字段进行浅验证。
   - 如果数据是字符串且有格式属性，会匹配格式是否正确
   - 其它类型只要相同就返回`true`
3. 模式没有明确的类型定义，返回`true`

注意，浅验证不会对具备 oneOf/anyOf 的字段进行验证，会直接返回`true`。

### schema与data容错处理

|          | enum    | oneof                       | type                | no fixed t |
| -------- | ------- | --------------------------- | ------------------- | ---------- |
| isenum   | 短-正常 |                             |                     |            |
| is oneof | 短-错误 | 长-oneof                    |                     |            |
| is type  |         | 长-oneof空-值为无schema模式 | 正常                |            |
| wrong t  |         |                             | 短则错误，长则value |            |

在没有schema约束的情况下，会当作一个普通的json编辑器显示。
意思就是完善无schema情况下的兼容性

## 具体信息说明

### ajv的配置相关

增加了格式，

增加了后续可能会出现的连接词(暂未实装)

### 模式的模式——元模式

本身描述 JSON Schema 的模式称为元模式。元模式用于验证 JSON 模式是否正确。

该项目中直接使用draft6元模式可以正常工作，不过为更方便编辑，项目对元模式内容进行了拓展，并以一些通用约定做了特殊限制。
详见`json-example/$meta.json`

### 关注到多个schema

在特定的情况下，一个值是否满足模式，需要通过多个schema进行验证。

具体情况有：

1. 使用了`$ref`
2. 一个对象的属性同时匹配`properties`和`patternProperties`

在这里的设置是，一个模式入口引用了一个模式映射`Map<$ref, schema>`。


#### 性质缓存机制

如果一个模式使用了 oneOf/anyOf，需要用ajv验证是否符合各schema才能确定项。
但是这样要将当前层的data用于当前层的schema验证才行。

如果把schema直接抽出，验证将在出现`$ref`标签时不起作用。
所以这里将 oneOf/anyOf 下的所有引用到的模式迁移到`definitions`下，然后更新引用，在选择验证时，root改为`$ref: "#/definitions/subSchema${i}"`，然后放在ajv下验证即可。

因为有schema不变的假设，如果多个量在这一个路径，我们可以将处理后的schema缓存下来，然后调用，可以防止每个有oneOf的ui都得通过schemamap重建处理后的schema。

于是，这个东西就缓存在了store的状态中，以一个map记录处理后的schema，of选项等等信息。

#### 替换假设

对于从一个入口得到的schema有$ref字段而涉及到多个schema对象的时候，我们假设，其表现与将牵扯到的schema进行合并没有区别。
合并通过object.assign的方式，将\$ref引用者的属性覆盖到被引用的属性值上。

实际上在涉及到多个schema对象的时候，schema的验证结果是所有涉及到的schema验证结果的**与**合并。
如果你在使用$ref的模式中，`$ref`引用者和被引用者都具有不同或者相同的验证属性时，结果才与满足替换假设的情况有差别。

一般情况下，除非你是故意的，就不会这么做。

对于`$ref`引用得到模式的最佳实践是，`$ref`引用者不加入任何验证相关属性。最多就是加入title,description等描述性字段替换被引用者这些字段的值。

### 验证错误

如果数据验证错误，会在对应处出现一个❌，鼠标移到上面可以查看错误信息详情。
长字段数据类型错误，会以数据实际类型来显示数据。
如果数据作为短字段显示且为对象/数组的话，会出现“类型错误”四个字，可以查看详情更改或者重置



## 模式限制的特性索引

这一篇主要说明在不同的模式限制下，字段编辑器的一些表现，以及其会涉及到的特性。
其中，很多特性的具体应用条件、参数可以在`FieldOption`脚本文件中找到。
如果想要对这些特性进行定制设计，可以在其中进行修改。

如果不通过模式对数据进行任何限制，该编辑器只是一个普通的json编辑器。

### const/enum

#### 短字段

`const`和`enum`必然为短字段，无论其值类型。

#### 常量名称

一个数据作为`const`或者`enum`选项的值，由于只使用一个短组件显示，所以需要对应一个名称。称之为**常量名称**`constName`。

数组做为常量，名称为`Array[{length}]`。
对象名称为`name.toString()`，此外为`Object[keys.length]`

注意将数据的**常量名称**、字段的**标题名称**和模式的**模式名称**区分开来。

### oneOf/anyOf

对于具备 oneOf/anyOf 的字段，会通过一个树选择组件，来处理数据实际满足的模式。
可以正确处理 oneOf/anyOf 连续嵌套的情况，但必须要满足对应的 [模式假设](#模式假设)

#### 实际变量入口映射

对于具有 oneOf/anyOf 的模式字段，值满足的实际模式还需要通过选项来映射到实际的入口。
所以在`Field`中，对于字段的模式入口，有`schemaEntry`和`valueEntry`两个概念。

#### 模式名称

oneOf/anyOf 下的模式作为选项需要有一个名称，称为**模式名称**。

模式优先使用`title`属性作为名称，其次匹配模式限定的数据类型作为名称。`

注意将数据的**常量名称**、字段的**标题名称**和模式的**模式名称**区分开来。

#### 选项判定细节

正常来说，判断一份数据属于 oneOf/anyOf 的哪一个选项时，就是将每一个选项的模式分别对数据进行验证，如果数据匹配一个模式，就认为该数据属于这个模式对应的选项。

但是这么做有两个非常明显的缺点：

1. 实现中需要一一展开模式，并且对每一个选项的数据都要进行验证，非常费时，对于一个不太大的数据，编译+验证时间甚至会达到秒的数量级
   (一个一般大的模式，每个选项验证大概需要20ms)
2. 如果数据并不满足任何模式，但是和某个模式非常相似，那么也无法提供模式对于编辑的确定性支持

因此，在这里使用了**浅验证**作为每个选项验证的方式。
如果数据经浅验证有多个选项符合(尤其是 anyOf 的情况)，会认为数据是第一个符合的选项。

#### 选项切换时数据最大兼容

如果一些选项的类型都是对象，那么在这些选项中进行切换时，会对原有的一些属性进行保留。
不过只会保留新模式中`properties`和`patternProperties`匹配的指定属性。其它属性(无论`additionalProperties`是否允许这些属性的存在)都会被删除。

### 不确定类型

不确定类型会有一个选择组件来处理该字段的类型。
实际上，在这里并不建议使用多类型的模式，如果有这样的需求，使用`oneOf`关键字会更好。

### 单一类型

#### object

##### 特殊展示模式(未实装)

可以通过`view`字段规定对象的特殊展示模式。

##### 短字段显示

对象的所有短字段会在列表开头统一展示，独立于其它的字段

##### 属性展示顺序(暂未实装)

会依据模式的`order`作为关键字排序作为属性的展示顺序。

不过需要注意，即使设置了顺序，短字段依然会在开头独立于其它长字段统一展示。

##### 创建

会提前检查是否所有的可创建属性均已创建，如果是这种情况，你将无法看到创建属性按钮并进行属性创建操作。

创建一个属性时，会提示输入新属性的名称然后进行创建。
通过`propertyCache`，可以读取到所有在模式中定义的属性名，用于创建时输入的自动补全。

会通过模式定义检查输入的属性名是否可以新建，且会检查是否重复。

创建时，会通过属性对应的模式生成默认值。

##### 重命名

属性的重命名有一定的限制。

对于一个对象的属性，如果其属于`properties`中，则不可命名。
如果位于`patternProperties`中，命名只能符合对应的正则式。
此外可以自由命名。如果新的字段名符合上面两种情况，再次进行命名时，依照规则，新字段名的命名空间会受到限制。

##### 标题名称

一个字段可能会有别名，该名称取决于对应模式的`title`值。
不过字段必须**不可重命名**时才会使用别名展示。

此外，数组项也可以使用别名展示。如果设置了标题名称，数组将不可使用`extra`短模式展示。

`title`属性设置特殊的字符串，可以采用特殊的模式进行显示：(未实装)

- `$i`：替换成数组的index
- `${propertyName}`：替换成对应属性的描述组件显示

##### 删除

在`required`内的字段不可被删除。

#### array

##### 特殊展示模式(未实装)

可以通过`view`字段规定数组的特殊展示模式。

- 曲线
- 

##### 短字段显示

如果一个数组所有的字段都是短字段，那么这个数组的每个项都会通过短字段展示。

此外，如果所有字段都没有设置`title`属性，短字段展示可以省去每项标题占用的空间，从而更密集的展示数据。(称为`extra`短模式)

##### 创建

会提前检查是否可以继续创建项，当不能创建时，你将无法看到创建按钮并进行创建操作。
创建会自动依据新项目对应的模式生成默认值。

##### 根列表模式

如果根节点在模式中定义为数组，且实际类型也为数组，那么会以**两栏列表**的方式展示数据。
其中左侧列表可以拖拽选中多个项目进行复制和粘贴操作。(暂未实装)

#### string

##### 字符串格式

https://ajv.js.org/packages/ajv-formats.html

> 注：目前有一些格式的专用编辑组件还未实装，不过验证是有效的

在字符串的`format`中设置。除此之外，还增加了一些其它格式：

| 格式名             | 描述                                                | 格式类型           | 特殊组件                                                     |
| ------------------ | --------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| uri                |                                                     | `longFormats`      |                                                              |
| uri-reference      |                                                     | `longFormats`      |                                                              |
| base-64            |                                                     | `extraLongFormats` | 二进制编辑器（未实装）                                       |
| color              | 颜色。~~支持rgb/rgba/cmyk等多种颜色格式是否可能？~~ |                    | 颜色选择框（未实装）                                         |
| row                | 单行加长输入                                        | `longFormats`      | input加长版                                                  |
| multiline          | 多行输入                                            | `extraLongFormats` |                                                              |
| code: \<language>  | 特定语言代码（未实装）                              | `extraLongFormats` | monaco-editor（未实装）                                      |
| file: \<file-type> | 文件名（未实装）                                    |                    | 文件上传框（未实装）<br />特殊的文件会读取展示，如图片，但是未实装 |

string的一些格式并不支持短优化，这时会作为一个长组件显示。
长格式分为两种：**单行长格式**`longFormats`和**跨行长格式**`extraLongFormats`。

**单行长格式**的组件仍然在一行展示，但是长度增加。
**跨行长格式**的组件会另起一行显示，可以跨域多行。

#### number/integer/boolean/null

- 必然为短字段

## 自定义 view （仅设计）

在 schema 中可以通过 view 字段

``` json
{
    "view": {
        "type": "your_view_type",
        "params": {
            "any": "any"
        }
    }
}
```

可以自定义 json-schemaeditor 的 view 组件并发布到 npm。
这样，在使用 json-schemaeditor 时，可以通过配置文件`json-schemaeidtor.json`（是用json引包还是js require引入？）使用自定义的 view 组件。

### 自定义 view 组件

自定义 view 组件需要配置如下：

1. 数据有效条件
   该配置类型为 schema，表示怎样模式的数据可以使用该组件编辑。
2. 配置有效条件
   该配置类型为 schema，表示 view 字段的 params 应该是怎样的。
3. 组件信息
   包括组件类type(这个字段是 view 的 type 的值)
   组件短优化情况(short/long/extralong)

``` json
{
    "type": "your_view_type",
    
}
```

然后再加上一些目录约定。。。

## Reducer

Editor组件通过`useImperativeHandle`将 store 给暴露了出来，可以拿到 store 然后直接 dispatch 动作进行修改。  
下面主要介绍动作：  

``` typescript 
// 示例：在 gifts 下新建字段 1，其值为 { "name": "gold", "number": 10 }
const action = {
    type: "create",
    route: ["gifts"],
    field: "1",
    value: {
        "name": "gold",
        "number": 10
    }
}
```

对于一个`Field`组件，自己的访问是`access`，自己父级是`route`，子是`access+sfield`

| 可能调用的动作            | 更新           | 说明               |
| ------------------------- | -------------- | ------------------ |
| create(access+sfield)     | access,+sfield | 从access处新建属性 |
| change(route,field)       | field          | 改变自己的值       |
| delete(route, field)      | route          | 从父节点删除自己   |
| rename(route, field)      | route,field    | 改变自己的属性键   |
| moveup/down(route, field) | route, field   | 将自己上移/下移    |
| setdata(value)            |                | 直接更新           |
| undo/redo                 |                | 撤销/恢复          |

## 验证输出格式

通过 ajv 进行 json-schema 有效性验证。这里我们统一使用 draft 6 进行验证。

按照以下例子确定输出格式。

该例子是一个多边形的表示，各点有x,y坐标；且至少三个点。
实例只有两个点且第二个点缺少字段`y`多字段`z`。

``` json
{
  "$id": "https://example.com/polygon",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$defs": {
    "point": {
      "type": "object",
      "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" }
      },
      "additionalProperties": false,
      "required": [ "x", "y" ]
    }
  },
  "type": "array",
  "items": { "$ref": "#/$defs/point" },
  "minItems": 3
}
```

```json
[
  {
    "x": 2.5,
    "y": 1.3
  },
  {
    "x": 1,
    "z": 6.7
  }
]
```

输出结果包含一个`valid`字段表明json是否符合模式。
此外可以在不符合模式输出error信息。错误信息有3种输出方式如下：

1. 直接输出。通过**直接列表**来表示错误，都在同一层，通过`keywordLocation`和`absoluteKeywordLocation`(带ref的绝对schema地址)表示出错关键词路径；通过`instanceLocation`指示出错路径

   ``` json
   {
     "valid": false,
     "errors": [
       {
         "keywordLocation": "",
         "instanceLocation": "",
         "error": "A subschema had errors."
       },
       {
         "keywordLocation": "/items/$ref",
         "absoluteKeywordLocation":
           "https://example.com/polygon#/$defs/point",
         "instanceLocation": "/1",
         "error": "A subschema had errors."
       },
       {	// 缺字段 y
         "keywordLocation": "/items/$ref/required",
         "absoluteKeywordLocation":
           "https://example.com/polygon#/$defs/point/required",
         "instanceLocation": "/1",
         "error": "Required property 'y' not found."
       },
       {	// 多字段 z
         "keywordLocation": "/items/$ref/additionalProperties",
         "absoluteKeywordLocation":
           "https://example.com/polygon#/$defs/point/additionalProperties",
         "instanceLocation": "/1/z",
         "error": "Additional property 'z' found but was invalid."
       },
       {
         "keywordLocation": "/minItems",
         "instanceLocation": "",
         "error": "Expected at least 3 items but found 2"
       }
     ]
   }
   ```

2. 详细输出。通过**简化树形结构**来表示错误。其中：

   - 所有**模式应用关键字**(`***Of`，)都需要一层{}来表示
   - 没有错误信息子节点，会直接删除
   - 只有一个错误信息子节点的，会被替换成原来的子节点(有效才是一层)
   - 具有多个子节点的父节点，通过`errors`字段列举所有子节点错误信息；叶节点直接通过`error`字段列举
   - (不明白层级指的是例子对象层级，还是规定层级)

   ``` json
   {
     "valid": false,
     "keywordLocation": "",
     "instanceLocation": "",
     "errors": [
       {
         "valid": false,
         "keywordLocation": "/items/$ref",
         "absoluteKeywordLocation":
           "https://example.com/polygon#/$defs/point",
         "instanceLocation": "/1",
         "errors": [
           {
             "valid": false,
             "keywordLocation": "/items/$ref/required",
             "absoluteKeywordLocation":
               "https://example.com/polygon#/$defs/point/required",
             "instanceLocation": "/1",
             "error": "Required property 'y' not found."
           },
           {
             "valid": false,
             "keywordLocation": "/items/$ref/additionalProperties",
             "absoluteKeywordLocation":
               "https://example.com/polygon#/$defs/point/additionalProperties",
             "instanceLocation": "/1/z",
             "error": "Additional property 'z' found but was invalid."
           }
         ]
       },
       {
         "valid": false,
         "keywordLocation": "/minItems",
         "instanceLocation": "",
         "error": "Expected at least 3 items but found 2"
       }
     ]
   }
   ```

3. 完全输出。完全按照层级输出，会有多余层级，长度会非常大，而且所有验证有效节点也会显示。
   看[完全输出](D:\Windows\Download\verbose-example.json)

## 项目测试
说实话，这个项目测试也不知道最终写成什么样子去测试比较好，尤其是在界面上。  
逻辑测试主要测函数写的是否正确，还是比较好做的。  
但是这个实际效果测试就很难说，是一个混沌状态。  
不能绝对的说满足哪一个特征就是ok。(但是可以绝对的说出什么问题不ok)  

目前准备用 macaca 来做测试。  

## 其它问题

### 环境相关

使用cra+react app rewired

## 尚未解决问题

- [x] `enum`选项很长时，选框会过长导致ui错乱
- [ ] List组件响应式列表看的是屏幕宽度而非dom宽度，导致有时候一个短优化项过短的问题
- [ ] 无 default 默认值设置的不是太好

## 后续更新特性

- [ ] 前面写着尚未实装的特性
- [ ] 说实话大统一之后真的可以读外部的 schema，可以直接读或给一个接口吊起来
- [ ] $ref 跳转
- [ ] 菜单栏及相应功能(目前设计也未明确)  
- [ ] list 翻页，如果两页高度不一样，有时候会找不着
- [ ] 键盘无缝跳转
- [ ] format自验证及默认值生成
- [ ] anchor
- [ ] 动作副作用，可以让面板有实际的操作
- [ ] 面包屑导引局部编辑
- [ ] 如果可以，让他变成xml/yaml编辑器(误)
- [ ] 插入文件及文件显示接口
