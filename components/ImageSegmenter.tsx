"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import DragSegment from "@/components/DragSegment"

interface ImageSegmenterProps {
  imageUrl: string
  setImageMask: (mask: string) => void
  setImageResized: (url: string) => void
  setCoordinatePath: (path: string) => void
  setCoordinates: (coords: { x: number; y: number }[]) => void
}

const ImageSegmenter: React.FC<ImageSegmenterProps> = ({
  imageUrl,
  setImageMask,
  setImageResized,
  setCoordinatePath,
  setCoordinates,
}) => {
  const [segmentedImageUrl, setSegmentedImageUrl] = useState<string | null>(null)
  const [resizedOriginalUrl, setResizedOriginalUrl] = useState<string | null>(null)
  const [cutoutOriginalUrl, setCutoutOriginalUrl] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState<{
    scaled: { x: number | null; y: number | null }
    actual: { x: number | null; y: number | null }
  }>({ scaled: { x: null, y: null }, actual: { x: null, y: null } })
  const [clickedPoints, setClickedPoints] = useState<{ x: number; y: number }[]>([])
  const [isSegmenting, setIsSegmenting] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (runId) {
      intervalId = setInterval(async () => {
        const response = await fetch(`/api/webhook-segment?runId=${runId}`)
        const data = await response.json()

        console.log("Inside segmenter useEffect")
        console.log("Data:", data)
        console.log("Generated mask:", data.segmentedImageUrl)
        console.log("Data status:", data.status)
        if (data.status === "success") {
          setSegmentedImageUrl(data.segmentedImageUrl)
          setResizedOriginalUrl(data.resizedOriginalUrl)
          setCutoutOriginalUrl(data.cutoutUrl)
          setIsSegmenting(false)
          clearInterval(intervalId)
        }
      }, 2000) // Check every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [runId])

  useEffect(() => {
    if (segmentedImageUrl) {
      setImageMask(segmentedImageUrl)
    }
  }, [segmentedImageUrl, setImageMask])

  useEffect(() => {
    if (resizedOriginalUrl) {
      setImageResized(resizedOriginalUrl)
    }
  }, [resizedOriginalUrl, setImageResized])

  useEffect(() => {
    if (cutoutOriginalUrl) {
      setCutoutOriginalUrl(cutoutOriginalUrl)
    }
  }, [cutoutOriginalUrl, setCutoutOriginalUrl])

  useEffect(() => {
    drawPoints()
  }, [clickedPoints])

  const drawPoints = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    clickedPoints.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)

      // Fill with a tasteful dark green
      ctx.fillStyle = "#008000"
      ctx.fill()

      // Use a softer dark gray stroke for the border
      ctx.lineWidth = 2
      ctx.strokeStyle = "#3A3A3A"
      ctx.stroke()
    })
  }

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (clickedPoints.length >= 4) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Ensure coordinates are within 0-720 and 0-480
    const segmentX = Math.round(Math.min(Math.max(x, 0), 720))
    const segmentY = Math.round(Math.min(Math.max(y, 0), 480))

    setClickedPoints((prev) => {
      const newPoints = [...prev, { x: segmentX, y: segmentY }]
      // Call drawPoints here to ensure immediate update
      return newPoints
    })

    drawPoints()

    console.log(`Clicked at coordinates: (${segmentX}, ${segmentY})`)
  }

  const handleSubmitSegmentation = async () => {
    if (clickedPoints.length === 0) return

    setIsSegmenting(true)

    try {
      const response = await fetch("/api/segment-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl, coordinates: clickedPoints }),
      })

      const data = await response.json()
      console.log(data)

      if (data.runId) {
        setRunId(data.runId)
        console.log("Segmentation started. Please wait...")
      } else {
        throw new Error("No runId received")
      }
    } catch (error) {
      console.error("Error:", error)
      setIsSegmenting(false)
    }
  }

  const resetSegmentation = () => {
    setSegmentedImageUrl(null)
    setClickedPoints([])
    setIsSegmenting(false)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    drawPoints()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Ensure coordinates are within 0-720 and 0-480
    const segmentX = Math.round(Math.min(Math.max(x, 0), 720))
    const segmentY = Math.round(Math.min(Math.max(y, 0), 480))

    setMousePosition({
      scaled: { x: segmentX, y: segmentY },
      actual: { x, y },
    })
  }

  const handleMouseLeave = () => {
    setMousePosition({ scaled: { x: null, y: null }, actual: { x: null, y: null } })
  }

  return (
    <div className="space-y-4">
      <h4 className="text-center">
        <span className="relative z-10 text-sm">
          Click on the object you want to move, with a maximum of four points. If the object has different colors or
          parts, make sure to put a point in each.
        </span>
      </h4>
      <div className="flex justify-center w-full">
        <div className="w-[720px] h-[480px] border-2 border-neutral-100 rounded-lg overflow-hidden relative dark:border-neutral-800">
          <img
            ref={imageRef}
            src={imageUrl || "/placeholder.svg"}
            alt="Preview"
            className="w-[720px] h-[480px] object-cover"
          />
          <canvas
            ref={canvasRef}
            width={720}
            height={480}
            className="absolute top-0 left-0 cursor-crosshair"
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          {mousePosition.scaled.x !== null && mousePosition.scaled.y !== null && (
            <div
              className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none"
              style={{
                left: `${mousePosition.actual.x}px`,
                top: `${mousePosition.actual.y}px`,
                transform: "translate(10px, -100%)",
                zIndex: 10,
              }}
            >
              X: {mousePosition.scaled.x}, Y: {mousePosition.scaled.y}
            </div>
          )}
        </div>
      </div>
      <div className="flex space-x-4">
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 py-3 text-xl rounded-md"
          onClick={handleSubmitSegmentation}
          disabled={clickedPoints.length === 0 || isSegmenting}
        >
          {isSegmenting ? "Segmenting..." : "Submit Segmentation"}
        </Button>
        <Button
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-display text-xl py-3"
          onClick={resetSegmentation}
          disabled={clickedPoints.length === 0 && !segmentedImageUrl && !isSegmenting}
        >
          Reset Segmentation
        </Button>
      </div>
      {isSegmenting && (
        <div className="text-center p-4 rounded-lg bg-gray-800">
          <p className="text-lg font-semibold text-white">Please wait, segmentation is being calculated...</p>
        </div>
      )}
      {segmentedImageUrl && resizedOriginalUrl && cutoutOriginalUrl && (
        <DragSegment
          imageUrl={resizedOriginalUrl}
          maskUrl={cutoutOriginalUrl}
          segmentedUrl={segmentedImageUrl}
          setCoordinatePath={setCoordinatePath}
          setCoordinates={setCoordinates}
          width={720} // or your desired dimensions
          height={480}
        />
      )}
    </div>
  )
}

export default ImageSegmenter

