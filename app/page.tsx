"use client"

import { useState, useEffect } from "react"
import ImageUpload from "@/components/ImageUpload"
import ImageSegmenter from "@/components/ImageSegmenter"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function Home() {
  const [image, setImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageResized, setImageResized] = useState<string | null>(null)
  const [imageMask, setImageMask] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [coordinatePath, setCoordinatePath] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }[] | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoRunId, setVideoRunId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const handleImageSelect = (file: File | null, url: string) => {
    setImage(file)
    setImageUrl(url)
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (videoRunId) {
      intervalId = setInterval(async () => {
        const response = await fetch(`/api/webhook-video?runId=${videoRunId}`)
        const data = await response.json()

        console.log("Inside video generation useEffect")

        if (data.status === "success") {
          setVideoUrl(data.videoUrl)
          setIsGenerating(false)
          setGenerationProgress(100)
          clearInterval(intervalId)
        }
      }, 5000) // Check every 10 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [videoRunId])

  const handleSubmit = async () => {
    if (!imageResized || !prompt || !imageMask || !coordinatePath || !coordinates) {
      console.log("Please provide all required inputs")
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    const formData = new FormData()
    formData.append("input_image", imageResized)
    formData.append("input_mask", imageMask)
    formData.append("input_prompt", prompt)
    formData.append("input_path", JSON.stringify(coordinatePath))
    formData.append("input_coords", JSON.stringify(coordinates))

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log(data)

      if (data.runId) {
        setVideoRunId(data.runId)
        setVideoUrl(data.videoUrl)

        console.log("Video generation started. Please wait...")

        // Start the progress animation
        const duration = 7 * 60 * 1000 // 7 minutes in milliseconds
        const interval = 100 // Update every 100ms
        const steps = duration / interval
        let currentStep = 0

        const progressInterval = setInterval(() => {
          currentStep++
          const progress = (currentStep / steps) * 100
          setGenerationProgress(Math.min(progress, 100))

          if (currentStep >= steps) {
            clearInterval(progressInterval)
          }
        }, interval)
      } else {
        throw new Error("No video runId received")
      }
    } catch (error) {
      console.error("Error:", error)
      console.log("Error generating video")
    }
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-[800px] mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight">Hexaframe</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            An implementation of{""}
            <a href="https://arxiv.org/abs/2501.08331" className="text-neutral-900 hover:underline dark:text-neutral-50">
              Go-With-The-Flow
            </a>{""}
            with automatic segmentation using{""}
            <a href="https://arxiv.org/abs/2408.00714" className="text-neutral-900 hover:underline dark:text-neutral-50">
              SAM v2
            </a>
          </p>
        </div>

        <div className="space-y-6">
          <div className="card-github p-6">
            <Label className="text-lg font-semibold mb-4 block">Image Upload & Segmentation</Label>
            <ImageUpload
              onImageSelect={(file, url) => {
                setImage(file)
                setImageUrl(url)
              }}
            />
            {imageUrl && (
              <div className="mt-4">
                <ImageSegmenter
                  imageUrl={imageUrl}
                  setImageResized={setImageResized}
                  setImageMask={setImageMask}
                  setCoordinatePath={setCoordinatePath}
                  setCoordinates={setCoordinates}
                />
              </div>
            )}
          </div>

          <p className="text-neutral-500 text-sm dark:text-neutral-400">
            Tip: Carefully describe the movement of the legs of the animal/human you are prompting, or the ripples of
            the water something is hitting.
          </p>

          <div className="card-github p-6">
            <Label htmlFor="prompt" className="text-lg font-semibold block mb-2">
              Prompt
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Brown bear walks through tall green grass. He moves its legs with every step, carefully talking a step when feet touch the ground beneath"
              rows={4}
              className="input-github resize-none"
            />
          </div>

          <Button
            className="button-github w-full py-5 text-lg"
            onClick={handleSubmit}
            disabled={!imageUrl || !prompt || !imageMask || !coordinatePath || !coordinates || isGenerating}
          >
            {isGenerating ? "Generating video..." : "Generate Video"}
          </Button>

          <div className="card-github p-6">
            {videoUrl ? (
              <video controls className="w-full aspect-video rounded-md">
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : isGenerating ? (
              <div className="w-full aspect-video bg-neutral-100 rounded-md flex flex-col items-center justify-center dark:bg-neutral-800">
                <p className="text-2xl font-semibold mb-4">Generating Video...</p>
                <div className="w-3/4 h-4 bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                  <div
                    className="h-full bg-neutral-900 transition-all duration-100 ease-out dark:bg-neutral-50"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">{generationProgress.toFixed(1)}%</p>
              </div>
            ) : (
              <div className="w-full aspect-video bg-neutral-100 rounded-md flex items-center justify-center text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                Video will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

