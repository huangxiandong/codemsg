<template>
  <div class="chat" ref="chat">
    <div class="chat-top">
      <div class="chat-name">
        <span>{{ chatName }}</span>
      </div>
      <n-scrollbar ref="chatItems" class="chat-items">
        <chat-item
          v-for="item in messages"
          :key="item.messageId"
          :message="item"
        >
        </chat-item>
      </n-scrollbar>
    </div>
    <div id="chat-resizer" class="m-resizer"></div>
    <div class="chat-bottom" :style="{ height: inputHeigth + 'px' }">
      <div class="chat-input">
        <chat-editor class="chat-input-area" :sendTextMethod="sendMessage" :sendFileMethod="handleFile" :sendFolderMethod="handleFolder" :fileTitle="nls.chatSendFileTooltip" :folderTitle="nls.chatSendFolderTooltip" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { onBeforeUnmount, ref, shallowRef, onMounted, onbeforeCreate } from 'vue'
import { NInput, NIcon, NTooltip, NButton, NScrollbar, NModal } from "naive-ui";
import { File, Folder } from "@vicons/tabler";
import { Emoji16Regular } from "@vicons/fluent";
import { Attach20Filled } from "@vicons/fluent";
import ChatItem from "@/components/ChatItem.vue";
import ipc from "@/ipc";
import { formatDate, generateId } from "@/utils/util";
import ChatEditor from "@/components/ChatEditor.vue";

