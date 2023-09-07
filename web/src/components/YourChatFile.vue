<template>
  <div @contextmenu="handleContextMenu">
    <chat-image-item v-if="isImage" :file="file" />
    <chat-audio-item v-else-if="isAudio" :file="file" />
    <chat-video-item v-else-if="isVideo" :file="file"  />
    <template v-else>
      <div class="your-chat-file">
        <div class="your-chat-file-bubble"></div>
        <div class="your-chat-mask">
          <div class="your-chat-file-content">
            <chat-file-item :file="file" />
          </div>        
          <n-progress v-if="file.status==2" type="line" :percentage="file.progress" :height="2" :show-indicator="false"/>
          <div v-if="showMask" class="your-chat-file-mask">
            <div
              class="your-chat-file-status-accept"
              @click="handleAccept"
            >
              <Strong>{{nls.chatFileAccept}}</Strong>
            </div>
            <div
              class="your-chat-file-status-reject"
              @click="handleReject"
            >
              <strong>{{nls.chatFileReject}}</strong>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    :x="x"
    :y="y"
    :options="options()"
    :show="showDropdown"
    :on-clickoutside="onClickoutside"
    @select="handleSelect"
  />
</template>

<script>
import { NProgress, NDropdown } from 'naive-ui'
import ChatImageItem from "@/components/ChatImageItem.vue"
import ChatAudioItem from "@/components/ChatAudioItem.vue"
import ChatVideoItem from "@/components/ChatVideoItem.vue"
import ChatFileItem from "@/components/ChatFileItem.vue"
import {ipc} from "@/vscode";
import { isImage, isAudio, isVideo } from "@/utils/util";

export default {
  name: "YourChatFile",
  components: {
    NProgress,
    NDropdown,
    ChatImageItem,
    ChatAudioItem,
    ChatVideoItem,
    ChatFileItem
  },
  props: {
    file: {
      type: Object,
      required: true,
    },
    message: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showDropdown: false,
      x: 0,
      y: 0
    }
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    showMask() {
      if(this.file.status !== undefined && this.file.status === 1) return true;
      return false;
    },
    isImage() {
      let path = this.file.path;
      let status = this.file.status;
      if(path === undefined || status != 3) {
        return false;
      }
      let name = this.file.name;
      // console.log("++++++++++++++++++++", this.file);
      return isImage(name);
    },
    isAudio() {
      let path = this.file.path;
      let status = this.file.status;
      if(path === undefined || status != 3) {
        return false;
      }
      let name = this.file.name;
      return isAudio(name);      
    },
    isVideo() {
      let path = this.file.path;
      let status = this.file.status;
      if(path === undefined || status != 3) {
        return false;
      }
      let name = this.file.name;
      return isVideo(name);
    }
  },
  methods: {
    handleAccept() {
      // console.log("handleAccept", this.message);
      let messageId = this.message.messageId;
      let remote = {
        feiq: this.$store.state.chatWith.feiq,
        address: this.$store.state.chatWith.address,
        port: this.$store.state.chatWith.port,
      };
      
      let packet = {
        packetId: this.message.packet.packetId,
      };

      let mainMsg = {
        info: {
          type: "recvFile",
        },
        remote,
        packet,
        extra: {
          files: [this.file],
        },
      };
      console.log("mainMsg", mainMsg);
      ipc.postMainMessage(mainMsg);
    },

    handleReject() {
      // console.log("handleReject", this.message);
      let messageId = this.message.messageId;
      let remote = {
        address: this.$store.state.chatWith.address,
        port: this.$store.state.chatWith.port,
      };
      let extra = {
        fields: [
          {
            name: "status",
            value: 4,
          },
        ],
      };
      this.$store.dispatch("updateFileMessage", {
        messageId,
        remote,
        extra,
      });
      let packet = {
        packetId: this.message.packet.packetId,
      };
      ipc.postMainMessage({
        info: {
          type: "rejectFile",
        },
        remote,
        packet,
      });
    },
    options(){
      return [
        {
          label: this.nls.chatFileOpenFile,
          key: 'openFile'
        },
        {
          label: this.nls.chatFileOpenFolder,
          key: 'openInFolder'
        }
      ]
    }, 
    handleContextMenu (e) {
      e.preventDefault()
      this.showDropdown = false
      this.$nextTick().then(() => {
        this.showDropdown = true
        this.x = e.clientX
        this.y = e.clientY
      })
    },
    handleSelect (key) {
      this.showDropdown = false
      if(key === "openFile") {
        this.handleOpen();
      } else if(key === "openInFolder") {
        this.handleOpenFolder();
      }
    },
    onClickoutside () {      
      this.showDropdown = false
    },
    handleOpen() {
      let filepath = this.file.path;
      if(filepath === undefined) {
        filepath = `${this.message.extra.location}/${this.file.name}`
      }
      ipc.openFile({
        filepath: filepath
      });
    },
    handleOpenFolder() {
      let filepath = this.file.path;
      if(filepath === undefined) {
        filepath = `${this.message.extra.location}/${this.file.name}`
      }
      ipc.openFolder({
        filepath: filepath
      });
    }
  }
};
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.your-chat-file {
  display: flex;
  justify-content: flex-end;
}

.your-chat-mask {
  position: relative;
  display: flex;
  flex-direction: column;
}

.your-chat-file-content {
  box-sizing: border-box;
  padding: 5px;
  border-radius: 5px;
  min-height: 40px;
  height: fit-content;
  border: @msg-border-width solid;  
  text-align: left;
}

.your-chat-file-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 5px;
  z-index: 99;
  background-color: rgba(192, 192, 192, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.your-chat-file-bubble {
  display: flex;
  margin-top: 10px;
  &::before {
    content: "";
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 8px solid;
  }
}

.vscode-light {
  .your-chat-file-content {
    border-color: @yours-border-color-light;
    background-color: @yours-backgroud-color-light;
    color: @msg-text-color;
  }

  .your-chat-file-bubble {
    &::before {
      border-right-color: @yours-border-color-light;
    }
  }
}

.vscode-dark {
  .your-chat-file-content {
    border-color: @yours-backgroud-color-dark;    
    color: @msg-text-color-dark;
    background-color: @yours-backgroud-color-dark;
  }

  .your-chat-file-bubble {
    &::before {
      border-right-color: @yours-border-color-dark;
    }
  }
}

.your-chat-file-status-accept,
.your-chat-file-status-reject {
  border: 1px solid gray;
  margin: 2px;
  padding: 2px 8px 2px 8px;
  font-size: 12px;
  cursor: pointer;
}

.your-chat-file-status-accept {
  color: blue
}

.your-chat-file-status-reject {
  color: deeppink;
}
</style>