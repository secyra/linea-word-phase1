import { Archive, Upload, X, Sun, Moon } from "lucide-react";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import React from "react";
import ReactDOM from "react-dom/client";




type DocumentType = {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  filePath?: string;
};

const Index = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false); // 🌗 NEW
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const activeDoc = documents.find(doc => doc.id === activeDocId);

  // --- Handlers ---
  const handleNewDocumentClick = () => {
    const newDoc: DocumentType = {
      id: crypto.randomUUID(),
      name: "Untitled Document.docx",
      content: "<p><br></p>",
      isDirty: false,
    };
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    // Focus will be handled by useLayoutEffect when activeDocId changes
  };

  const handleOpenFileClick = async () => {
    if (!window.electronAPI) {
      toast({ title: "Error", description: "App not running in Electron mode.", variant: "destructive" });
      return;
    }
    try {
      const result = await window.electronAPI.openFile();
      if (result.canceled) return;
      if (result.error) throw new Error(result.error);

      const name = result.filePath.split(/[\\/]/).pop() || "Untitled Document";
      const newDoc: DocumentType = {
        id: crypto.randomUUID(),
        name,
        content: result.htmlContent || "<p><br></p>",
        isDirty: false,
        filePath: result.filePath,
      };
      setDocuments(prev => [...prev, newDoc]);
      setActiveDocId(newDoc.id);
    } catch (error: any) {
      toast({ title: "Error Loading File", description: error.message, variant: "destructive" });
    }
  };

  // Keep your preprocessHtmlForDocx as-is (used only for exporting)
const preprocessHtmlForDocx = (html: string): string => {
  return html
    .replace(/<span style="color:(.*?)">/g, '<font color="$1">')
    .replace(/<\/span>/g, "</font>")
    .replace(/<b>/g, "<strong>")
    .replace(/<\/b>/g, "</strong>")
    .replace(/<i>/g, "<em>")
    .replace(/<\/i>/g, "</em>");
    // NOTE: don't convert <u> here — keep underline tags intact
};

// ===== REPLACED handleSaveClick =====
const handleSaveClick = async () => {
  if (!window.electronAPI || !contentRef.current || !activeDoc) return;

  // 1) Get the raw editor HTML (exactly what the browser produced)
  const rawHtml = contentRef.current.innerHTML;

  // 2) Update React state with the RAW HTML so reopening shows exactly what you see now
  setDocuments(docs =>
    docs.map(doc =>
      doc.id === activeDoc.id
        ? { ...doc, content: rawHtml, isDirty: false }
        : doc
    )
  );

  // 3) Prepare export HTML specifically for docx (do NOT store this back into state)
  const exportHtml = preprocessHtmlForDocx(rawHtml);

  const baseName = activeDoc.name.replace(/\.(docx|doc|html)$/i, "");
  const defaultFilename = `${baseName}.docx`;

  try {
    // Pass the docx-friendly HTML to the backend/save routine
    const result = await window.electronAPI.saveFile(defaultFilename, exportHtml);
    if (result.error) throw new Error(result.error);

    // Save the returned filePath, but keep the rawHtml as document content
    setDocuments(docs =>
      docs.map(doc =>
        doc.id === activeDoc.id
          ? { ...doc, isDirty: false, filePath: result.filePath }
          : doc
      )
    );
  } catch (error: any) {
    toast({ title: "Error Saving File", description: error.message, variant: "destructive" });
  }
};


  const handleContentChange = () => {
    if (!activeDoc || !contentRef.current) return;
    const html = contentRef.current.innerHTML;
    setDocuments(docs => docs.map(doc => doc.id === activeDoc.id ? { ...doc, content: html, isDirty: true } : doc));
  };

  // --- caret fix util ---
const placeCaretAtEnd = (el: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
};

  const handleCloseTab = (docId: string) => {
  const doc = documents.find(d => d.id === docId);
  if (doc?.isDirty) {
    const confirmClose = window.confirm(
      `You have unsaved changes in "${doc.name}". Do you want to close without saving?`
    );
    if (!confirmClose) return;
  }

  setDocuments(prev => prev.filter(d => d.id !== docId));
  if (docId === activeDocId) {
    setActiveDocId(null);
  }
};




