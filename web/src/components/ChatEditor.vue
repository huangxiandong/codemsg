<template>
  <div class="chat-editor">
    <Toolbar
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        :mode="mode"
        class="chat-editor-toolbar"
    />
    <Editor
        :defaultConfig="editorConfig"
        :mode="mode"
        v-model="content"
        class="chat-editor-editor"
        @onCreated="handleCreated"
        @customPaste="customPaste"
        @keydown.enter="handleEnter($event)"
    />
    <n-button
      strong secondary
      type="primary"
      class="chat-send-button"
      @click="handleSend"
      attr-type="button"
      >{{ nls.chatSendButton }}</n-button
    >
  </div>
</template>

<script>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { NButton} from "naive-ui";
import { Boot } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

export default {
  props: {
    sendFileMethod: {
      type: Function,
      required: true
    },
    sendFolderMethod: {
      type: Function,
      required: true
    },
    sendTextMethod: {
      type: Function,
      required: true
    },
    fileTitle: String,
    folderTitle: String,
  },
  components: { 
    Editor, Toolbar, NButton 
  },
  setup(props, context) {
    class FileMenu {
      constructor() {
        this.title = props.fileTitle
        this.iconSvg = '<svg t="1675407453129" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2721" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M888.494817 313.882803l-198.019982-198.019982c-7.992021-7.992021-20.957311-7.992021-28.949332 0s-7.992021 20.947078 0 28.939099l163.084309 163.084309-215.794811 0L608.814999 42.686195c0-11.307533-9.15859-20.466124-20.466124-20.466124l-408.094512 0c-11.307533 0-20.466124 9.15859-20.466124 20.466124l0 938.62761c0 11.2973 9.15859 20.466124 20.466124 20.466124l693.76067 0c11.307533 0 20.466124-9.168824 20.466124-20.466124l0-652.961452C894.481158 322.92883 892.332215 317.720202 888.494817 313.882803zM853.54891 960.847681l-652.828422 0L200.720488 63.152319l367.162264 0 0 265.200034c0 11.307533 9.168824 20.466124 20.466124 20.466124l265.200034 0L853.54891 960.847681z" p-id="2722"></path></svg>'
        this.tag = 'button'
      }
      getValue(editor) {
        return ' hello '
      }
      isActive(editor) {
        return false // or true
      }
      isDisabled(editor) {
        return false // or true
      }
      exec(editor, value) {
        props.sendFileMethod();
      }
    }

    class FolderMenu {
      constructor() {
        this.title = props.folderTitle
        this.iconSvg = '<svg t="1675407786116" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5086" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M810.666667 85.333333a85.333333 85.333333 0 0 1 85.333333 85.333334v152.021333c36.821333 9.493333 64 42.88 64 82.645333v405.333334a128 128 0 0 1-128 128H192a128 128 0 0 1-128-128V298.666667a85.376 85.376 0 0 1 64-82.645334V170.666667a85.333333 85.333333 0 0 1 85.333333-85.333334h597.333334zM128.149333 296.170667L128 298.666667v512a64 64 0 0 0 60.245333 63.893333L192 874.666667h640a64 64 0 0 0 63.893333-60.245334L896 810.666667V405.333333a21.333333 21.333333 0 0 0-18.837333-21.184L874.666667 384H638.165333l-122.069333-101.717333a21.333333 21.333333 0 0 0-10.688-4.736l-2.986667-0.213334H149.333333a21.333333 21.333333 0 0 0-21.184 18.837334zM535.189333 213.333333l127.978667 106.666667H832V170.666667a21.333333 21.333333 0 0 0-18.837333-21.184L810.666667 149.333333H213.333333a21.333333 21.333333 0 0 0-21.184 18.837334L192 170.666667v42.666666h343.168z" fill="#333333" p-id="5087"></path></svg>'
        this.tag = 'button'
      }
      getValue(editor) {
        return ' hello '
      }
      isActive(editor) {
        return false // or true
      }
      isDisabled(editor) {
        return false // or true
      }
      exec(editor, value) {
        props.sendFolderMethod();
      }
    }
    const fileMenuConf = {
      key: 'fileMenu',
      factory() {
        return new FileMenu()
      }
    }
    const folderMenuConf = {
      key: 'folderMenu',
      factory() {
        return new FolderMenu()
      }
    }
    Boot.registerMenu(fileMenuConf)
    Boot.registerMenu(folderMenuConf)
    // 编辑器实例，必须用 shallowRef，重要！
    const editorRef = shallowRef()
    // 内容 HTML
    const content = ref('')
    
    const toolbarConfig = {
      toolbarKeys: [
          // 菜单 key
          'emotion'
      ],
      insertKeys: {
        index: 1, // 插入的位置，基于当前的 toolbarKeys
        keys: ['fileMenu', 'folderMenu']
      }
    }
    const editorConfig = {
      placeholder: 'New Message', 
    }
    // 组件销毁时，也及时销毁编辑器，重要！
    onBeforeUnmount(() => {
        const editor = editorRef.value
        if (editor == null) return
        editor.destroy()
    })
    // 编辑器回调函数
    const handleCreated = (editor) => {
      console.log('created', editor);
      console.log(editor.getMenuConfig('emotion'));
      editorRef.value = editor // 记录 editor 实例，重要！
    }    
    const customPaste = (editor, event, callback) => {
        console.log('ClipboardEvent 粘贴事件对象', event)
        // 自定义插入内容
        // editor.insertText('xxx')
        // 返回值（注意，vue 事件的返回值，不能用 return）
        callback(true) // 返回 true ，继续默认的粘贴行为
    }
    const handleEnter = (event) => {
      if (event.ctrlKey && event.keyCode === 13) {
        
      } else if(event.keyCode === 13) {
        event.preventDefault();
        const text = content.value;
        props.sendTextMethod(text);
        const editor = editorRef.value;
        editor.clear();
        return false;
      }
    }
    const handleSend =() => {
      const text = content.value;
      props.sendTextMethod(text);
      const editor = editorRef.value;
      editor.clear();
    }
    return {
      editorRef,
      mode: 'simple',
      content,
      toolbarConfig,
      editorConfig,
      handleCreated,
      customPaste,
      handleEnter,
      handleSend
    };
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
  }
}
</script>

