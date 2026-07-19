import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import store from "./redux/store";
import "./index.css";

let scrollHideTimer;
window.addEventListener(
  "scroll",
  () => {
    document.documentElement.classList.add("is-scrolling");
    clearTimeout(scrollHideTimer);
    scrollHideTimer = setTimeout(() => {
      document.documentElement.classList.remove("is-scrolling");
    }, 700);
  },
  { capture: true, passive: true }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