useLayoutEffect(() => {
  const el = contentRef.current;
  if (!el) return;

  if (!activeDoc) {
    el.innerHTML = "";
    el.blur();
    return;
  }

  // Preserve the exact content with all formatting
  let seed = activeDoc.content || "";
  
  // Only add zero-width space if content is truly empty or just whitespace/br tags
  const trimmedSeed = seed.trim();
  if (!trimmedSeed || trimmedSeed === "<p><br></p>" || trimmedSeed === "<p></p>" || trimmedSeed === "") {
    seed = "<p>\u200B</p>";
  }
  
  // Set the HTML content exactly as saved to preserve all formatting
  el.innerHTML = seed;

  // Restore focus after content is set - use multiple attempts for Electron
  const restoreFocus = () => {
    if (!el || !activeDoc) return;
    
    // Blur any currently focused element first
    if (document.activeElement && document.activeElement !== el) {
      (document.activeElement as HTMLElement).blur();
    }
    
    // Ensure window has focus (for Electron)
    if (window.focus) {
      window.focus();
    }
    
    // Force focus on the element multiple times
    el.focus();
    el.focus();
    
    // Try to find a text node to place caret in
    const walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let textNode: Node | null = null;
    let node: Node | null;
    while (node = walker.nextNode()) {
      textNode = node;
    }
    
    // Place caret at end
    const range = document.createRange();
    const sel = window.getSelection();
    
    if (textNode) {
      // Place caret at end of last text node
      range.setStart(textNode, textNode.textContent?.length || 0);
      range.setEnd(textNode, textNode.textContent?.length || 0);
    } else {
      // Fallback: place at end of content
      range.selectNodeContents(el);
      range.collapse(false);
    }
    
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    
    // Force reflow to ensure caret is rendered
    void el.offsetHeight;
    void el.scrollTop;
    
    // Trigger a click event to ensure focus (sometimes needed in Electron)
    requestAnimationFrame(() => {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      el.dispatchEvent(clickEvent);
      el.focus();
    });
  };

  // Multiple attempts with increasing delays for Electron
  requestAnimationFrame(() => {
    restoreFocus();
    
    setTimeout(() => {
      restoreFocus();
    }, 100);
    
    setTimeout(() => {
      restoreFocus();
    }, 300);
  });
}, [activeDocId]);

