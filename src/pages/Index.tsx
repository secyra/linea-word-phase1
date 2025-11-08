import { ArrowRight, Circle, Sparkles, Archive, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a DOCX file",
        variant: "destructive"
      });
      return;
    }

    setFileName(file.name);
    // For now, show a placeholder. In production, you'd parse the DOCX content
    setFileContent(`Document "${file.name}" uploaded successfully. Content will be displayed here.`);
    
    toast({
      title: "File uploaded",
      description: `${file.name} has been loaded`,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Toolbar with hover animation */}
      <div className="group relative w-4 hover:w-16 bg-muted/30 border-r border-border flex flex-col items-center py-4 gap-3 transition-all duration-300 ease-out overflow-hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-0 group-hover:scale-100 transition-transform"
        >
          <Circle className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 scale-0 group-hover:scale-100 transition-transform"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 scale-0 group-hover:scale-100 transition-transform"
        >
          <Archive className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 flex items-start justify-center">
        {/* White Rectangle Container */}
        <div className="relative w-full max-w-[1268px] h-[841px] bg-white rounded-[20px] shadow-lg overflow-hidden">
          {!fileContent ? (
            /* Upload Area */
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                className="hidden"
                accept=".doc,.docx"
                onChange={handleFileUpload}
              />
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 mb-2">Upload DOCX File</p>
              <p className="text-sm text-gray-400">Click to browse or drag and drop</p>
            </label>
          ) : (
            /* Document Viewer */
            <div className="w-full h-full p-8 overflow-auto">
              <div className="mb-4 pb-4 border-b">
                <h2 className="text-2xl font-semibold text-gray-800">{fileName}</h2>
              </div>
              <div className="prose max-w-none text-gray-700">
                {fileContent}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
