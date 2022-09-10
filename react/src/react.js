import { ELEMENT_TEXT } from "./constants.js";
/**
 *
 * @param {*} type 元素的類型 div, span, p
 * @param {*} config  配置對象, 屬性 key, ref
 * @param  {...any} children 子元素, 這會是一個陣列
 */
function createElement(type, config, ...children) {
  return {
    type,
    props: {
      ...config,
      children: children.map((child) => {
        return typeof child === "object"
          ? child
          : {
              type: ELEMENT_TEXT,
              props: {
                text: child,
                children: [],
              },
            };
      }),
    },
  };
}

const React = {
  createElement,
};

export default React;
