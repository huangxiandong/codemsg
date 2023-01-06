<template>
  <n-config-provider :locale=locale :theme="theme">
    <n-notification-provider placement="bottom-right">
      <div v-if="$store.state.webRoot !== ''" class="root">
        <toolbar />
        <router-view />
      </div>
      <div v-else>正在加载中</div>
    </n-notification-provider>
  </n-config-provider>
</template>

<script>
import { defineComponent } from "vue";
import { NConfigProvider, NNotificationProvider, createTheme, commonDark, avatarDark, badgeDark, buttonDark, collapseDark, inputDark, dropdownDark } from "naive-ui";
import { formDark, iconDark, progressDark, modalDark, dataTableDark, tooltipDark, tabsDark, listDark, selectDark, switchDark, inputNumberDark, scrollbarDark } from "naive-ui";
import { zhCN } from 'naive-ui'
// import { useNotification } from 'naive-ui'
import Toolbar from "@/views/Toolbar.vue";
import ipc from "@/ipc";

export default defineComponent({
  setup () {
    // const notification = useNotification();
    // console.log("const notification = useNotification();", notification);
    return {
      zhCN,
      darkTheme: createTheme([
        commonDark, 
        inputDark,
        avatarDark,
        badgeDark,
        buttonDark,
        collapseDark,
        formDark,
        iconDark,
        progressDark,
        modalDark,
        dataTableDark,
        tooltipDark,
        tabsDark,
        listDark,
        selectDark,
        switchDark,
        inputNumberDark,
        scrollbarDark,
        dropdownDark
      ]),
      // notification
    }
  },
  components: {
    NConfigProvider,
    NNotificationProvider,
    Toolbar
  },
  computed: {
    theme() {
      if(this.$store.state.theme == 1) {
        return null;
      } else {
        return this.darkTheme;
      }
    },
    locale() {
      return this.$store.state.locale;
    }
  },
  mounted() {
    let store = this.$store;
    document.onkeydown = function(e) {
      // console.log("e=====", e);
      if((e.key==="."||e.key===">") && e.ctrlKey && e.shiftKey) {
        let size = store.state.textFontSize + 1;
        store.commit("setTextFontSize", size);
         console.log("font + 1", store.state.textFontSize);
      } else if((e.key===","||e.key==="<") && e.ctrlKey  && e.shiftKey) {
        let size = store.state.textFontSize - 1;
        store.commit("setTextFontSize", size);
        console.log("font - 1", store.state.textFontSize);
      }
    }
    this.$nextTick(() => {
      //ipc.entry(this.$store.state.nickname, this.$store.state.group);
      // this.$store.dispathc("setNotifier", notification);
      ipc.loadHistory();
      ipc.entry();
    })
  }
})
</script>

<style lang="less" scoped>
.root {
  width: 100%;
  height: 99vh;
  display: flex;
  user-select: none;
}
</style>