# json-schema

## 数据表示

js支持的数据类型：

null:带名称不展示，不带名称展示

boolean:使用checkbox进行展示

object:嵌套块状展示

array:数组展示，问题很多

数组展示模式：

- 固定长度，限定类型
- 长度不定，单类型或额外+null
- 

number:数字展示。  
单纯数字问题不是很大。json只支持使用十进制表示数字。  
展示方式：输入框(带上下点击调节)，滑动条(指定min，max，step)，其它(如生命值图标类似)

string：字符串

字符串涉及到格式问题和长短问题

- 格式问题：不同格式的字符串，可以用正则表达式设计格式
- 长短问题：长文章使用textarea，短字符串使用一行，小于10的字符串使用小格
- 展示模式问题：可以按照日期/密码等模式展示，而且可以自定义控件设置特定格式

### meta-schema

本身描述 JSON Schema 的模式称为元模式。元模式用于验证 JSON 模式并指定它们使用的词汇表。

通常，元模式将指定一组词汇，并验证符合这些词汇语法的模式。但是，元模式和词汇表是分开的，以便允许元模式比词汇表的规范要求更严格或更松散地验证模式一致性。元模式还可以描述和验证不属于正式词汇的附加关键字。

## 具体格式与字段

json-schema是一种可递归的文法模式。下列按照数据类型分别来展示其

[JSON Schema入门 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/355175938)

### 根

| 关键字    | 作用                                                         | 值类型     | 备注     |
| --------- | ------------------------------------------------------------ | ---------- | -------- |
| `$schema` | 采用的jsonschema草稿                                         | url        |          |
| `$id`     | 不知道有什么用                                               | string     |          |


### 通用模式

这个就是schema类型的schema定义。

| 关键字                | 作用                                                         | 值类型   | 备注     |
| --------------------- | ------------------------------------------------------------ | -------- | -------- |
| `title`,`description` | 变量展示的名称(如果该变量为一个object的字段，会覆盖其属性名)和介绍 <br />注：如果该变量为一个array的元素，则。。。淦。一般array的元素无名 | string   |          |
| `type`                | 变量的类型。(number, integer, null, array, object, boolean, string) | string   |          |
| `enum`              | 限定变量值为枚举值之一。可以使用枚举模式表示<br />枚举的展示模式：下拉框，单选框 | \<type\>[] |      |
| [`const`](https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.1.3) | 唯一可能性变量 | \<type> | |
| `$ref` | 对其它schema的引用。<br />此处额外定义的信息会覆盖引用 | uri->schema | |
| `oneOf` | 变量满足的模式必须是且只是其中之一<br />该项目做了一个假设就是，oneof的schema没有oneof | schema[] | |
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

| 关键字                  | 作用          | 值类型 | 备注 |
| ----------------------- | ------------- | ------ | ---- |
| `minLength`,`maxLength` | 最小/最大长度 | int    |      |
| `pattern`               | 符合的正则    | regex  |      |

### 数组

`type`为`"array"`

https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.4

| 关键字                                                       | 作用                                                         | 值类型            | 备注                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------- | ---------------------------- |
| [`prefixItems`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.1.1) | 认为数组前面的模式需要与该字段中的模式一一匹配。<br />数组超出的长度不关心。 | schema \|schema[] | 2020-12 新增                 |
| `items`                                                      | 如果是schema，认为数组每一个元素均符合此模式<br />如果是schema[]，认为数组从开头到结尾一个个符合对应index的模式<br />从`prefixItems`匹配结束后的索引开始匹配 | schema \|schema[] | 2020-12 变成了additional功能 |
| `additionalItems`                                            | `items`设置为数组时，对于数组，仅当项设置为数组时。如果是模式，则该模式在items数组指定的项之后验证项。如果为false，则其他项将导致验证失败。 | schema            |                              |
| `minItems`,`maxItems`                                        | 长度最小/最大                                                | int               |                              |
| [`contains`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.1.3) | 数组中必须有元素符合该模式。从开始识别，不受前面的关键词影响<br />该关键词只涉及验证。创建另说 | schema            |                              |
| `minContains`,`maxContains`                                  | 限制符合`contains`模式元素的个数。                           | int               | 6没有                        |

