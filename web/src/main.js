import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import {listenToVscode} from "@/vscode";
import initWangEditor from "./wangeditor";

window.packetNo = 0;

listenToVscode({
  store
});

initWangEditor({
  store
});

createApp(App).use(store).use(router)/*.use(naive)*/.mount("#app");
