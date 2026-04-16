// Shim for react-dom — not available in React Native
// @clerk/react pulls this in but never actually calls DOM APIs on native
module.exports = {
  createPortal: (children) => children,
  findDOMNode: () => null,
  render: () => null,
  unmountComponentAtNode: () => false,
  hydrate: () => null,
  flushSync: (fn) => fn(),
  unstable_batchedUpdates: (fn) => fn(),
};
