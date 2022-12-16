<template>
  <my-chat-item v-if="message.info.mine" :message="message"></my-chat-item>
  <your-chat-item v-else :message="message"></your-chat-item>
</template>

<script>
import { defineComponent } from 'vue';
import MyChatItem from "@/components/MyChatItem.vue";
import YourChatItem from '@/components/YourChatItem.vue';

export default defineComponent({
  name: "ChatItem",
  props: {
    message: {
      type: Object,
      required: true
    },
  },
  components: {
    MyChatItem,
    YourChatItem
  }
})
</script>
