<template>
  <template v-if="message.info.type==='text'">
    <div class="my-chat-item">
      <div>
        <my-chat-text :message="message" />
        <div class="my-chat-item-date">{{message.info.date}}</div>
      </div>
      <div>
        <n-avatar round>{{initial}}</n-avatar>
      </div>
    </div>
  </template>
  <template v-if="message.info.type==='file'">
    <template v-for="file in message.extra.files">
      <div class="my-chat-item">
        <div>
          <my-chat-file v-if="message.info.type==='file'" :file="file" />
          <div class="my-chat-status">
            <div class="my-chat-item-date">{{message.info.date}}</div>
            <div v-if="showStatus(file)" class="my-chat-status-text">{{ statusText(file) }}</div>
          </div>
        </div>
        <div>
          <n-avatar round>{{initial}}</n-avatar>
        </div>
      </div>
    </template>
  </template>
</template>

<script>
import { NAvatar } from 'naive-ui';
import MyChatText from "@/components/MyChatText.vue"
import MyChatFile from "@/components/MyChatFile.vue"
import { isImage, isAudio, isVideo } from "@/utils/util";

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
    MyChatText,
    MyChatFile
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    initial() {
      return this.$store.state.nickname.charAt(0).toUpperCase();
    }
  },
  methods: {
    showStatus(file) {
      return true;
    },
    statusText(file) {
      let status = file.status!==undefined ? file.status : this.message.extra.status;
      console.log("statusText", status);
      if(status == 1) return this.nls.chatMyfileStatus1;
      else if(status == 2) {
        return this.nls.chatMyfileStatus2 + file.progress === undefined ? "" : (" " + file.progress + "%");
      }
      else if(status == 3) return this.nls.chatMyfileStatus3;
      else if(status == 4) return this.nls.chatMyfileStatus4;
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.my-chat-item {
  display: flex;
  box-sizing: border-box;
  margin: 20px;
  justify-content: flex-end;
  text-align: right;
  // max-width: 40%;
}

.my-chat-status {
  display: flex;
  justify-content: space-between;
}

.my-chat-item-date {
  padding-right: 8px;
  font-size: 10px;
}

.my-chat-status-text {
  font-size: 10px;
  padding-right: 8px;
}

</style>>

