<template>
  <div class="toolbar">
    <div class="toolbar-avatar" @dblclick="refresh" @click="showPopover=false;">
      <n-avatar>{{capital}}</n-avatar>
    </div>
    <div class="toolbar-container">
      <n-icon class= "toolbar-item" :class="{active: currentView==='conversation'}" size="36" @click="handleClick('conversation')">
        <message-circle />
      </n-icon>
      <n-icon class= "toolbar-item" :class="{active: currentView==='contact'}" size="36" @click="handleClick('contact')">
        <ios-contact />
      </n-icon>
      <n-icon class= "toolbar-item" :class="{active: currentView==='setting'}" size="36" @click="handleClick('setting')">
        <ios-settings />
      </n-icon>
      <n-icon class= "toolbar-item" :class="{active: currentView==='video'}" size="36" @click="handleClick('video')">
        <ios-settings />
      </n-icon>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'vuex'
import { NAvatar, NIcon, NTooltip } from 'naive-ui'
import { MessageCircle } from '@vicons/tabler'
import { IosContact, IosSettings } from '@vicons/ionicons4'

export default defineComponent({
  name: "Toolbar",
  components: {
    NAvatar,
    NIcon,
    NTooltip,
    MessageCircle,
    IosContact,
    IosSettings
  },
  data() {
    return {
      showPopover: true
    }
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    capital() {
      let nickname = this.$store.state.nickname;
      if(nickname === undefined || nickname === "") {
        nickname = "N";
      }
      return nickname.charAt(0).toUpperCase();
    },
    ...mapState([
      "currentView"
    ])
  },
  methods: {
    handleClick(name) {
      this.setCurrentView(name);
      if(name==="conversation") {
        this.$router.push("/conversation");
      } else if(name==="contact") {
        this.$router.push("/contact");
      } else if(name==="setting") {
        this.$router.push("/setting");
      } else if(name==="video") {
        this.$router.push("/video");
      }
    },
    ...mapActions([
      "setCurrentView"
    ])
  }
})
</script>

<style lang="less" scoped>
.toolbar {
  width: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-width: 1px 0 1px 1px;
  border-color: gray;
  border-style: solid;
}

.toolbar-avatar {
  padding-top: 30px;
  padding-bottom: 10px;
  cursor: pointer;
}

.toolbar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 5px;
}

.toolbar-item {
  padding-bottom: 20px;
  color: gray;
  &:hover {
    color: green;
  }
  &.active {
    color: green;
  }
}
</style>