数组短优化：

如果数组items的所有可能只有string/number/boolean/null其中之一，且string不使用长模式，
则数组会使用列表短模式，缩小显示空间进行优化。

### 对象

https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.5

| 关键字                                                       | 作用                                                         | 值类型                  | 备注 |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------- | ---- |
| [`properties`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.1) | 可以出现的属性字段和字段变量的信息。以key-value形式表示<br />其它属性再通过`patternProperties`和`additionalProperties`验证，不通过则失败 | object<string, schema>  |      |
| [`patternProperties`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.2) | 认为满足**正则表达式属性名**的字段，满足value的模式          | object<regex, schema>   |      |
| [`additionalProperties`](https://json-schema.org/draft/2020-12/json-schema-core.html#additionalProperties) | 只对`properties`和`patternProperties`未验证的属性字段进行验证，<br />验证这些字段（注：这些字段不关注字段名。）是否符合值的模式<br />比如，这个属性为false就是不允许其它属性(不设置为true) | schema                  |      |
| [`propertyNames`](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.10.3.2.4) | 对象所有**属性名**必须满足该模式<br />注意属性名一定是字符串 | schema                  |      |
| `required`                                                   | 对象必须要具有的字段列表。<br />默认按照                     | string[]                |      |
| `minProperties`,`maxProperties`                              | 限制属性字段数量                                             | int                     |      |
| `dependencies`                                               | 值属性存在时才可以存在键属性                                 | object<string,string[]> |      |

schema定义一个嵌套的object，读取属性时是`root.layer1.layer2`；但是读取对应schema时是`root.properties.layer1.properties.layer2`。每一层属性多读一层`properties`。

在设计中，默认是仅具备`required`的属性，然后选择框中包括`properties`的其它属性。可以再加属性。
`dependencies`不对属性选择进行特殊设置，只是不可用的属性禁止勾选。

验证并不冲突。

关于ui嵌入schema里面，这样就可以保持一致。
但是考虑到别的用uischema，所以我认为，uischema不能和schema扯上联系。uischema应该改成uioptions配置。

## 设计概念

### 模式假设

1. 编辑的过程中，模式是不变的
2. `required`的属性都具备在`properties`中
3. 设置了`type`属性后，才会给对应属性类型约束
4. `oneOf`、`anyOf`、`enum`、`const`不同时存在，如果存在`oneOf`或`anyOf`，其选项相连不出现循环引用。
5. `properties`和`patternProperties`不能匹配到同一名称
6. 如果是多模式验证，满足**替换假设**。否则某些特性会无法正常工作。详见 [采用多schema](#采用多schema)

### 字段标题

分为以下情况：

- 父节点通过`property`拿到该对象：优先级排：`title`(schema指定`properties`中别名)，`property`(实际拿到的字段名)。
  此外如果是`patternProperties`拿到的属性，`title`属性是无效的
- 父节点为数组，通过索引拿到：`title`+空格+`index`

#### 属性名修改

属性名如果在`properties`内，无法修改。
属性名如果在`patternProperties`内，只能改成符合正则式的属性名。
此外可以改成任意不与以上冲突的属性名

### 长字段/短字段

如果该字段的`type`是`object`或者`array`，或者是长格式展示的`string`；或者是具有`oneOf`字段，那该字段是**长字段**。
此外，如果该字段的`type`是`integer/number`或者`boolean/null`；或者具有`enum`，该字段是**短字段**。

可以证明，所有嵌套格式的都是**长字段**。枚举选项固定

#### 对象短字段密集展示

短字段在对象和数组中优先网格状密集展示。

#### 数组短字段压缩

如果数组模式中规定的所有字段都是短字段，则会采用密集压缩显示（所以+值框），名称也会被忽略。  
而且如果数组每一项都没有title属性显示，就默认所有都是extra短优化，所有的项都不显示标题  
否则还是一行行展示

### 枚举短化

由于`enum`关键字将模式值限定到了具体的有限可能值，所以只用一个选择框来选择，无论枚举的这个变量有多长/多深。
这样可以将`enum`变短。此外`enum`有一个按钮，按下可以弹出查看枚举项具体值。

数组做为枚举项，显示的枚举项名称为`Array[{length}]`。

对象作为枚举项，显示的枚举项名称为`name.toString()`，此外为`Object[keys.length]`

### schema与data容错处理

|          | enum    | oneof                       | type                | no fixed t |
| -------- | ------- | --------------------------- | ------------------- | ---------- |
| isenum   | 短-正常 |                             |                     |            |
| is oneof | 短-错误 | 长-oneof                    |                     |            |
| is type  |         | 长-oneof空-值为无schema模式 | 正常                |            |
| wrong t  |         |                             | 短则错误，长则value |            |

在没有schema约束的情况下，会当作一个普通的json编辑器显示。
意思就是完善无schema情况下的兼容性

### 根列表展示

如果既定根元素必然是数组，可以以列表方式进行展示

## 具体问题

### ajv的配置相关



### 采用多schema

在特定的情况下，一个值是否满足模式，需要通过多个schema进行验证。

具体情况有：

1. 使用了`$ref`
2. 一个对象的属性同时匹配`properties`和`patternProperties`

在这里的设置是，一个位置引用了一个模式映射`Map<$ref, schema>`。
如果只是供这一层，只需要构建直接引用的模式映射即可。
但是在一些情况下需要深递归找到引用的所有模式，建立映射

#### $ref 计算情况缓存机制

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

之后会考虑加入某些属性的合并(暂未实装)

### 字符串格式

https://ajv.js.org/packages/ajv-formats.html

> 注：目前有一些格式的专用编辑组件还未实装，不过验证是有效的

在字符串的format中设置。除此之外，还增加了一些其它格式：

- uri
- uri-reference
- base-64
- color
- row（加长输入条）
- multiline（多行编辑）

一些格式并不支持短优化

### 重命名与显示名称

对于一个对象的属性，如果其属于properties中，则不可命名。
如果位于patternProperties中，命名只能符合对应的正则式。
此外可以自由命名。如果新的字段名符合上面两种情况，再次进行命名时，依照规则，新字段名的命名空间会受到限制。

位于properties的字段可以作为自动补全的选项。

显示名称受到字段本身和模式`title`属性的影响

#### 个性化显示（以后实现

> 注意：只有不可重命名的元素，标题名称才可以动态显示

可以使用加入`${property}`，使用property属性的只读描述组件，作为标题的一部分。

### 错误

如果数据错误，会在对应处出现一个❌，鼠标移到上面可以查看错误信息详情。
会以数据实际类型来显示数据。
如果数据作为短字段显示且为对象/数组的话，会出现类型错误四个字，可以查看详情更改或者重置

## Reducer

对于一个`Field`组件，自己的访问是`access`，自己父级是`route`，子是`access+sfield`

| 可能调用的动作            | 更新           | 说明               |
| ------------------------- | -------------- | ------------------ |
| create(access+sfield)     | access,+sfield | 从access处新建属性 |
| change(route,field)       | field          | 改变自己的值       |
| delete(route, field)      | route          | 从父节点删除自己   |
| rename(route, field)      | route,field    | 改变自己的属性键   |
| moveup/down(route, field) | route, field   | 将自己上移/下移    |
|                           |                |                    |



## 验证输出格式

通过 ajv 进行json-schema有效性验证。这里我们统一使用 draft 6 进行验证。

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

## 测试案例

``` json
{
    "definitions": {
        "number1": {
            "type": "number",
            "maxinum": 50
        }
    },
    "type": "number",
    "maxinum": 40,
    "$ref": "#definitions/number1"
}
```

