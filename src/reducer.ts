import _ from "lodash";

const reducer = (
  s: State = {
    data: null,
    editionName: "",
    schema: {},
    lastChangedRoute: [],
    lastChangedField: [],
  },
  a: Act
) => {
  const { type, route, field, value } = a;
  if (!route) return Object.assign({}, s); // 防止初始化报错
  if (type === 'set') return Object.assign({}, s, value)  // set强制设置
  const access = field !== null ? route.concat(field) : route
  console.log(type, s, route.join("/") + "+" + field, value);

  const logError = (error: string) => {
    console.log(error, route.join("/") + "+" + field, value, oriNode);
    s.lastChangedRoute = null;
    return s;
  };

  let data = s.data; // 注意这个变量一直是 s 子节点的一个引用
  for (let key of route) {
    data = data[key];
  }
  const oriNode = data;

  // 初始化动作修改路径
  s.lastChangedField = [];
  s.lastChangedRoute = route;

  switch (type) {
    case "create":
      if (oriNode instanceof Array) {
        // 给array push 一个新东西
        let newItem = null;
        if (oriNode.length > 0) newItem = oriNode[oriNode.length - 1];
        oriNode.push(_.cloneDeep(newItem));
      } else if (oriNode instanceof Object) {
        // 给对象创建新的属性
        const keys = Object.keys(oriNode);
        if (keys.length > 0) {
          let key = keys[keys.length - 1];
          const value = _.cloneDeep(oriNode[key]);
          for (let i = 0; ; i++) {
            const newKey = key + i;
            if (!oriNode.hasOwnProperty(newKey)) {
              oriNode[newKey] = value;
              break;
            }
          }
        } else {
          oriNode["propName"] = null;
        }
      } else {
        logError("对非对象/数组的错误创建请求");
      }
      s.lastChangedRoute = access
      break;
    case "change": // change 是对非对象值的改变
      if (field === null) {
        s.data = _.cloneDeep(value);
      } else if (oriNode instanceof Array || oriNode instanceof Object)
        oriNode[field] = _.cloneDeep(value);
      else logError('对非对象/数组的字段修改请求')

      s.lastChangedRoute = access
      break;
    case "delete":
      if (!field) return s;

      if (oriNode instanceof Array) {
        // 注意数组删除，后面元素是要前移的
        const index = parseInt(field);
        _.remove(oriNode, (value: any, i: number) => i === index);
      } else if (oriNode instanceof Object) delete oriNode[field];
      else {
        logError("对非对象/数组的字段删除请求");
      }
      break;
    case "rename":
      if (!field || !value || field === value) break;

      if (oriNode instanceof Object) {
        // todo: 严查value类型
        if (!oriNode.hasOwnProperty(value)) {
          oriNode[value!] = oriNode[field];
          delete oriNode[field];
        }
      } else {
        logError("对非对象的字段重命名请求");
      }
      break;
    case "moveup":
    case "movedown":
      if (oriNode instanceof Array) {
        if (!field) return s;
        const index = parseInt(field);
        const swapIndex = type === "moveup" ? index - 1 : index + 1;
        if (swapIndex >= 0 && swapIndex < oriNode.length) {
          const temp = oriNode[index];
          oriNode[index] = oriNode[swapIndex];
          oriNode[swapIndex] = temp;
          s.lastChangedField = [field, swapIndex.toString()]
        } else {
          logError("数组项越界移动");
        }
      } else logError("对非数组的移动请求");
      break;
    default:
      console.log("错误的动作请求");
  }
  return Object.assign({}, s);
};

const doAction = (type: string, route = [], field = null, value = 0) => ({
  type,
  route,
  field,
  value,
});

const JsonTypes = ["object", "array", "string", "number", "boolean", "null"];

export { reducer, doAction, JsonTypes };
