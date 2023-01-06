<template>
  <div class="my-chat-text">
    <div class="my-chat-text-content">
      <chat-text-item :message="message" />
    </div>
    <div class="my-chat-text-bubble"></div>
  </div>
</template>

<script>
import ChatTextItem from "@/components/ChatTextItem.vue"

export default {
  name: "MyChatText",
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

.my-chat-text {
  display: flex;
  justify-content: flex-end;
}

.my-chat-text-content {
  display: flex;
  padding-left: 5px;
  padding-right: 5px;
  border-radius: 5px;
  box-sizing: border-box;
  min-height: 40px;
  height: fit-content;
  border: 1px solid;
}

.my-chat-text-bubble {
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
  .my-chat-text-content {
    border-color: @mine-border-color-light;
    background-color: @mine-backgroud-color-light;
    color: @msg-text-color;
  }

  .my-chat-text-bubble {
    &::after {
      border-left-color: @mine-border-color-light;
    }
  }
}

.vscode-dark {
  .my-chat-text-content {
    border-color: @mine-border-color-dark;    
    color: @msg-text-color;
    background-color: @mine-backgroud-color-dark;
  }

  .my-chat-text-bubble {
    &::after {
      border-left-color: @mine-border-color-dark;
    }
  }
}
</style>