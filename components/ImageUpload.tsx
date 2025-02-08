"use client"

import type React from "react"
import { useState } from "react"
  
// import { useCallback } from "react"
// import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ImageUploadProps {
  onImageSelect: (file: File | null, imageUrl: string) => void
}

export default function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>("")

  // const onDrop = useCallback(
  //   (acceptedFiles: File[]) => {
  //     if (acceptedFiles && acceptedFiles.length > 0) {
  //       const file = acceptedFiles[0]
  //       const localImageUrl = URL.createObjectURL(file)
  //       setImageUrl(localImageUrl)
  //       onImageSelect(file, localImageUrl)
  //     }
  //   },
  //   [onImageSelect],
  // )

  // const { getRootProps, getInputProps, isDragActive } = useDropzone({
  //   onDrop,
  //   accept: { "image/*": [] },
  //   multiple: false,
  // })

  const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (imageUrl) {
      onImageSelect(null, imageUrl)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleUrlSubmit} className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter public image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="input-github flex-grow"
        />
        <Button type="submit" disabled={!imageUrl} className="button-github">
          Load Image
        </Button>
      </form>
    </div>
  )
}

