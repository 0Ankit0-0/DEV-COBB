const languageClients = new Map();


export const registerLanguages = (monaco) => {
  console.log("Registering languages for Monaco editor");
  
  if (monaco) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.registerFoldingRangeProvider('javascript', {
      provideFoldingRanges: function(model, context, token) {
        const ranges = [];
        return ranges;
      }
    });
    
  }
};

/**
 * Initialize language client for specific language
 * @param {Object} editor - The Monaco editor instance
 * @param {String} language - The language identifier
 * @returns {Object} - Language client instance
 */
export const initLanguageClient = async (editor, language) => {
  console.log(`Initializing language client for ${language}`);
  
  const clientKey = `${language}-client`;
  if (languageClients.has(clientKey)) {
    return languageClients.get(clientKey);
  }
  
  const client = {
    language,
    editor,
    disposed: false,
    
    provideCompletionItems: async (model, position) => {
      return { suggestions: [] };
    },
    
    stop: async () => {
      console.log(`Stopping language client for ${language}`);
      this.disposed = true;
      languageClients.delete(clientKey);
      return Promise.resolve();
    }
  };
  
  languageClients.set(clientKey, client);
  
  return client;
};

/**
 * Configure editor settings and features
 * @param {Object} editor - The Monaco editor instance
 */
export const configureEditor = (editor) => {
  console.log("Configuring Monaco editor");
  
  if (!editor) return;
  
  // Set editor options
  editor.updateOptions({
    automaticLayout: true,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 14,
    lineHeight: 21,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    roundedSelection: true,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto'
    },
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never',
      seedSearchStringFromSelection: 'always'
    },
    suggestOnTriggerCharacters: true,
    snippetSuggestions: 'inline',
    tabCompletion: 'on',
    wordBasedSuggestions: 'on',
    hover: {
      enabled: true,
      delay: 300
    }
  });
  
  // Add custom commands or keybindings if needed
};