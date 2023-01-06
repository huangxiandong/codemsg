<template>
  <div v-if="isImage || isAudio || isVideo" class="my-chat-mask">
    <chat-image-item v-if="isImage" :file="file" />
    <chat-audio-item v-else-if="isAudio" :file="file" />
    <chat-video-item v-else :file="file" />
    <n-progress v-if="file.status==2" type="line" :percentage="file.progress" :height="2" :show-indicator="false"/>
  </div>
  <template v-else>
    <div class="my-chat-file">
      <div class="my-chat-mask">
        <div class="my-chat-file-content">
          <chat-file-item :file="file" />
        </div>
        <n-progress v-if="file.status==2" type="line" :percentage="file.progress" :height="2" :show-indicator="false"/>
      </div>
      <div class="my-chat-file-bubble"></div>
    </div>
  </template>
</template>

<script>
import { NProgress, NDropdown } from 'naive-ui'
import ChatImageItem from "@/components/ChatImageItem.vue"
import ChatAudioItem from "@/components/ChatAudioItem.vue"
import ChatVideoItem from "@/components/ChatVideoItem.vue"
import ChatFileItem from "@/components/ChatFileItem.vue"
import { isImage, isAudio, isVideo } from "@/utils/util";

export default {
  name: "MyChatFile",
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
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    isImage() {
      let name = this.file.name;
      return isImage(name);
    },
    isAudio() {
      let name = this.file.name;
      return isAudio(name);
    },
    isVideo() {
      let name = this.file.name;
      return isVideo(name);
    }
  },
  methods: {
    statusText() {
      let status = this.file.status;
      if(status == 1) return this.nls.chatMyfileStatus1;
      else if(status == 2) return `${this.nls.chatMyfileStatus2} ${this.file.progress}%`;
      else if(status == 4) return this.nls.chatMyfileStatus4;
    }
  }
};
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.my-chat-file {
  display: flex;
  justify-content: flex-end;
}

.my-chat-mask {
  position: relative;
  display: flex;
  flex-direction: column;
}

.my-chat-file-mask {
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
  color: blue;
}

.my-chat-file-content {
  box-sizing: border-box;
  padding: 5px;
  border-radius: 5px;
  min-height: 40px;
  height: fit-content;
  border: @msg-border-width solid;  
  text-align: left;
}

.my-chat-file-bubble {
  display: flex;
  margin-top: 10px;
  &::after {
    content: "";
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid;
  }
}

.vscode-light {
  .my-chat-file-content {
    border-color: @yours-backgroud-color-dark;
    background-color: @yours-backgroud-color-dark;
    color: @msg-text-color;
  }

  .my-chat-file-bubble {
    &::after {
      border-left-color: @yours-backgroud-color-dark;
    }
  }
}

.vscode-dark {
  .my-chat-file-content {
    border-color: @yours-backgroud-color-dark;    
    color: @msg-text-color-dark;
    background-color: @yours-backgroud-color-dark;
  }

  .my-chat-file-bubble {
    &::after {
      border-left-color: @yours-backgroud-color-dark;
    }
  }
}
</style>