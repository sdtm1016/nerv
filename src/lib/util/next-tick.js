import { forEach, isFunction, isNative } from './index';

let callbacks = []
let pending = false
let runNextTick

function nextHandler () {
  pending = false
  let copies = callbacks.slice(0)
  callbacks = []
  forEach(copies, task => task())
}

function canUsePromise () {
  return isFunction(Promise)
    && isNative(Promise)
}

function canUseMutationObserver () {
  return isFunction(MutationObserver)
    && isNative(MutationObserver)
    && MutationObserver.toString() === '[object MutationObserverConstructor]'
}

function installPromise () {
  let p = Promise.resolve()
  let logErr = err => console.error(err)
  runNextTick = () => p.then(nextHandler).catch(logErr)
}

function installMutationObserver () {
  let observeNum = 1;
  let textNode = document.createTextNode(observeNum)
  let observer = new MutationObserver(nextHandler)
  observer.observe(textNode, {
    characterData: true
  })
  runNextTick = () => {
    observeNum = (observeNum + 1) % 2
    textNode.data = observeNum
  }
}

function installSetTimeout () {
  runNextTick = () => {
    let timer = setImmediate || setTimeout
    timer(nextHandler, 0)
  }
}

if (canUsePromise()) {
  installPromise()
} else if (canUseMutationObserver()) {
  installMutationObserver();
} else {
  installSetTimeout();
}

function nextTick (cb, ctx) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (err) {
        console.error(err)
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    runNextTick()
  }
  if (!cb && canUsePromise()) {
    return new Promise((resolve) => {
      _resolve = resolve
    })
  }
}

export default nextTick;