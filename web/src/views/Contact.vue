<template>
  <div class="contact">
    <div class="contact-master" :style="{ width: width + 'px' }">
      <div class="contact-master-toolbar">
        <n-icon size="24" class="contact-master-toolbar-icon" @click="handleRefresh">
          <Refresh/>
        </n-icon>
        <div class="contact-master-toolbar-search">
          <n-input size="small" clearable v-model:value="filter" :placeholder="nls.contactSearchPlaceholder" />
        </div>
      </div>
      <n-scrollbar class="contact-master-group">
        <!-- <n-scrollbar class="contact-master-scroll"> -->
        <n-collapse v-model:expanded-names="expandedNames">
          <n-collapse-item :title="nls.contactFavoriteTitle" name="favorite">
            <template #arrow>
              <n-icon><IosStar /></n-icon>
            </template>
            <div class="contact-group">
              <contact-item v-for="item in favoriteContacts" :contact="item"></contact-item>
            </div>
          </n-collapse-item>
          <n-collapse-item v-for="group in groups" key=group :title="group" :name="group">
            <div class="contact-group">
              <contact-item v-for="item in getContacts(group)" :contact="item"></contact-item>
            </div>
          </n-collapse-item>
        </n-collapse>
        </n-scrollbar>
      <!-- </div> -->
    </div>
    <div id="contact-resizer" class="m-resizer"></div>
    <div class="contact-detail">
      <div class="contact-detail-contact" v-if="contactSelected">
        <n-avatar round>{{capital}}</n-avatar>
      </div>  
      <div class="contact-detail-contact" v-if="contactSelected">
        {{nls.contactDetailUser}}: {{user}}
      </div>  
      <div class="contact-detail-contact" v-if="contactSelected">
        {{nls.contactDetailHost}}: {{host}}
      </div>  
      <div class="contact-detail-contact" v-if="contactSelected">
        {{nls.contactDetailNickname}}: {{nickname}}
      </div>  
      <div class="contact-detail-contact" v-if="contactSelected">
        {{nls.contactDetailGroup}}: {{group}}
      </div>  
      <div class="contact-detail-contact" v-if="contactSelected">
        {{nls.contactDetailAddress}}: {{address}}
      </div>  
      <div class="contact-detail-button" v-if="contactSelected">
        <n-button type="info" @click="sendMessage">{{nls.contactDetailSendText}}</n-button>
      </div>
    </div>
  </div>
</template>

<script>
import { NCollapse, NCollapseItem, NAvatar, NButton, NIcon, NInput, NScrollbar } from 'naive-ui'
import { Refresh } from '@vicons/tabler'
import { IosStar } from '@vicons/ionicons4'
import ContactItem from "@/components/ContactItem.vue";
import ipc from "@/ipc";

