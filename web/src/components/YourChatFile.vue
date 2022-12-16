<template>
  <div class="your-chat-file">
    <div v-if="hasText" :style="{ fontSize: textFontSize + 'px'}">{{text}}</div>
    <div class="your-chat-file-container">
      <div class="your-chat-file-container-file">
        <n-dialog-provider>
          <div
            class="your-chat-file-container-name"
            @click="handleFilesInfo"
          >
            <a>{{ fileName }}</a>
          </div>
        </n-dialog-provider>
        <div class="your-chat-file-container-size">{{ fileSize }}</div>
      </div>
      <div class="your-chat-file-container-icon">
        <n-icon size="50" class="your-chat-file-icon">
          <File />
        </n-icon>
      </div>
    </div>

    <div class="your-chat-file-status">
      <div
        v-if="message.extra.status == 1"
        class="your-chat-file-status-accept"
        @click="handleAccept"
      >
        {{nls.chatFileAccept}}
      </div>
      <div
        v-if="message.extra.status == 1"
        class="your-chat-file-status-reject"
        @click="handleReject"
      >
        {{nls.chatFileReject}}
      </div>
      <div v-if="displayStatus" class="your-chat-file-status-text">
        {{ statusText }}
      </div>
      <div
        v-if="message.extra.status == 3"
        class="your-chat-file-status-accept"
        @click="handleOpen"
      >
        {{nls.chatFileOpenFile}}
      </div>
      <div
        v-if="message.extra.status == 3"
        class="your-chat-file-status-reject"
        @click="handleOpenFolder"
      >
        {{nls.chatFileOpenFolder}}
      </div>
      <n-progress
        v-if="displayProgress"
        class="your-chat-file-status-progress"
        type="line"
        :height="10"
        :percentage="filePercentage"
        indicator-placement
        processing
      />
    </div>
    <n-modal v-model:show="showSelectFiles">
      <div>
        <n-data-table
          ref="table1"
          :columns="selectColumns"
          :data="tabelData"
          v-model:checked-row-keys="checkedRowKeys"
        />
      </div>
    </n-modal>
    <n-modal v-model:show="showFilesAccept">
      <div>
        <n-data-table
          ref="table2"
          :columns="acceptColumns"
          :data="acceptData"
          :row-key="(rowData)=>{return rowData.fileId}"
        />
      </div>
    </n-modal>
  </div>
</template>

<script>
import { NIcon, NProgress, NModal, NDataTable } from "naive-ui";
import { File } from "@vicons/tabler";
import ipc from "@/ipc";
import { formatString } from "@/utils/util";

