"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configureEditor = exports.initLanguageClient = exports.registerLanguages = void 0;

var _this = void 0;

var languageClients = new Map();

var registerLanguages = function registerLanguages(monaco) {
  console.log("Registering languages for Monaco editor");

  if (monaco) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
    monaco.languages.registerFoldingRangeProvider('javascript', {
      provideFoldingRanges: function provideFoldingRanges(model, context, token) {
        var ranges = [];
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


exports.registerLanguages = registerLanguages;

var initLanguageClient = function initLanguageClient(editor, language) {
  var clientKey, client;
  return regeneratorRuntime.async(function initLanguageClient$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          console.log("Initializing language client for ".concat(language));
          clientKey = "".concat(language, "-client");

          if (!languageClients.has(clientKey)) {
            _context3.next = 4;
            break;
          }

          return _context3.abrupt("return", languageClients.get(clientKey));

        case 4:
          client = {
            language: language,
            editor: editor,
            disposed: false,
            provideCompletionItems: function provideCompletionItems(model, position) {
              return regeneratorRuntime.async(function provideCompletionItems$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      return _context.abrupt("return", {
                        suggestions: []
                      });

                    case 1:
                    case "end":
                      return _context.stop();
                  }
                }
              });
            },
            stop: function stop() {
              return regeneratorRuntime.async(function stop$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      console.log("Stopping language client for ".concat(language));
                      _this.disposed = true;
                      languageClients["delete"](clientKey);
                      return _context2.abrupt("return", Promise.resolve());

                    case 4:
                    case "end":
                      return _context2.stop();
                  }
                }
              });
            }
          };
          languageClients.set(clientKey, client);
          return _context3.abrupt("return", client);

        case 7:
        case "end":
          return _context3.stop();
      }
    }
  });
};
/**
 * Configure editor settings and features
 * @param {Object} editor - The Monaco editor instance
 */


exports.initLanguageClient = initLanguageClient;

var configureEditor = function configureEditor(editor) {
  console.log("Configuring Monaco editor");
  if (!editor) return; // Set editor options

  editor.updateOptions({
    automaticLayout: true,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 14,
    lineHeight: 21,
    minimap: {
      enabled: true
    },
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
  }); // Add custom commands or keybindings if needed
};

exports.configureEditor = configureEditor;