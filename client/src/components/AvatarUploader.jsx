
import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef(null);

  // Task 2: Validate the selected file
  function validate(selectedFile) {
    if (!selectedFile) return "Please select an image.";

    if (!ALLOWED.includes(selectedFile.type)) {
      return "Only JPEG, PNG, WebP, and GIF images are allowed.";
    }

    if (selectedFile.size > MAX_SIZE) {
      return "File is too large. Maximum size is 5MB.";
    }

    return null;
  }

  // Handle a selected or dropped file
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setProgress(0);
    setUploadedUrl("");

    const validationError = validate(selectedFile);

    if (validationError) {
      setFile(null);
      setPreview(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  // Task 1: Drag-and-drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }

  // Task 3: Release the previous preview URL when it changes
  useEffect(() => {
    if (!preview) return;

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Task 4: Upload the file using Axios
  async function upload() {
    if (!file || isUploading) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setProgress(0);
    setError("");
    setUploadedUrl("");
    setIsUploading(true);

    try {
      const response = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round(
              (event.loaded * 100) / event.total
            );

            setProgress(percent);
          }
        },
      });

      setProgress(100);

      const url = response.data.url;
      if (url) {
        setUploadedUrl(url);
      } else {
        setError("Upload succeeded, but the server did not return a URL.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <div
        className={isDragging ? "drop-zone dragging" : "drop-zone"}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>
          {isDragging
            ? "Drop to upload"
            : "Drag an image here, or click to choose"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="error">{error}</p>}

      {preview && (
        <div>
          <img
            src={preview}
            alt="Avatar preview"
            className="preview"
          />
          <p>{file?.name}</p>
        </div>
      )}

      <button
        onClick={upload}
        disabled={!file || isUploading}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>

      {progress > 0 && (
        <div>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>{progress}%</p>
        </div>
      )}

      {uploadedUrl && (
        <p>
          Upload successful!{" "}
          <a href={uploadedUrl} target="_blank" rel="noreferrer">
            View uploaded image
          </a>
        </p>
      )}
    </div>
  );
}