<style lang="less">
.chat-editor {
  display: flex;
  flex-direction: column;
  position: relative;
}

.chat-editor-toolbar {
  border-bottom: 1px solid gray
}

.chat-editor-editor {
  flex: 1;
  overflow-y: hidden;
}

.chat-send-button {
  position: absolute;
  bottom: 10px;
  right: 30px;
  z-index: 999;
}

.w-e-text-container p {
  line-height: 1;
  margin: 0 0;
}

.w-e-text-placeholder {
  top: 12px;
}

.w-e-bar svg {
  height: 18px;
  width: 18px;
}

.w-e-panel-content-emotion {
  width: 450px;
}

.vscode-dark {
  .w-e-bar {
    background-color: unset;
  }
  .w-e-text-container {
    background-color: unset;
  }
  .w-e-text-container p {
    color: rgba(255, 255, 255, 0.82);
  }
  .w-e-text-placeholder {
    color: rgba(255, 255, 255, 0.38);
  }

  --w-e-toolbar-color: rgba(255, 255, 255, 0.82);;
  --w-e-toolbar-active-bg-color: rgb(66,66,66);
  // --w-e-toolbar-bg-color: rgba(55, 55, 55, 1);
}
.vscode-light{
  .w-e-bar {
    background-color: unset;
  }
  .w-e-text-container {
    background-color: unset;
  }
  .w-e-text-container p {
    color: rgba(51, 54, 57, 1);
  }
  .w-e-text-placeholder {
    color: rgba(194, 194, 194, 1);
  }

  --w-e-toolbar-color: rgba(51, 54, 57, 1);;
  --w-e-toolbar-active-bg-color: lightgray;
  // --w-e-toolbar-bg-color: rgba(240, 240, 240, 1);
}
</style>
