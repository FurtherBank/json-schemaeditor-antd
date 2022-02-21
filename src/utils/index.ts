const concatAccess = (route: any[], ...args: any[]) => {
  return route.concat(args.filter(value => !!value))
}

const jsonDataType = (data: any) => {
  return data === null ? 'null' : data instanceof Array ? 'array' : typeof data;
}

export {concatAccess, jsonDataType}