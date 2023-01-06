<template>
  <div class="your-chat-text">
    <div class="your-chat-text-bubble"></div>
    <div class="your-chat-text-content">
      <chat-text-item :message="message" />
    </div>
  </div>
</template>

<script>
import ChatTextItem from "@/components/ChatTextItem.vue"

export default {
  name: "YourChatText",
  props: {
    message: {
      type: Object,
      required: true
    },
  },
  components: {
    ChatTextItem
  },
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.your-chat-text {
  display: flex;
}

.your-chat-text-content {
  display: flex;
  padding-left: 5px;
  padding-right: 5px;
  border-radius: 5px;
  box-sizing: border-box;
  min-height: 40px;
  height: fit-content;
  border: 1px solid;
}

.your-chat-text-bubble {
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
  .your-chat-text-content {
    border-color: @yours-border-color-light;
    background-color: @yours-backgroud-color-light;
    color: @msg-text-color;
  }

  .your-chat-text-bubble {
    &::before {
      border-right-color: @yours-border-color-light;
    }
  }
}

.vscode-dark {
  .your-chat-text-content {
    border-color: @yours-border-color-dark;    
    color: @msg-text-color-dark;
    background-color: @yours-backgroud-color-dark;
  }

  .your-chat-text-bubble {
    &::before {
      border-right-color: @yours-border-color-dark;
    }
  }
}
</style>