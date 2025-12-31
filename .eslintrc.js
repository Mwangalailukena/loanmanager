module.exports = {
  extends: [
    "react-app",
    "react-app/jest"
  ],
  env: {
    browser: true,
    es6: true,
    serviceworker: true
  },
  globals: {
    workbox: "readonly",
    clients: "readonly",
    self: "readonly"
  },
  rules: {
    "no-restricted-globals": "off"
  }
};