const data = Array.apply(null, { length: 3 }).map((_, index) => ({
  name: `Edward King ${index}`,
  age: 32,
  address: `London, Park Lane no. ${index}`,
  key: index,
}));
export default {
  name: "YourChatFile",
  components: {
    NDataTable,
    NModal,
    NProgress,
    NIcon,
    File,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showSelectFiles: false,
      showFilesAccept: false,
      selectColumns: [
        {
          type: "selection"
        },
        {
          title: this.$store.state.nls.chatFileName,
          key: "name",
        },
        {
          title: this.$store.state.nls.chatFileSize,
          key: "size",
        }
      ],
      acceptColumns: [
        {
          title: this.$store.state.nls.chatFileName,
          key: "name",
        },
        {
          title: this.$store.state.nls.chatFileSize,
          key: "size",
        },
        {
          title: this.$store.state.nls.chatFileStatus,
          key: "accept"
        }
      ],
    };
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    hasText() {
      return this.message.extra.text !== undefined && this.message.extra.text !== "";
    },
    text() {
      return this.message.extra.text;
    },
    textFontSize() {
      return this.$store.state.textFontSize;
    },
    fileName() {
      let files = this.message.extra.files;
      let str = files[0].name;
      if(files.length > 1) {
        str = str + formatString(this.nls.chatFileMulti, files.length);
      }
      return str;
    },
    fileSize() {
      let files = this.message.extra.files;
      let size = 0;
      for (let file of files) {
        let fileSize = file.size;
        size += fileSize;
      }
      let str = this.formatSize(size);
      return str;
    },
    filePercentage() {
      return this.message.extra.progress;
    },
    statusText() {
      let text = "";
      switch (this.message.extra.status) {
        case 2:
          text = this.nls.chatYourfileStatus2;
          break;
        case 3:
          text = this.nls.chatYourfileStatus31;
          for(let file of this.message.extra.files) {
            if(!file.accept) {
              text = this.nls.chatYourfileStatus32;
              break;
            }
          }
          break;
        case 4:
          text = this.nls.chatYourfileStatus4;
          break;
      }
      return text;
    },
    displayProgress() {
      if (this.message.extra.status == 2) {
        return true;
      }
      return false;
    },
    displayStatus() {
      if (this.message.extra.status == 1 || this.message.extra.status == 3) {
        return false;
      }
      return true;
    },
    acceptData() {
      let files = this.message.extra.files;
      let data = []; 
      for(let file of files) {
        let fileSize = file.size;
        let str = this.formatSize(fileSize);
        data.push({
          key: file.fileId,
          fileId: file.fileId,
          name: file.name,
          size: str,
          accept: file.accept?this.nls.chatYourfileReceiveText:this.nls.chatYourfileNotReceiveText
        })
      }
      return data;
    },
    tabelData() {
      let files = this.message.extra.files;
      let data = []; 
      for(let file of files) {
        let fileSize =file.size;
        let str = this.formatSize(fileSize);
        data.push({
          key: file.fileId,
          fileId: file.fileId,
          name: file.name,
          size: str
        })
      }
      return data;
    },
    checkedRowKeys: {
      get() {
        let files = this.message.extra.files;
        let data = []; 
        for(let file of files) {
          if(file.accept) {
            data.push(file.fileId);
          }
        }
        return data;
      },
      set(keys) {
        console.log("checkedRowKeys", keys);
        this.$store.dispatch("updateSelectFiles", {
          files: this.message.extra.files,
          fileIds: keys
        });
      }
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
    },
    handleAccept() {
      console.log("handleAccept", this.message);
      let messageId = this.message.messageId;
      let remote = {
        feiq: this.$store.state.chatWith.feiq,
        address: this.$store.state.chatWith.address,
        port: this.$store.state.chatWith.port,
      };
      let extra = {
        fields: [
          {
            name: "status",
            value: 2,
          },
        ],
      };
      // this.$store.dispatch("updateFileMessage", {
      //   messageId,
      //   remote,
      //   extra,
      // });
      let packet = {
        packetId: this.message.packet.packetId,
      };
      let mainMsg = {
        info: {
          type: "recvFile",
        },
        remote,
        packet,
        extra: {
          files: this.message.extra.files,
        },
      };
      console.log("mainMsg", mainMsg);
      ipc.postMainMessage(mainMsg);
    },
    handleReject() {
      console.log("handleReject", this.message);
      let messageId = this.message.messageId;
      let remote = {
        address: this.$store.state.chatWith.address,
        port: this.$store.state.chatWith.port,
      };
      let extra = {
        fields: [
          {
            name: "status",
            value: 4,
          },
        ],
      };
      this.$store.dispatch("updateFileMessage", {
        messageId,
        remote,
        extra,
      });
      let packet = {
        packetId: this.message.packet.packetId,
      };
      ipc.postMainMessage({
        info: {
          type: "rejectFile",
        },
        remote,
        packet,
      });
    },
    handleOpen() {
      let filename = undefined;
      if(this.message.extra.files.length > 0) {
        filename = this.message.extra.files[0].name;
      }
      if(filename !== undefined) {
        ipc.openFile({
          location: this.message.extra.location,
          filename: filename,
        });
      }
    },
    handleOpenFolder() {
      let filename = undefined;
      if(this.message.extra.files.length > 0) {
        filename = this.message.extra.files[0].name;
      }
      if(filename !== undefined) {
        ipc.openFolder({
          location: this.message.extra.location,
          filename: filename
        });
      }
    },
    handleFilesInfo() {
      let status = this.message.extra.status;
      if(status == 1) {
        this.showSelectFiles = true;
      } else if(status == 3 || status == 4) {
        this.showFilesAccept = true;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.your-chat-file {
}

.your-chat-file-container {
  padding-left: 5px;
  padding-right: 5px;
  width: 100%;
  display: flex;
  align-content: center;
  justify-content: space-between;
}

.your-chat-file-container-file {
}

.your-chat-file-icon {
  color: darkgreen;
}

.your-chat-file-container-icon {
  color: rgb(128, 128, 128);
}

.your-chat-file-status-accept,
.your-chat-file-status-reject {
  border: 1px solid rgb(128, 128, 128);
  font-size: 12px;
  cursor: pointer;
}

.your-chat-file-status {
  width: 100%;
  display: flex;
}

.your-chat-file-status-text {
  width: fit-content;
  padding-right: 5px;
}

.your-chat-file-status-progress {
  flex: 1;
}

.your-chat-file-status-accept {
  margin-right: 5px;
}

.your-chat-file-container-name {
  font-size: 18px;
  cursor: pointer;
}

.your-chat-file-container-size {
  font-size: 12px;
  color: gray;
}

.your-chat-file-date {
  padding-top: 5px;
  font-size: 10px;
}
</style>