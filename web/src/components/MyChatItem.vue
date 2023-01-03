<template>
  <div class="my-chat-item">
    <div v-if="message.info.type==='text'" class="my-chat-item-text">
      <chat-text-item :message="message"></chat-text-item>
    </div>
    <div v-if="message.info.type==='file'" class="my-chat-item-file">
      <chat-file-item :message="message"></chat-file-item>
      <!-- <chat-image-item :message="message" /> -->
      <!-- <chat-audio-item :message="message" /> -->
    </div>
    <div class="my-chat-item-bubble"></div>
    <div>
      <n-avatar round>{{initial}}</n-avatar>
    </div>
  </div>
</template>

<script>
import { NAvatar } from 'naive-ui';
import ChatTextItem from "@/components/ChatTextItem.vue"
import ChatFileItem from "@/components/ChatFileItem.vue"
import ChatImageItem from "@/components/ChatImageItem.vue"
import ChatAudioItem from "@/components/ChatAudioItem.vue"

export default {
  name: "MyChatItem",
  props: {
    message: {
      type: Object,
      required: true
    },
  },
  components: {
    NAvatar,
    ChatTextItem,
    ChatFileItem,
    ChatImageItem,
    ChatAudioItem
  },
  computed: {
    initial() {
      return this.$store.state.nickname.charAt(0).toUpperCase();
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.my-chat-item {
  display: flex;
  box-sizing: border-box;
  margin: 10px;
  justify-content: flex-end;
  text-align: right;
  // max-width: 40%;
}

.my-chat-item-text {
  box-sizing: border-box;
  padding: 5px;
  border-radius: 5px;
  min-height: 40px;
  height: fit-content;
  border: @msg-border-width solid;
}

.my-chat-item-file {
  box-sizing: border-box;
  padding: 5px;
  border-radius: 5px;
  min-height: 40px;
  height: fit-content;
  border: @msg-border-width solid;  
  text-align: left;
}

.my-chat-item-bubble {
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
  .my-chat-item-text {
    border-color: @mine-border-color-light;
    background-color: @mine-backgroud-color-light;
    color: @msg-text-color;
  }

  .my-chat-item-file {
    border-color: @mine-border-color-light;
    background-color: @yours-backgroud-color-light;
    color: @msg-text-color;
  }

  .my-chat-item-bubble {
    &::after {
      border-left-color: @mine-border-color-light;
    }
  }
}

.vscode-dark {
  .my-chat-item-text {
    border-color: @mine-border-color-dark;    
    color: @msg-text-color;
    background-color: @mine-backgroud-color-dark;
  }

  .my-chat-item-file {
    border-color: @mine-border-color-dark;    
    color: @msg-text-color;
    background-color: @mine-backgroud-color-dark;
  }

  .my-chat-item-bubble {
    &::after {
      border-left-color: @mine-border-color-dark;
    }
  }
}
</style>>

