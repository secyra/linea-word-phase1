import { ArrowRight, Circle, Sparkles, Archive, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import FloatingActionButton from "../components/FloatingActionButton";

// REMINDER: Ensure you have the global.d.ts file with the OpenFileResult and SaveFileResult interfaces defined!

const Index = () => {
  // Stores the HTML content for display and editing
  const [fileContent, setFileContent] = useState<string>(""); 
  // Stores the original filename (used to suggest save name)
  const [fileName, setFileName] = useState<string>("");
  // Ref to directly access the contenteditable div
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [filePath,setFilePath] = useState("");

  const handleOpenFileClick = async () => {
    if (!window.electronAPI) {
      toast({
        title: "Error",
        description: "App not running in Electron mode.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await window.electronAPI.openFile(); 

      if (result.canceled) {
        toast({ title: "Cancelled", description: "File selection was cancelled." });
        return;
      }

      if (result.error) {
        console.error("Backend Error:", result.error);
        throw new Error(result.error);
      }

      // Process the successful Response
      if (result.filePath && result.htmlContent) {
        const name = result.filePath.split(/[\\/]/).pop() || 'Untitled Document';
        
        setFileName(name);
        setFileContent(result.htmlContent);

        console.log("Frontend Check: HTML Content received length:", result.htmlContent.length);
        
        toast({
          title: "Document Loaded",
          description: `Successfully loaded file: ${name}`,
        });
      }

    } catch (error: any) {
      console.error("File Loading Error:", error);
      toast({ 
        title: "Error Loading File", 
        description: error.message || "A communication or I/O error occurred.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveClick = async () => {
    if (!window.electronAPI || !contentRef.current || !fileName) {
        toast({ title: "Error", description: "Document not loaded or environment missing." });
        return;
    }

    // 1. Get the current, edited content from the DOM (bypassing state for simplicity)
    const currentContent = contentRef.current.innerHTML;

    // 2. Construct the default filename
    // Start with the current fileName, ensuring it ends with .docx
    const baseName = fileName.replace(/\.(docx|doc|html)$/i, '');
    const defaultFilename = `${baseName}.docx`; 

    try {
        // 3. Call the backend IPC to handle the save dialog and file write
        const result = await window.electronAPI.saveFile(defaultFilename, currentContent);

        if (result.canceled) {
            toast({ title: "Save Cancelled", description: "Saving process cancelled by user." });
            return;
        }

        if (result.error) {
            console.error("Save Backend Error:", result.error);
            throw new Error(result.error);
        }

        toast({
            title: "Document Saved",
            description: `Successfully saved file: ${result.filePath}`,
        });

    } catch (error: any) {
        console.error("File Saving Error:", error);
        toast({ 
            title: "Error Saving File", 
            description: error.message || "A communication or I/O error occurred.",
            variant: "destructive"
        });
    }
  };


  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Toolbar (unchanged) */}
      <div className="group relative w-4 hover:w-16 bg-muted/30 border-r border-border flex flex-col items-center py-4 gap-3 transition-all duration-300 ease-out overflow-hidden">
       <FloatingActionButton 
       onFileOpened={(content, path) => {
          setFileContent(content);
          setFilePath(path);}}
          variant="ghost" 
          size="icon" 
          className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-0 group-hover:scale-100 transition-transform"
        >
          <Circle className="h-5 w-5" />
        </FloatingActionButton>
      
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 flex items-start justify-center">
        {/* White Rectangle Container */}
        <div className="relative w-full max-w-[1268px] h-[841px] bg-white rounded-[20px] shadow-lg overflow-hidden">
          {!fileContent ? (
            /* Upload Area - Clickable */
            <div 
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleOpenFileClick} 
            >
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 mb-2">Open Document (via Electron)</p>
              <p className="text-sm text-gray-400">Click to browse files on your system</p>
            </div>
          ) : (
            /* Document Viewer with Header and Editing Area */
            <div className="w-full h-full flex flex-col">
              {/* Header/Toolbar */}
              <div className="flex justify-between items-center p-4 border-b bg-gray-50/50">
                <h2 className="text-xl font-semibold text-gray-800 truncate max-w-xs">{fileName}</h2>
                <div className="flex space-x-2">
                    {/* Save Button */}
                    <button 
                        onClick={handleSaveClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        <Archive className="w-5 h-5" />
                        <span>Save (.docx)</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                        <span>Export PDF</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
              </div>

              {/* Editing Area */}
              <div className="flex-1 p-8 overflow-y-auto">
                <div 
                  ref={contentRef}
                  className="prose max-w-none text-gray-700 focus:outline-none min-h-full" 
                  contentEditable="true"
                  dangerouslySetInnerHTML={{ __html: fileContent }}
                >
                  {/* Content is rendered here */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;