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
import EmojiPanel from "@/components/EmojiPanel.vue";
// import WangEditor from "wangeditor";
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
    EmojiPanel,
    ChatEditor
  },
  data() {
    return {
      showEmojiPanel: false,
      editor: undefined,
      showDrop: false,
      dropFiles: [],
      // editorConfig: { placeholder: '请输入内容...' },
      // mode: 'default', // or 'simple',
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
     handleEnter(event) {
      if (event.ctrlKey && event.keyCode === 13) {
        
      } else if(event.keyCode === 13) {
        event.preventDefault();
        this.sendMessage();
        return false;
      }
    },
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
    handleEmoji() {
      this.showEmojiPanel = !this.showEmojiPanel;
    },
    hideEmojiPanel() {
      this.showEmojiPanel = false;
      this.editor.config.focus = true;
    },

    appendEmoji(emoji) {
      // console.log("emoji", emoji);
      const uriRoot = this.$store.state.uriRoot;
      let style = `background-image: url('${uriRoot}/emoji/emoji_sprite.png');`
      let clazz = `emoji-item emoji-common emoji-${emoji}`;
      let html = `<img alt="${emoji}" src="${uriRoot}/emoji/mask.png" class="${clazz}" style="${style}">`;
      console.log("html", html);
      this.editorRef.dangerouslyInsertHtml(html)
    },

    toTextMsg(json) {
      let text = "";
      let p = json[0];
      let children = p.children;
      if(children !== undefined) {
        for(let child of children) {
          if(typeof child === "string") {
            text = `${text}${child}`;
          } else if(typeof child === 'object') {
            let tag = child.tag;
            if(tag === "img") {
              let altObj = child.attrs.find(obj => obj.name === 'alt'); 
              text = `${text}:${altObj.value}:`;
            } else {
              if(child.children.length > 0) {
                text = `${text}${child.children[0]}`;
              }
            }
          }
        }
      }
      return text;
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
    // this.editor = new WangEditor("#chat-editor");
    // this.editor.config.showFullScreen = false;
    // this.editor.config.focus = true;
    // this.editor.config.zIndex = 99;
    // // this.editor.config.placeholder = this.nls.chatInputPlacehoder;
    // this.editor.config.placeholder = "New Message";
    // // 配置粘贴文本的内容处理
    // this.editor.config.pasteTextHandle = function (pasteStr) {
    //   console.log("wangeditor", pasteStr);
    //     // 对粘贴的文本进行处理，然后返回处理后的结果
    //     return pasteStr + '巴拉巴拉'
    // }
    // this.editor.create();

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

.chat-toolbar {
  // border-top: 1px solid gray;
  height: 30px;
  display: flex;
  align-items: center;
}

.vscode-light {
  .w-e-text {
    color: rgba(51, 54, 57, 1);
    caret-color: #18a058;
  }
  .w-e-text-container {
    .placeholder {
      color: rgba(194, 194, 194, 1);
    }
  }
}
.chat-toolbar-icon {
  color: gray;
  &:hover {
    color: green;
  }
}

.vscode-dark {
  --w-e-textarea-bg-color: #333;
  --w-e-textarea-color: rgba(255, 255, 255, 0.82);
  .w-e-text {
    color: rgba(255, 255, 255, 0.82);
    caret-color: #63e2b7;
  }
  .w-e-text-container {
    .placeholder {
      color: rgba(255, 255, 255, 0.38);
    }
  }
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

.chat-send-button {
  position: absolute;
  bottom: 10px;
  right: 30px;
  z-index: 999;
}

.chat-emoji-pannel {
  z-index: 100;
  display: block;
  position: absolute;
  top: -150px;
  left: 2px;
}

.chat-emoji-modal {
  z-index: 99;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0);
}

.w-e-text-container {
  height: 100% !important;
  border: unset !important;
  border-bottom: unset !important;
  background-color: unset !important;
}
.w-e-text {
  height: 100% !important;
  background-color: unset !important;
}


.drop-attachment {
  display: flex;
  align-items: center;
}

.drop-attachment-icon {
  color: green;
}

@import "../styles/emoji.less";
</style>