// Additional focus check - ensures cursor is visible after render
useEffect(() => {
  if (!activeDoc || !contentRef.current) return;
  
  const el = contentRef.current;
  
  // Final check after a longer delay to ensure focus
  const timer = setTimeout(() => {
    if (!el || !activeDoc) return;
    
    // Only focus if not already focused
    if (document.activeElement !== el) {
      el.focus();
      placeCaretAtEnd(el);
      
      // Force reflow
      void el.offsetHeight;
    }
  }, 500);
  
  return () => clearTimeout(timer);
}, [activeDocId, activeDoc]);

  // --- Layout ---
  return (
    <div className={`flex h-screen ${isLightTheme ? "bg-white text-gray-900" : "bg-zinc-900 text-zinc-100"}`}>
      {/* Left Toolbar */}
<div className={`${isLightTheme ? "bg-[#E8F5E9] border-[#A8D5BA]" : "bg-zinc-800 border-[#6B9F7F]"} border-r transition-all duration-300 ${isToolbarExpanded ? "w-64" : "w-16"} flex flex-col`}>
        <button
          onClick={() => setIsToolbarExpanded(prev => !prev)}
className={`w-full px-[22px] py-[22px] ${isLightTheme ? "bg-[#C8E6C9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white" : "bg-zinc-800 text-white hover:bg-[#7FB069]"} border-b ${isLightTheme ? "border-[#A8D5BA]" : "border-[#6B9F7F]"} flex items-center justify-center transition-colors`}
          title={isToolbarExpanded ? "Collapse" : "Expand"}
        >
          {isToolbarExpanded ? (
            <ChevronsLeft className="w-6 h-6 leading-none" />
          ) : (
            <ChevronsRight className="w-6 h-6 leading-none" />
          )}
        </button>

        {/* Document Switcher */}
        <div className="flex-1 flex flex-col items-center py-4 space-y-2">
          {documents.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors ${
  doc.id === activeDocId
    ? isLightTheme
      ? "bg-[#A8D5BA] text-gray-900"
      : "bg-[#7FB069] text-white"
    : isLightTheme
      ? "bg-[#E8F5E9] text-gray-700 hover:bg-[#C8E6C9]"
      : "bg-zinc-700 text-zinc-300 hover:bg-[#7FB069]"
}`}

              title={doc.name}
            >
              {isToolbarExpanded ? (
                <>
                  <span className="truncate">{doc.name}{doc.isDirty ? " *" : ""}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(doc.id);
                    }}
                    className={`${isLightTheme ? "text-gray-500 hover:text-red-500" : "text-zinc-400 hover:text-red-400"}`}
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
          ))}
        </div>
      </div>


      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className={`flex justify-between items-center p-4 border-b ${isLightTheme ? "border-[#A8D5BA] bg-white text-gray-900" : "border-[#6B9F7F] bg-zinc-800 text-white"}`}>
          <h2 className="text-xl font-semibold truncate max-w-xs">
            {activeDoc?.name || "Untitled"}
          </h2>

          <div className="flex-1 flex justify-center items-center gap-4">
  <button
    onClick={() => document.execCommand("bold")}
    className={`px-3 py-1 rounded font-bold transition-colors ${
      isLightTheme
        ? "bg-[#E8F5E9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white"
        : "bg-zinc-700 text-white hover:bg-[#7FB069]"
    }`}
  >
    B
  </button>

  <button
    onClick={() => document.execCommand("italic")}
    className={`px-3 py-1 rounded italic transition-colors ${
      isLightTheme
        ? "bg-[#E8F5E9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white"
        : "bg-zinc-700 text-white hover:bg-[#7FB069]"
    }`}
  >
    I
  </button>

  <button
    onClick={() => document.execCommand("underline")}
    className={`px-3 py-1 rounded underline transition-colors ${
      isLightTheme
        ? "bg-[#E8F5E9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white"
        : "bg-zinc-700 text-white hover:bg-[#7FB069]"
    }`}
  >
    U
  </button>

  {/* Color Picker */}
  <input
    type="color"
    onChange={(e) => {
      const color = e.target.value;
      // Ensure the editor has focus before applying color
      if (contentRef.current) {
        contentRef.current.focus();
        
        // Use execCommand to apply color
        // This works for both selected text and sets color for next typed text
        const success = document.execCommand("foreColor", false, color);
        
        // If execCommand fails, try alternative method
        if (!success) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (!range.collapsed) {
              // There's a selection, wrap it in a span with color
              const span = document.createElement("span");
              span.style.color = color;
              try {
                range.surroundContents(span);
              } catch (e) {
                // If surroundContents fails, extract and wrap
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
              }
            }
          }
        }
        
        // Ensure selection is maintained
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }}
    onClick={(e) => {
      // Ensure editor has focus when color picker is clicked
      if (contentRef.current) {
        contentRef.current.focus();
      }
    }}
    className={`w-8 h-8 p-0 border rounded-full cursor-pointer ${
      isLightTheme
        ? "border-[#A8D5BA] bg-white"
        : "border-[#6B9F7F] bg-zinc-800"
    }`}
    style={{ 
      borderRadius: '50%',
      WebkitAppearance: 'none',
      appearance: 'none',
      cursor: 'pointer'
    }}
  />
</div>



          <div className="flex space-x-4">
            <button
              onClick={handleNewDocumentClick}
              className={`${isLightTheme ? "bg-[#E8F5E9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white" : "bg-zinc-700 text-white hover:bg-[#7FB069]"} p-2 rounded transition-colors`}
              title="New Document"
            >
              <Upload className="w-5 h-5 rotate-90" />
            </button>

            <button
              onClick={handleOpenFileClick}
              className={`${isLightTheme ? "bg-[#E8F5E9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white" : "bg-zinc-700 text-white hover:bg-[#7FB069]"} p-2 rounded transition-colors`}
              title="Open Document"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleSaveClick}
              className={`${isLightTheme ? "bg-[#E8F5E9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white" : "bg-zinc-700 text-white hover:bg-[#7FB069]"} p-2 rounded transition-colors`}
              title="Save Document"
            >
              <Archive className="w-5 h-5" />
            </button>

            {/* 🌗 Theme Toggle Button */}
            <button
              onClick={() => setIsLightTheme(prev => !prev)}
              className={`${isLightTheme ? "bg-[#E8F5E9] text-gray-900 hover:bg-[#A8D5BA] hover:text-white" : "bg-zinc-700 text-white hover:bg-[#7FB069]"} p-2 rounded transition-colors`}
              title="Toggle Theme"
            >
              {isLightTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>


        {/* Editor Area */}
        <div className={`flex-1 p-8 overflow-y-auto ${isLightTheme ? "bg-white text-gray-900" : "bg-zinc-900 text-white"}`}>
          {!activeDoc ? (
            <div
              className={`flex flex-col items-center justify-center w-full h-full cursor-pointer rounded transition-colors ${isLightTheme ? "hover:bg-[#E8F5E9]" : "hover:bg-zinc-800"}`}
              onClick={handleOpenFileClick}
            >
              <Upload className={`w-16 h-16 mb-4 ${isLightTheme ? "text-[#A8D5BA]" : "text-[#6B9F7F]"}`} />
              <p className={`text-xl mb-2 ${isLightTheme ? "text-gray-600" : "text-zinc-400"}`}>Open Document (via Electron)</p>
              <p className={`text-sm ${isLightTheme ? "text-gray-500" : "text-zinc-500"}`}>Click to browse files on your system</p>
            </div>
          ) : (
            <div
  key={activeDocId}
  ref={contentRef}
  contentEditable="true"
  onInput={handleContentChange}
  onMouseDown={(e) => {
    // Ensure focus on mousedown (before click) to prevent text leakage
    const el = e.currentTarget;
    if (document.activeElement !== el) {
      el.focus();
    }
  }}
  className={`prose max-w-none rounded p-6 focus:outline-none min-h-full ${
    isLightTheme
      ? "prose-gray bg-[#F5FBF6] text-gray-900 border-2 border-[#A8D5BA] shadow-sm"
      : "prose-invert bg-zinc-800 text-zinc-100 border border-zinc-700"
  }`}
  suppressContentEditableWarning={true}
  spellCheck={true}
  tabIndex={0}
  role="textbox"
  aria-multiline="true"
  style={{ caretColor: isLightTheme ? "#6B9F7F" : "#A8D5BA" }}
/>


          )}
        </div>
      </div>
    </div>
  );
};


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Index />
  </React.StrictMode>
);

export default Index;
