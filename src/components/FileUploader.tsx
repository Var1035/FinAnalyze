
import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onClear: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, selectedFile, onClear }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSet(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSet(e.target.files[0]);
        }
    };

    const validateAndSet = (file: File) => {
        if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
            onFileSelect(file);
        } else {
            alert('Only CSV or XLSX files are allowed.');
        }
    };

    return (
        <div className="w-full">
            {!selectedFile ? (
                <div
                    className={`relative h-64 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center p-6 cursor-pointer
            ${dragActive ? 'border-accent bg-blue-50/10' : 'border-border hover:border-accent hover:bg-secondary/50'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        className="hidden"
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleChange}
                    />
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 text-accent">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-1">Click to upload or drag and drop</h3>
                    <p className="text-sm text-secondary">CSV or XLSX (max 10MB)</p>
                </div>
            ) : (
                <div className="relative p-6 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-primary">{selectedFile.name}</p>
                            <p className="text-xs text-secondary">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>
                    <button
                        onClick={onClear}
                        className="p-2 hover:bg-secondary rounded-full text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
