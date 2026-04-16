// Shim for react-dom/client — not available in React Native
module.exports = {
  createRoot: () => ({ render: () => null, unmount: () => null }),
  hydrateRoot: () => ({ render: () => null, unmount: () => null }),
};
