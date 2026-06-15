/// <reference types="node" />

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const noop = () => {};
const noopReturn = (val: any) => val;

const makeStyle = (): any =>
  new Proxy({} as any, {
    get: (_t, p) => {
      if (p === 'getPropertyValue') return () => '';
      if (p === 'setProperty') return noop;
      if (p === 'removeProperty') return noop;
      return '';
    },
    set: () => true,
  });

const makeEl = (): any => ({
  style: makeStyle(),
  setAttribute: noop,
  getAttribute: () => null,
  removeAttribute: noop,
  hasAttribute: () => false,
  appendChild: noopReturn,
  removeChild: noopReturn,
  insertBefore: noopReturn,
  replaceChild: noopReturn,
  cloneNode: () => makeEl(),
  contains: () => false,
  isAncestor: () => false,           // ← fixes "isAncestor is not a function"
  isSameNode: () => false,
  isEqualNode: () => false,
  compareDocumentPosition: () => 0,
  classList: { add: noop, remove: noop, contains: () => false, toggle: noop, replace: noop },
  addEventListener: noop,
  removeEventListener: noop,
  dispatchEvent: () => false,
  getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  childNodes: [],
  children: [],
  parentNode: null,
  nodeType: 1,
  nodeName: 'DIV',
  tagName: 'DIV',
  innerHTML: '',
  outerHTML: '',
  textContent: '',
  ownerDocument: null as any,
});

const doc: any = {
  createElement: () => makeEl(),
  createElementNS: () => makeEl(),
  createTextNode: () => ({ nodeType: 3, textContent: '', parentNode: null, isAncestor: () => false }),
  createComment: () => ({ nodeType: 8, textContent: '', isAncestor: () => false }),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementsByTagName: () => [],
  getElementsByClassName: () => [],
  addEventListener: noop,
  removeEventListener: noop,
  dispatchEvent: () => false,
  documentElement: makeEl(),
  head: makeEl(),
  body: makeEl(),
  nodeType: 9,
};

doc.body.ownerDocument = doc;
doc.head.ownerDocument = doc;
doc.documentElement.ownerDocument = doc;

const getComputedStyleFn = () => makeStyle();

const define = (key: string, value: any) => {
  try {
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  } catch {
    (globalThis as any)[key] = value;
  }
};

define('window',               globalThis);
define('document',             doc);
define('getComputedStyle',     getComputedStyleFn);
define('requestAnimationFrame',(cb: any) => setTimeout(cb, 16));
define('cancelAnimationFrame', clearTimeout);
define('ResizeObserver',       class { observe = noop; unobserve = noop; disconnect = noop; });
define('MutationObserver',     class { observe = noop; disconnect = noop; takeRecords = () => []; });
define('IntersectionObserver', class { observe = noop; unobserve = noop; disconnect = noop; });
define('HTMLElement',          class {});
define('Element',              class {});
define('Node',                 class { static ELEMENT_NODE = 1; static TEXT_NODE = 3; });
define('Event',                class { constructor(public type: string) {} });
define('CustomEvent',          class { constructor(public type: string, public detail?: any) {} });
define('CSSStyleDeclaration',  class { getPropertyValue() { return ''; } setProperty = noop; });
define('navigator',            { userAgent: 'node', language: 'en', languages: ['en'] });
define('location',             { href: '', origin: '', pathname: '', search: '', hash: '' });

const g = globalThis as any;
g.window.getComputedStyle      = getComputedStyleFn;
g.window.document              = doc;
g.window.ResizeObserver        = g.ResizeObserver;
g.window.MutationObserver      = g.MutationObserver;
g.window.requestAnimationFrame = g.requestAnimationFrame;
g.window.cancelAnimationFrame  = clearTimeout;