export default {
  name: "Contact",
  components: {
    NCollapse,
    NCollapseItem,
    NAvatar,
    NButton,
    NIcon,
    NInput,
    NScrollbar,
    Refresh,
    IosStar,
    ContactItem
  },
  data() {
    return {
      defaultExpandedNames: ["favorite"],
      expandedNames: ["favorite"]
    };
  },
  computed: {
    width() {
      return this.$store.state.asideWidth;
    },
    nls() {
      return this.$store.state.nls;
    },
    filteredContacts() {
      let filter = this.filter;
      let cs = [];
      let contacts = this.$store.state.contacts;
      if(filter !== "") {
        this.expandedNames.splice(1, this.expandedNames.length-1);
      }
      for(let contact of contacts) {
        let nickname = contact.nickname;
        if(filter === "") {
          cs.push(contact);
        } else {
          if(nickname.indexOf(filter) != -1) {
            cs.push(contact);
            let g = (contact.group === undefined || contact.group === "") ? this.nls.contactGroupOther : contact.group;
            this.expandedNames.push(g)
          }
        }
      }
      console.log("expandedNames", this.expandedNames);
      return cs;
    },
    groups() {
      let gs = [];
      let contacts = this.filteredContacts;
      for(let contact of contacts) {
        let g = (contact.group === undefined || contact.group === "") ? this.nls.contactGroupOther : contact.group;
        if(gs.indexOf(g) == -1) {
          gs.push(g);
        }
      }
      // for(let i=0; i<30; i++) {
      //   gs.push("group" + i);
      // }
      return gs;
    },
    contactSelected() {
      return this.$store.state.selectContact !== undefined;
    },
    user() {
      return this.$store.state.selectContact.user;
    },
    host() {
      return this.$store.state.selectContact.host;
    },
    nickname() {
      let nickname = this.$store.state.selectContact.nickname;
      return (nickname === undefined || nickname === "") ? "" : nickname;
    },
    group() {
      let group = this.$store.state.selectContact.group;
      return (group === undefined || group === "") ? "" : group;
    },
    address() {
      return this.$store.state.selectContact.address + ":" + this.$store.state.selectContact.port;
    },
    capital() {
      let nickname = this.$store.state.selectContact.nickname;
      return nickname.charAt(0).toUpperCase();
    },
    filter: {
      get() {
        return this.$store.state.contactFilter;
      },
      set(value) {
        this.$store.dispatch("setContactFilter", value);
      }
    },
    favoriteContacts() {
      return this.$store.state.favoriteContacts;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.dragControllerDiv();
    });
  },
  methods: {
    getContacts(group) {
      let items = [];
      let contacts = this.$store.state.contacts;
      for(let contact of contacts) {
        let g = (contact.group === undefined || contact.group === "") ? this.nls.contactGroupOther : contact.group;
        if(group === g) {
          items.push(contact);
        }
      }
      return items;
    },
    sendMessage() {
      this.$store.dispatch("addConversation");
      this.$store.dispatch("setCurrentView", "conversation");
      this.$router.push("/conversation");
    },
    handleRefresh() {
      this.expandedNames.splice(1, this.expandedNames.length-1);
      this.$store.dispatch("clearContact");
      ipc.entry();
    },
    dragControllerDiv() {
      // 保留this引用
      let me = this;
      let resize = document.getElementById("contact-resizer");
      resize.onmousedown = function(e) {
        // 颜色改变提醒
        let startX = e.clientX;
        resize.left = resize.offsetLeft;
        document.onmousemove = function(e) {
          // 计算并应用位移量
          let endX = e.clientX;
          let moveLen = endX - startX;
          startX = endX;
          let newWidth =  me.width + moveLen;
          me.$store.dispatch("setAsideWidth", newWidth);
        };
        document.onmouseup = function() {
          // 颜色恢复
          document.onmousemove = null;
          document.onmouseup = null;
        };
        return false;
      };
    } 
  }
}

</script>
<style lang="less" scoped>
.contact {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;  
  .m-resizer {
    width: 2px;
    border-top: 1px solid gray;
    border-bottom: 1px solid gray;
    cursor: ew-resize;
    background: var(--vscode-scrollbarSlider-background);
    &:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }
  }  
}

.contact-master {
  height: 100%;
  box-sizing: border-box;
  border-width: 1px 0 1px 1px;
  border-color: gray;
  border-style: solid;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.contact-master-toolbar {
  width: 100%;
  border-bottom: 1px solid gray;
  padding-bottom: 5px;
  display: flex;
  align-items: center;
}

.contact-master-toolbar-icon {
  padding-right: 5px;
  color: gray;
  &:hover {
    color: green;
  }
}

.contact-master-toolbar-search {
  flex: 1;
}

.contact-master-group {
  padding-top: 5px;
  flex: 1;
  // height: 80%;
  // overflow: scroll;
  display: flex;
  .contact-master-scroll {
    flex: 1;
  }
}

.contact-group {
  margin-left: 20px;
  // overflow: scroll;
}

.contact-detail {
  flex: 1;
  border-width: 1px 1px 1px 0;
  border-color: gray;
  border-style: solid;
  padding-top: 50px;
}

.contact-detail-contact {
  width: 100%;
  // font-size: 18px;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: center;
}

.contact-detail-button {
  width: 100%;
  text-align: center;
  margin-top: 20px;
}
</style>