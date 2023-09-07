<template>
  <div class="setting">
    <n-tabs type="segment">
      <n-tab-pane name="basic" :tab="nls.settingBasicName">
        <n-form :label-width="250" label-placement="left">
          <!-- <n-form-item :label="nls.settingBasicMode">
            <n-select v-model:value="mode" :options="modes" />
          </n-form-item> -->
          <n-form-item :label="nls.settingBasicNickname">
            <n-input v-model:value="nickname" :placeholder="nls.settingBasicNickname" />
          </n-form-item>
          <n-form-item :label="nls.settingBasicGroup">
            <n-input v-model:value="group" :placeholder="nls.settingBasicGroup" />
          </n-form-item>
          <!-- <n-form-item :label="nls.settingBasicHome">
            <n-input v-model:value="filelocation" :placeholder="nls.settingBasicHome" />
          </n-form-item> -->
          <n-form-item :label="nls.settingBasicHistory">
            <n-input-number v-model:value="hisdays" />
          </n-form-item>
          <n-form-item :label="nls.settingBasicUseVSCode">
            <n-switch v-model:value="useVscodeMsg" />
          </n-form-item>
        </n-form>
        <div class="setting-button-container">
          <n-button type="primary" @click="handleApply" attr-type="button">{{nls.settingBasicButtonApply}}</n-button>
        </div>
      </n-tab-pane>
      <n-tab-pane name="network" :tab="nls.settingNetworkName">
        <n-form :label-width="250" label-placement="left">
          <n-form-item label="IP">
            <n-select v-model:value="ip" :options="ipList()" @update-value="changeIp" />
          </n-form-item>
          <n-form-item :label="nls.settingNetworkIP">
            <div class="network-container">
              <div class="network-buttons">
                <n-button @click="handleAdd">{{nls.settingNetwrokAdd}}</n-button>
                <n-button @click="handleRemove">{{nls.settingNetwrokRemove}}</n-button>
              </div>
              <div class="network-list">
                <n-list bordered>
                  <n-list-item v-for="item in networkList">
                    <div class="network-item" :class="{ active: isActive(item) }" @click="currentItem=item">{{item}}</div>
                  </n-list-item>
                </n-list>
              </div>
            </div>
          </n-form-item>
        </n-form>
        <div class="setting-button-container">
          <n-button type="primary" @click="applyNetwork" attr-type="button">{{nls.settingBasicButtonApply}}</n-button>
        </div>
        <n-modal
          v-model:show="showModal"
          :mask-closable="false"
          preset="dialog"
          :title="nls.settingNetworkDialogTitle"
          :content="nls.settingNetworkDialogTitle"
          :positive-text="nls.settingNetworkDialogTitle"
          @positive-click="onPositiveClick"
          @negative-click="onNegativeClick"
          :negative-text="nls.settingNetworkNegativeText"
        >
          <n-input v-model:value="textNetwork" :placeholder="nls.settingNetworkDialogInputTip" />
        </n-modal>
      </n-tab-pane>
      <n-tab-pane name="encrypt" :tab="nls.settingEncryptName">
        <n-form :label-width="250" label-placement="left">
           <n-form-item :label="nls.settingEncryptEnabled">
            <n-switch v-model:value="encryption" />
          </n-form-item>
        </n-form>        
        <div class="setting-button-container">
          <n-button type="primary" @click="applyEncrypt" attr-type="button">{{nls.settingBasicButtonApply}}</n-button>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script>
import { NForm, NFormItem, NInput, NButton, NTabs, NTabPane, NList, NListItem, NModal, NSelect, NSwitch, NInputNumber } from 'naive-ui'

import {ipc} from "@/vscode";

export default {
  name: "Setting",
  components: {
    NForm,
    NFormItem,
    NInput,
    NButton,
    NTabs,
    NTabPane,
    NList,
    NListItem,
    NModal,
    NSelect,
    NSwitch,
    NInputNumber
  },
  data() {
    return {
      mode: this.$store.state.mode,
      nickname: this.$store.state.nickname,
      group: this.$store.state.group,
      filelocation: this.$store.state.filelocation,
      textNetwork:"",
      showModal: false,
      networkList: this.$store.state.networkList,
      useVscodeMsg: this.$store.state.useVscodeMsg,
      hisdays: this.$store.state.hisdays,
      currentItem: undefined,
      encryption: this.$store.state.encryption,
      ip: this.$store.state.ip,
      modes: [
        {
          label: 'FeiQ',
          value: 'FeiQ'
        },
         {
          label: 'IPMsg',
          value: 'IPMsg'
        }
      ]
    }
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    }
  },
  methods: {
    ipList() {
      let ips = this.$store.state.ipList;
      if(ips === undefined) {
        return;
      }
      let all_ip = [];
      for(let ip of ips) {
        all_ip.push({
          label: `${ip.address} (${ip.name})`,
          value: ip.address
        })
      }
      return all_ip;
    },
    isActive(item) {
      if(item === this.currentItem) {
        return true;
      }
      return false;
    },
    handleApply() {
      this.$store.dispatch('setMode', this.mode);
      this.$store.dispatch('setNickname', this.nickname);
      this.$store.dispatch('setGroup', this.group);
      this.$store.dispatch('setFilelocation', this.filelocation);
      this.$store.dispatch('setUseVscodeMsg', this.useVscodeMsg);
      this.$store.dispatch('setHisdays', this.hisdays);

      this.$router.push("/conversation");
      ipc.setting(this.mode, this.nickname, this.group, this.filelocation);
      ipc.setUseVscodeMsg(this.useVscodeMsg);
      ipc.setHisdays(this.hisdays);
      this.$store.dispatch('setCurrentView', "conversation");
    },
    applyNetwork() {
      console.log("applyNetwork", this.networkList);
      this.$store.dispatch('setNetworkList', this.networkList);
      ipc.setNetworkList(this.networkList);
    },
    applyEncrypt() {
      this.$store.dispatch('setEncryption', this.encryption);
      ipc.setEncryption(this.encryption);
    },
    handleAdd() {
      this.showModal = true;
    },
    handleRemove() {
      if(this.currentItem != undefined) {
        let index = this.networkList.indexOf(this.currentItem);
        if(index != -1) {
          this.networkList.splice(index, 1);
        }
      }
      console.log("handleRemove", this.networkList);
    },
    onPositiveClick() {
      this.networkList.push(this.textNetwork);     
    },
    onNegativeClick() {

    },
    changeIp(value) {
      this.$store.commit('setIp', value);
      ipc.changeIp(value);
      this.$store.dispatch("clearContact");
      ipc.entry();
    }
  }
}
</script>
<style lang="less" scoped>
.setting {
  box-sizing: border-box;
  border: 1px solid gray;
  padding: 10px;
  width: 100%;
  height: 100%;
  padding: 20px;
}
.setting-button-container {
  width: 100%;
  text-align: center;
  margin-top: 20px;
}
.network-container {
  border-width: 1px;
  border-style: solid;
  // padding: 30px;
  display: flex;
  flex-direction: column;
  width: 100%;
}
.network-list {
  padding-left: 20px;
  padding-right: 20px;
}
.network-buttons {
  padding-left: 10px;
  padding-top: 30px;
  display: flex;
  justify-content: center;
}

.vscode-light {
  .network-item {
    &.active {
      background-color: rgb(240, 240, 240);
    }
  }
}

.vscode-dark {
  .network-item {
    &.active {
      background-color: rgb(55, 55, 55);
    }
  }
}

.setting-ip {
  display: flex;
  justify-content: space-between;
}
</style>