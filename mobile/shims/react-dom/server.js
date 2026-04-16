// Shim for react-dom/server — not available in React Native
module.exports = {
  renderToString: () => '',
  renderToStaticMarkup: () => '',
  renderToNodeStream: () => null,
  renderToStaticNodeStream: () => null,
};
