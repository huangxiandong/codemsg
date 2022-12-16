<template>
  <div class="conversation">
    <div class="conversation-master" :style="{ width: width + 'px' }">
      <n-scrollbar class="conversation-master-scroll">
        <conversation-item
          v-for="item in conversations"
          :key="item.nickname"
          :conversation="item"
        ></conversation-item>
      </n-scrollbar>
    </div>
    <div id="conversation-resizer" class="m-resizer"></div>
    <div class="conversation-detail">
      <template v-if="chatWith !== undefined">
        <chat></chat>
      </template>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useNotification } from "naive-ui"
import { NScrollbar } from 'naive-ui'
import ConversationItem from "@/components/ConversationItem.vue";
import Chat from "@/views/Chat.vue"

export default defineComponent({
  name: "Conversation",
  setup() {
    const notification = useNotification();
    return {
      notification
    };
  },
  components: {
    NScrollbar,
    ConversationItem,
    Chat
  },
  data() {
    return {

    };
  },
  computed: {
    width() {
      return this.$store.state.asideWidth;
    },
    chatWith() {
      return this.$store.state.chatWith;
    },
    conversations() {
      return this.$store.state.conversations;
      // let cc = [];
      // for(let i=0; i<50; i++) {
      //   let newConversation = {
      //     feiq: false,
      //     online: true,
      //     nickname: "张三"+i,
      //     group: "蜀山派",
      //     address: "192.168.1.1"+i,
      //     port: 2425,
      //     messages: []
      //   }
      //   cc.push(newConversation);
      // }
      // return cc;
    }
  },
  mounted() {
    this.$nextTick(() => {
      console.log("notification", this.notification);
      this.$store.dispatch("setNotifier", this.notification);
      this.dragControllerDiv();
    });
  },
  methods: {
    dragControllerDiv() {
      // 保留this引用
      let me = this;
      let resize = document.getElementById("conversation-resizer");
      resize.onmousedown = function(e) {
        // 颜色改变提醒
        let startX = e.clientX;
        resize.left = resize.offsetLeft;
        document.onmousemove = function(e) {
          // 计算并应用位移量
          let endX = e.clientX;
          let moveLen = endX - startX;
          startX = endX;
          let newWidth =  me.width + moveLen;
          console.log('conversation move', moveLen)
          me.$store.dispatch("setAsideWidth", newWidth);
        };
        document.onmouseup = function() {
          // 颜色恢复
          document.onmousemove = null;
          document.onmouseup = null;
        };
        return false;
      };
    }
  }
})
</script>

<style lang="less" scoped>
.conversation {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  .m-resizer {
    box-sizing: border-box;
    width: 2px;
    border-top: 1px solid gray;
    border-bottom: 1px solid gray;
    cursor: ew-resize;
    background: var(--vscode-scrollbarSlider-background);
    &:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }
  }  
}

.conversation-master {
  height: 100%;
  box-sizing: border-box;
  border-width: 1px 0 1px 1px;
  border-color: gray;
  border-style: solid;
  padding: 10px;
  // overflow: scroll;
  display: flex;
  .conversation-master-scroll {
    flex: 1;
  }
}

.conversation-detail {
  flex: 1;
  border-width: 1px 1px 1px 0;
  border-color: gray;
  border-style: solid;
}
</style>