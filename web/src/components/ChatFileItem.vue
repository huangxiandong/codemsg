<template>
  <div class="chat-file-item">
    <my-chat-file v-if="message.info.mine" :message="message"></my-chat-file>
    <your-chat-file v-else :message="message"></your-chat-file>
    <div class="chat-file-item-date">{{ message.info.date }}</div>
  </div>
</template>

<script>
import { NIcon } from 'naive-ui'
import { File } from '@vicons/tabler';
import MyChatFile from '@/components/MyChatFile.vue';
import YourChatFile from '@/components/YourChatFile.vue';

export default {
  name: "ChatFileItem",
  components: {
    NIcon,
    File,
    MyChatFile,
    YourChatFile
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  mounted() {
    console.log("ChatFileItem", this.message);
  }
};
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-file-item {
  padding-left: 5px;
  padding-right: 5px;
}

.chat-file-item-date {
  padding-top: 5px;
  font-size: 10px;
}
</style>