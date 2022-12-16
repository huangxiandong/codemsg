<template>
  <div class="your-chat-item">
    <div>
      <n-avatar round>{{initial}}</n-avatar>
    </div>
    <div class="your-chat-item-bubble"></div>
    <div v-if="message.info.type==='text'" class="your-chat-item-text">
      <chat-text-item :message="message"></chat-text-item>
    </div>
    <div v-if="message.info.type==='file'" class="your-chat-item-file">
      <chat-file-item :message="message"></chat-file-item>
    </div>
  </div>

</template>

<script>
import { NAvatar } from 'naive-ui';
import ChatTextItem from "@/components/ChatTextItem.vue"
import ChatFileItem from "@/components/ChatFileItem.vue"

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
    ChatTextItem,
    ChatFileItem
  },
  computed: {
    initial() {
      return this.$store.state.chatWith.nickname.charAt(0).toUpperCase();
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.your-chat-item {
  display: flex;
  box-sizing: border-box;
  margin: 10px;
  // max-width: 40%;
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

