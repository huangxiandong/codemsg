<template>
  <div class="my-chat-file">
    <div class="my-chat-file-container">
      <div class="my-chat-file-container-file">
        <div class="my-chat-file-container-name" @click="handleFilesInfo">
         <a>{{fileName}}</a>
        </div>
        <div class="my-chat-file-container-size">{{fileSize}}</div>
      </div>
      <div class="my-chat-file-container-icon">
        <n-icon size="50">
          <File/>
        </n-icon>
      </div>
    </div>
    <div class="my-chat-file-status">
      <div class="my-chat-file-status-text">{{statusText}}</div>
      <n-progress v-if="displayProgress"
      class="my-chat-file-status-progress"
        type="line"
        :height="10"
        :percentage="filePercentage"
        indicator-placement
        processing
      />
    </div>
    <n-modal v-model:show="showFilesAccept">
      <div>
        <n-data-table
          ref="table"
          :columns="acceptColumns"
          :data="acceptData"
          :row-key="(rowData)=>{return rowData.fileId}"
        />
      </div>
    </n-modal>
  </div>
</template>

<script>
import { NIcon, NProgress, NModal, NDataTable } from 'naive-ui'
import { File } from '@vicons/tabler';
import { formatString } from "@/utils/util";

export default {
  name: "MyChatFile",
  components: {
    NDataTable,
    NModal,
    NProgress,
    NIcon,
    File
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showFilesAccept: false,
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
      for(let file of files) {
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
      switch(this.message.extra.status) {
        case 1:
          text = this.nls.chatMyfileStatus1;
          break;
        case 2:
          text = this.nls.chatMyfileStatus2;
          break;
        case 3:
          text = this.nls.chatMyfileStatus31;
          for(let file of this.message.extra.files) {
            if(!file.accept) {
              text = this.nls.chatMyfileStatus32;
              break;
            }
          }
          break;
        case 4:
          text = this.nls.chatMyfileStatus4;
          break;
      }
      return text;
    },
    displayProgress() {
      if(this.message.extra.status == 1 || this.message.extra.status == 2) {
        return true;
      }
      return false;
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
          accept: file.accept ? this.nls.chatMyfileSentText : this.nls.chatMyfileNotSentText
        })
      }
      return data;
    },
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
    handleFilesInfo() {
      let status = this.message.extra.status;
      if(status != 2) {
        this.showFilesAccept = true;
      }
    }
  }
};
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.my-chat-file {

}

.my-chat-file-container {
  padding-left: 5px;
  padding-right: 5px;
  width: fit-content;
  display: flex;
  align-content: center;
}

.my-chat-file-container-file {
  
}

.my-chat-file-icon {
  color: darkgreen;
}

.my-chat-file-container-icon {
  color: rgb(128, 128, 128)
}

.my-chat-file-status {
  width: 100%;
  display: flex;
}

.my-chat-file-status-text {
  width: fit-content;
  padding-right: 5px;
}

.my-chat-file-status-progress {
  flex: 1
}

.my-chat-file-buttons {
  display: flex;
}

.my-chat-file-buttons-accept,.my-chat-file-buttons-reject {
  border: 1px solid rgb(128, 128, 128);
  font-size: 12px;
}

.my-chat-file-buttons-accept {
  margin-right: 5px;
}

.my-chat-file-container-name {
  font-size: 18px;
  cursor: pointer;
}

.my-chat-file-container-size {
  font-size: 12px;
  color: gray
}

.my-chat-file-date {
  padding-top: 5px;
  font-size: 10px;
}
</style>