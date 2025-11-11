import { Archive, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [fileContent, setFileContent] = useState<string>(""); 
  const [fileName, setFileName] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [filePath, setFilePath] = useState("");

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
      if (result.error) throw new Error(result.error);

      if (result.filePath && result.htmlContent) {
        const name = result.filePath.split(/[\\/]/).pop() || 'Untitled Document';
        setFileName(name);
        setFileContent(result.htmlContent);
        setFilePath(result.filePath);

        toast({
          title: "Document Loaded",
          description: `Successfully loaded file: ${name}`,
        });
      }
    } catch (error: any) {
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

    const currentContent = contentRef.current.innerHTML;
    const baseName = fileName.replace(/\.(docx|doc|html)$/i, '');
    const defaultFilename = `${baseName}.docx`; 

    try {
      const result = await window.electronAPI.saveFile(defaultFilename, currentContent);
      if (result.canceled) {
        toast({ title: "Save Cancelled", description: "Saving process cancelled by user." });
        return;
      }
      if (result.error) throw new Error(result.error);

      toast({
        title: "Document Saved",
        description: `Successfully saved file: ${result.filePath}`,
      });
    } catch (error: any) {
      toast({ 
        title: "Error Saving File", 
        description: error.message || "A communication or I/O error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 bg-gray-800 flex flex-col items-center p-4">
        <button 
          onClick={handleOpenFileClick} 
          className="w-full px-4 py-2 mb-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Open Document
        </button>
        <button 
          onClick={() => {
            setFileContent("<p>New Document</p>");
            setFileName("Untitled Document.docx");
          }} 
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          New Document
        </button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-xl font-semibold truncate max-w-xs">
            {fileName || "Untitled"}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleSaveClick}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              <Archive className="w-5 h-5" />
              <span>Save (.docx)</span>
            </button>
          </div>
        </div>

        {/* EditorArea */}
        <div className="flex-1 p-8 overflow-y-auto">
          {!fileContent ? (
            <div 
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={handleOpenFileClick} 
            >
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-xl text-gray-300 mb-2">Open Document (via Electron)</p>
              <p className="text-sm text-gray-500">Click to browse files on your system</p>
            </div>
          ) : (
            <div 
            ref={contentRef}
            className="prose max-w-none text-gray-100 bg-gray-800 rounded p-6 focus:outline-none min-h-full"  
            contentEditable="true"
            dangerouslySetInnerHTML={{ __html: fileContent }}
            />
          )}
        </div>
      </div>

      {/* Vertical Toolbar */}
      <div className="w-16 border-l border-gray-700 bg-gray-800 flex flex-col items-center py-4 space-y-4">
        <button 
          onClick={handleOpenFileClick} 
          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Upload className="w-5 h-5" />
        </button>
        <button 
          onClick={handleSaveClick} 
          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Archive className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Index;
