import { useState, useRef, useEffect } from "react";
import { Circle, FileUp, FilePlus } from "lucide-react";

export default function FloatingActionButton({ onFileOpened }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImport = async () => {
    setMenuOpen(false);
    const result = await window.electronAPI.openFile();
    if (!result.canceled && result.htmlContent) {
      onFileOpened(result.htmlContent, result.filePath);
    }
  };

  const handleNewDoc = () => {
    setMenuOpen(false);
    onFileOpened("<p>New Document</p>", "Untitled Document.docx");
  };

  return (
    <div className="fixed top-6 left-6 z-50" ref={menuRef}>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-full bg-blue-600 text-white p-4 hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-lg"
        >
          <Circle className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-lg w-48 z-50">
            <button
              onClick={handleImport}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-gray-700"
            >
              <FileUp className="h-4 w-4" />
              Import Document
            </button>
            <button
              onClick={handleNewDoc}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-gray-700"
            >
              <FilePlus className="h-4 w-4" />
              New Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
