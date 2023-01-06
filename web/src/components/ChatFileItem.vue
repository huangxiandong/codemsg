<template>
  <div class="chat-file-item">
    <div>
      <div class="chat-file-item-content-name" @click="handleFilesInfo">
        {{ file.name }}
      </div>
      <div class="chat-file-item-content-size">{{fileSize}}</div>
    </div>
    <div class="chat-file-item-container-icon">
      <n-icon size="50">
        <File/>
      </n-icon>
    </div>
  </div>
</template>

<script>
import { NIcon } from 'naive-ui'
import { File } from '@vicons/tabler';

export default {
  name: "ChatFileItem",
  components: {
    NIcon,
    File
  },
  props: {
    file: {
      type: Object,
      required: true,
    },
  },
  computed: {
    fileSize() {
      let size = this.file.size;
      let str = this.formatSize(size);
      return str;
    }
  },
  methods: {
    formatSize(size) {
      let str = "";
      if (size < 1024) {
        str = size + "B";
      } else if (size < 1024 * 1024) {
        str = Math.round(size / 1024) + "KB";
      } else if (size < 1024 * 1024 * 1024) {
        str = Math.round(size / (1024 * 1024)) + "MB";
      } else if (size < 1024 * 1024 * 1024 * 1024) {
        str = Math.round(size / (1024 * 1024 * 1024)) + "GB";
      }
      console.log("formatSize", str);
      return str;
    }
  }
};
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-file-item {
  display: flex;
  justify-content: space-between;
  width: 250px;
}

.chat-file-item-content-name {
  font-size: 14px;
  word-break: break-all;
}

.chat-file-item-content-size {
  font-size: 12px;
  color: gray
}

.chat-file-item-container-icon {
  color: rgb(128, 128, 128)
}

</style>