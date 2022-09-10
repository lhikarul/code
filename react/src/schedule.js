/**
 * 從根節點開始渲染和調度
 * 兩個階段
 * diff 階段 -> 對比新舊虛擬 DOM, 進行增量、更新、創建
 * render 階段 -> 渲染比較花時間，對任務進行拆分， 一個虛擬 DOm 對應一個任務，這個階段可以暫停
 * render 階段 -> 產生出 effect list，這個 list 會告訴我們哪些節點更新了，哪些節點刪除了
 * render 階段 -> 主要兩個任務， 1.根據虛擬 DOM 生成 fiber 樹 2. 生成 effect list
 * commit 階段 -> 進行 DOM 的更新、創建，此階段不能暫停，不能畫面會不完整
 */

import {
  ELEMENT_TEXT,
  PLACEMENT,
  TAG_HOST,
  TAG_ROOT,
  TAG_TEXT,
} from "./constants";
import { createDOM } from "./dom";

/**
 *
 * @param {*} rootFiber tag: TAG_ROOT, stateNode: container, props: {children: [element]}
 */

let nextUnifOfWork = null; // 下一個任務
let workInProgressRoot = null; // 根節點

export default function scheduleRoot(rootFiber) {
  workInProgressRoot = rootFiber;
  nextUnifOfWork = rootFiber;
}

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber);
  if (currentFiber.child) {
    return currentFiber.child;
  }
  while (currentFiber) {
    completeUnitOfWork(currentFiber);
    if (currentFiber.sibling) return currentFiber.sibling;
    currentFiber = currentFiber.return;
  }
}

/**
 * 1. 收集 fiber, 組成 effect list
 *
 */
function completeUnitOfWork(currentFiber) {
  let returnFiber = currentFiber.return;
  if (returnFiber) {
    // 將自身的子元素掛載至父元素
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }
    if (!!currentFiber.lastEffect) {
      if (!!returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      returnFiber.lastEffect = currentFiber.lastEffect;
    }
    // 將自己掛載至父元素
    const effectTag = currentFiber.effectTag;
    if (effectTag) {
      if (!!returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber;
      } else {
        returnFiber.firstEffect = currentFiber;
      }
      returnFiber.lastEffect = currentFiber;
    }
  }
}

/**
 * 1. 創建真實 DOM 元素
 * 2. 創建子元素的 fiber
 */
function beginWork(currentFiber) {
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber);
  } else if (currentFiber.tag === TAG_HOST) {
    updateHost(currentFiber);
  }
}

/**
 * 1. 如果是一個原生節點，創建真實 DOM
 * 2. 創建子元素的 fiber
 */
function updateHostRoot(currentFiber) {
  let newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}

function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
}

function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
  const newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}

function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0;
  let prevSibling;

  while (newChildIndex < newChildren.length) {
    let newChild = newChildren[newChildIndex];
    let tag;
    if (newChild.type === ELEMENT_TEXT) {
      tag = TAG_TEXT;
    } else if (typeof newChild.type === "string") {
      tag = TAG_HOST;
    }

    let newFiber = {
      tag,
      type: newChild.type,
      props: newChild.props,
      stateNode: null,
      return: currentFiber,
      effectTag: PLACEMENT,
      nextEffect: null,
    };

    if (newFiber) {
      if (newChildIndex === 0) {
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
    }

    newChildIndex++;
  }
}

function workLoop(deadline) {
  let shouldYield = false; // 是否讓出控制權
  while (nextUnifOfWork && !shouldYield) {
    nextUnifOfWork = performUnitOfWork(nextUnifOfWork);
    shouldYield = deadline.timeRemaining() < 1; // 沒有時間了，讓出控制權
  }
  if (!nextUnifOfWork) {
    console.log("render 階段結束");
    commitRoot();
  }
  requestIdleCallback(workLoop, {
    timeout: 500,
  });
}

function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  workInProgressRoot = null;
}

function commitWork(currentFiber) {
  if (!currentFiber) return;
  let returnFiber = currentFiber.return;
  let returnDOM = returnFiber.stateNode;

  if (currentFiber.effectTag === PLACEMENT) {
    returnDOM.appendChild(currentFiber.stateNode);
  }
  currentFiber.effectTag = null;
}
// React 現在有渲染的任務，瀏覽器只需要在閒置時間執行這些任務
requestIdleCallback(workLoop, {
  timeout: 500,
});
