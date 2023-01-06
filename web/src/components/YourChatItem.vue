<template>
  <template v-if="message.info.type==='text'">
    <div class="your-chat-item">
      <div>
        <n-avatar round>{{initial}}</n-avatar>
      </div>
      <div>
        <your-chat-text :message="message" />
        <div class="your-chat-item-date">{{message.info.date}}</div>
      </div>
    </div>
  </template>
  <template v-if="message.info.type==='file'">
    <template v-for="file in message.extra.files">
      <div class="your-chat-item">
        <div>
          <n-avatar round>{{initial}}</n-avatar>
        </div>
        <div>
          <your-chat-file v-if="message.info.type==='file'" :file="file" :message="message"/>
          <div class="your-chat-status">
            <div class="your-chat-item-date">{{message.info.date}}</div>
            <div v-if="showStatus(file)" class="your-chat-status-text">{{ statusText(file) }}</div>
          </div>
        </div>
      </div>
    </template>
  </template>
</template>

<script>
import { NAvatar } from 'naive-ui';
import YourChatText from "@/components/YourChatText.vue"
import YourChatFile from "@/components/YourChatFile.vue"
import { isImage, isAudio, isVideo } from "@/utils/util";

export default {
  name: "YourChatItem",
  props: {
    message: {
      type: Object,
      required: true
    },
  },
  components: {
    NAvatar,
    YourChatText,
    YourChatFile
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    initial() {
      return this.$store.state.chatWith.nickname.charAt(0).toUpperCase();
    }    
  },
  methods: {
    showStatus(file) {
      return true;
    },
    statusText(file) {
      let status = file.status!==undefined ? file.status : this.message.extra.status;
      console.log("statusText", status);
      if(status == 1) return this.nls.chatYourfileStatus1;
      else if(status == 2) {
        if(file.progress === undefined) {
          return this.nls.chatYourfileStatus2
        } else {
          return `${this.nls.chatYourfileStatus2} ${file.progress}%`;
        }
      } 
      else if(status == 3) return this.nls.chatYourfileStatus3;
      else if(status == 4) return this.nls.chatYourfileStatus4;
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.your-chat-item {
  display: flex;
  box-sizing: border-box;
  margin: 20px;
}

.your-chat-status {
  display: flex;
  justify-content: space-between;
}

.your-chat-item-date {
  padding-left: 8px;
  font-size: 10px;
}

.your-chat-status-text {
  font-size: 10px;
  padding-right: 8px;
}

.your-chat-item-text {
  box-sizing: border-box;
  padding: 5px;
  border-radius: 5px;
  min-height: 40px;
  height: fit-content;
  border: @msg-border-width solid;
}

.your-chat-item-file {
  box-sizing: border-box;
  padding: 5px;
  border-radius: 5px;
  min-height: 40px;
  height: fit-content;
  border: @msg-border-width solid;
}

.your-chat-item-bubble {
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
  .your-chat-item-text {    
    border-color: @yours-border-color-light;
    background-color: @yours-backgroud-color-light;
    color: @msg-text-color;
  }
  .your-chat-item-file {    
    border-color: @yours-border-color-light;
    background-color: @yours-backgroud-color-light;
    color: @msg-text-color;
  }
  .your-chat-item-bubble {
    &::before {
      border-right-color: @yours-border-color-light;
    }
  }
}

.vscode-dark {
  .your-chat-item-text {
    border-color: @yours-border-color-dark;
    color: @msg-text-color-dark;
    background-color: @yours-backgroud-color-dark;
  }
  .your-chat-item-file {
    border-color: @yours-border-color-dark;
    color: @msg-text-color-dark;
    background-color: @yours-backgroud-color-dark;
  }
  .your-chat-item-bubble {
    &::before {
      border-right-color: @yours-border-color-dark;
    }
  }

}
</style>>

