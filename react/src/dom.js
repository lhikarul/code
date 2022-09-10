import { TAG_HOST, TAG_TEXT } from "./constants";

export function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  } else if (currentFiber.tag === TAG_HOST) {
    let stateNode = document.createElement(currentFiber.type);
    updateDOM(stateNode, {}, currentFiber.props);
    return stateNode;
  }
}

function updateDOM(stateNode, oldProps, newProps) {
  setProps(stateNode, oldProps, newProps);
}

function setProps(dom, oldProps, newProps) {
  for (let key in oldProps) {
    if (key !== "children") {
      if (newProps.hasOwnProperty(key)) {
        setProp(dom, key, newProps[key]);
      } else {
        dom.removeAttribute(key);
      }
    }
  }

  for (let key in newProps) {
    if (key !== "children") {
      setProp(dom, key, newProps[key]);
    }
  }
}

function setProp(dom, key, value) {
  if (/^on/.test(key)) {
    dom[key.toLowerCase()] = value;
  } else if (key === "style") {
    if (value) {
      for (let styleName in value) {
        dom.style[styleName] = value[styleName];
      }
    }
  } else {
    dom.setAttribute(key, value);
  }
}