export default defineComponent({
  name: "Chat",
  components: {
    NInput,
    NIcon,
    NTooltip,
    NButton,
    NScrollbar,
    NModal,
    File,
    Folder,
    Emoji16Regular,
    Attach20Filled,
    ChatItem,
    ChatEditor
  },
  data() {
    return {
      showDrop: false,
      dropFiles: [],
    };
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    chatName() {
      if (this.$store.state.chatWith !== undefined) {
        return `${this.$store.state.chatWith.nickname} - ${this.$store.state.chatWith.group}`;
      }
      return "";
    },
    feiq() {
      if(this.$store.state.chatWith !== undefined) {
        return this.$store.state.chatWith.feiq;
      }
      return false;
    },
    modalTitle() {
      return `发送给：${this.$store.state.chatWith.nickname}`
    },
    messages() {
      if (this.$store.state.chatWith === undefined) {
        return [];
      } else {
        return this.$store.state.chatWith.messages;
      }
    },
    disabled() {
      return this.$store.state.chatWith === undefined;
    },
    inputHeigth() {
      return this.$store.state.chatInputHeight;
    },
  },
  methods: {
    sendMessage(msg) {
      console.log("sendMessage", msg);
      msg = msg.replace("<p>", "").replace("</p>", "");
      if (this.$store.state.chatWith !== undefined) {
        let packetId = generateId();
        let messageId = packetId + "";
        let now = new Date();
        let dateStr = formatDate(now, "yyyy-MM-dd HH:mm:ss");
        let info = {
          type: "text",
          mine: true,
          read: true,
          date: dateStr,
        };
        let remote = {
          feiq: this.$store.state.chatWith.feiq,
          address: this.$store.state.chatWith.address,
          port: this.$store.state.chatWith.port,
          nickname: this.$store.state.chatWith.nickname,
          group: this.$store.state.chatWith.group,
        };
        let packet = {
          packetId: packetId,
          version: "1",
        };
        let extra = {
          text: msg,
        };
        let newMsg = {
          messageId,
          order: now.getTime(),
          info,
          remote,
          packet,
          extra,
        };
        let obj = {
          pos: -1,
          message: newMsg,
        };
        this.$store.dispatch("addMessage", obj);
        // console.log("chat", this.$store.state.chatWith);
        ipc.postMainMessage({
          id: messageId,
          info: {
            type: "sendMsg",
          },
          remote,
          packet,
          extra,
        });
        ipc.log(newMsg);
      }
      this.inputMsg = "";
      this.$store.dispatch("increaseMessage");      
    },
    handleFile() {
      console.log("send file");
      if (this.$store.state.chatWith !== undefined) {
        let packetId = generateId();
        let messageId = packetId + "";
        let remote = {
          feiq: this.$store.state.chatWith.feiq,
          address: this.$store.state.chatWith.address,
          port: this.$store.state.chatWith.port,
        };
        let packet = {
          packetId: packetId,
          version: "1",
        };
        ipc.postMainMessage({
          messageId,
          info: {
            type: "sendFile",
          },
          remote,
          packet,
        });
      }
    },
    handleFolder() {
      console.log("send folder");
      if (this.$store.state.chatWith !== undefined) {
        let packetId = generateId();
        let messageId = packetId + "";
        let remote = {
          feiq: this.$store.state.chatWith.feiq,
          address: this.$store.state.chatWith.address,
          port: this.$store.state.chatWith.port,
        };
        let packet = {
          packetId: packetId,
          version: "1",
        };
        ipc.postMainMessage({
          messageId,
          info: {
            type: "sendFolder",
          },
          remote,
          packet,
        });
      }
    },
    dragControllerDiv() {
      // 保留this引用
      let me = this;
      let resize = document.getElementById("chat-resizer");
      resize.onmousedown = function (e) {
        // 颜色改变提醒
        let startY = e.clientY;
        resize.top = resize.offsetTop;
        document.onmousemove = function (e) {
          // 计算并应用位移量
          let endY = e.clientY;
          let moveLen = endY - startY;
          // console.log("chat move", moveLen);
          startY = endY;
          let newHeight = me.inputHeigth - moveLen;
          if (newHeight < 200) newHeight = 200;
          if (newHeight > 500) newHeight = 500;
          me.$store.dispatch("setChatInputHeight", newHeight);
        };
        document.onmouseup = function () {
          // 颜色恢复
          document.onmousemove = null;
          document.onmouseup = null;
        };
        return false;
      };
    },

    onNegativeClick () {
      this.showDrop = false
    },
    onPositiveClick () {
      this.showDrop = false
      if (this.$store.state.chatWith !== undefined) {
        let packetId = generateId();
        let messageId = packetId + "";
        let remote = {
          feiq: this.$store.state.chatWith.feiq,
          address: this.$store.state.chatWith.address,
          port: this.$store.state.chatWith.port,
        };
        let packet = {
          packetId: packetId,
          version: "1",
        };
        let extra = {
          paths: this.dropFiles
        }
        ipc.postMainMessage({
          messageId,
          info: {
            type: "dropFile",
          },
          remote,
          packet,
          extra
        });
      }
    },
    handleDrop(e) {
      if(this.$store.state.chatWith === undefined) {
        return;
      }
      e.preventDefault()
      console.log("data transfer", e.dataTransfer);
      const fileList = e.dataTransfer.files
      // let file = fileList[0]
      this.dropFiles.splice(0, this.dropFiles.length);
      for(let file of fileList) {
        console.log(file);
        this.dropFiles.push(
          file.path
        )
      }
      this.showDrop = true;
    }
  },
  mounted() {
    this.$nextTick(() => {
      // this.$refs.chatInput.focus();
      this.dragControllerDiv();
      this.$refs.chatItems.scrollTo({
        top: Number.MAX_SAFE_INTEGER,
      });
    });

    const chat = this.$refs.chat
    // 被拖动的对象进入目标容器
    chat.addEventListener('dragover', e => {
      e.preventDefault()
      if(this.$store.state.chatWith === undefined) {
        return;
      }
      // chat.style.cursor = 'no-drop';
    })
    // 被拖动的对象离开目标容器
    chat.addEventListener('dragleave', e => {
      e.preventDefault()
      if(this.$store.state.chatWith === undefined) {
        return;
      }
    })
    // 被拖动的对象进入目标容器，释放鼠标键
    chat.addEventListener('drop', this.handleDrop);
  },
  beforeUnmount() {
    console.log("beforeUnmount");
  },
  watch: {
    "$store.state.count"(newVal) {
      this.$nextTick(() => {
        this.$refs.chatItems.scrollTo({
          top: Number.MAX_SAFE_INTEGER,
        });
      });
    },
  },
});
</script>

<style lang="less" scoped>
.chat {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .m-resizer {
    height: 3px;
    cursor: ns-resize;
    background: var(--vscode-scrollbarSlider-background);
    &:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }
  }
}

.chat-top {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.chat-bottom {
  display: flex;
  flex-direction: column;
  min-height: 340px;
  max-height: 500px;
  position: relative;
}

.chat-item-icon {
  color: green;
}

.chat-name {
  height: 50px;
  padding-left: 10px;
  border-bottom: 1px solid gray;
  display: flex;
  align-items: center;
  font-size: 18px;
}

.chat-items {
  flex: 1;
  // overflow: scroll;
}

.chat-input {
  border-top: 1px solid gray;
  // border-left: 1px solid gray;
  flex: 1;
  // height: 200px;
  display: flex;
}

.chat-input-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  word-break: break-word;
}

.drop-attachment {
  display: flex;
  align-items: center;
}

.drop-attachment-icon {
  color: green;
}

</style>
