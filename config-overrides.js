/* config-overrides.js */

module.exports = function override(config, env) {
  // 参数中的 config 就是默认的 webpack config
  
  // 对 config 进行任意修改
  config.mode = 'development';
  
  // 一定要把新的 config 返回
  return config;
}