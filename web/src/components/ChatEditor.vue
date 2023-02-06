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
    }
  },
  components: { 
    Editor, Toolbar, NButton 
  },
  setup(props, context) {
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
      editor.sendFileMethod = props.sendFileMethod;
      editor.sendFolderMethod = props.sendFolderMethod;
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
  // z-index: 999;
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
