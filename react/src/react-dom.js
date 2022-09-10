import { TAG_ROOT } from "./constants";
import scheduleRoot from "./schedule";

function render(element, container) {
  let rootFiber = {
    tag: TAG_ROOT, // 每一個 fiber 會有一個 tag 標示元素的類型
    stateNode: container, // 如果 container 是一個原生節點的話，stateNode 指向真實元素
    props: {
      children: [element], // 裡面放的是要渲染的子元素
    },
  };
  scheduleRoot(rootFiber);
}

const ReactDOm = {
  render,
};

export default ReactDOm;
