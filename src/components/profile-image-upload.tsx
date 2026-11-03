"use client";

import { useState, useRef } from "react";
import { Camera, X, User } from "lucide-react";

export function ProfileImageUpload({ 
  defaultValue, 
  name 
}: { 
  defaultValue?: string | null; 
  name: string 
}) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [dataUrl, setDataUrl] = useState<string>(defaultValue || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Image must be smaller than 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setDataUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setDataUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="profile-upload-container">
      <div className="profile-preview">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile preview" className="profile-img" />
        ) : (
          <div className="profile-placeholder">
            <User size={40} className="muted" />
          </div>
        )}
        <button 
          type="button" 
          className="upload-trigger" 
          onClick={() => fileInputRef.current?.click()}
          title="Change photo"
        >
          <Camera size={16} />
        </button>
        {preview && (
          <button 
            type="button" 
            className="clear-trigger" 
            onClick={clearImage}
            title="Remove photo"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png,image/jpeg,image/webp" 
        style={{ display: "none" }} 
      />
      <input type="hidden" name={name} value={dataUrl} />
      <p className="hint" style={{ marginTop: "0.5rem", textAlign: "center" }}>
        JPG, PNG or WebP. Max 500KB.
      </p>
    </div>
  );
}
