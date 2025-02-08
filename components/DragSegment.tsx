"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface DragSegmentProps {
  imageUrl: string 
  maskUrl: string
  segmentedUrl: string
  width?: number
  height?: number
  setCoordinatePath: any
  setCoordinates: any
}

const DragSegment: React.FC<DragSegmentProps> = ({
  imageUrl,
  maskUrl,
  segmentedUrl,
  setCoordinatePath,
  setCoordinates,
  width = 720,
  height = 480,
}) => {
  const [position, setPosition] = useState<Coords>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Coords>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [centroid, setCentroid] = useState<Coords>({ x: 0, y: 0 })
  const [endCoords, setEndCoords] = useState<Coords>({ x: 0, y: 0 })
  const [arrowSubmitted, setArrowSubmitted] = useState<boolean>(false)

  type Coords = { x: number, y: number }
  
  /*
   * Given two coordinates, return an array of 49 equally spaced points
   * along the line from start to end (inclusive).
   */
  const generateLinePoints = (start: Coords, end: Coords, numPoints = 49): Coords[] => {
    
    const points: Coords[] = []
    const dx = end.x - start.x
    const dy = end.y - start.y

    // numPoints = 49 means we have 48 intervals, from t=0..1
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1) // t ranges from 0 to 1
      const x = start.x + dx * t
      const y = start.y + dy * t
      points.push({ x, y })
    }
    return points
  }

  /**
   * Loads an image from the given URL.
   * @param url - The URL of the image hosted on the internet.
   * @returns A Promise that resolves with the loaded HTMLImageElement.
   */
  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      // Enable cross-origin loading if necessary.
      img.crossOrigin = "Anonymous"
      img.onload = () => resolve(img)
      img.onerror = (err) => reject(new Error(`Failed to load image at ${url}: ${err}`))
      img.src = url
    })
  }

  /**
   * Computes the centroid of white pixels in an image loaded from a URL.
   *
   * The function loads the image from the provided URL, draws it onto an off‑screen canvas,
   * and then iterates through its pixel data to determine the centroid of the white pixels.
   * A pixel is considered white if its red, green, and blue components are all above the specified threshold.
   *
   * @param imageUrl - The URL of the image.
   * @param threshold - The minimum value for each of R, G, and B to consider a pixel white (default: 250).
   * @returns A Promise that resolves to the centroid as an object { x, y }, or null if no white pixels are found.
   */
  async function computeCentroidFromUrl(imageUrl: string, threshold = 250): Promise<{ x: number; y: number } | null> {
    // Load the image from the given URL.
    const img = await loadImage(imageUrl)

    // Create an off-screen canvas with the same dimensions as the image.
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Draw the image onto the canvas.
    ctx.drawImage(img, 0, 0)

    // Retrieve the pixel data from the canvas.
    const imageData = ctx.getImageData(0, 0, img.width, img.height)
    const data = imageData.data
    const width = img.width
    const height = img.height

    // Initialize accumulators for x and y coordinates and a counter for white pixels.
    let sumX = 0
    let sumY = 0
    let count = 0

    // Process each pixel in the image.
    // The data array contains RGBA values for each pixel, so each pixel takes up 4 array entries.
    for (let y = 0; y < height; y++) {
      const rowOffset = y * width * 4
      for (let x = 0; x < width; x++) {
        const i = rowOffset + x * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // A pixel is considered white if its R, G, and B values are all above the threshold.
        if (r >= threshold && g >= threshold && b >= threshold) {
          sumX += x
          sumY += y
          count++
        }
      }
    }

    // If no white pixels were found, return null.
    if (count === 0) {
      return null
    }

    // Return the computed centroid.
    return { x: sumX / count, y: sumY / count }
  }

  useEffect(() => {
    const computeCentroid = async () => {
      try {
        const result = await computeCentroidFromUrl(segmentedUrl)
        if (result) {
          setCentroid(result)
          console.log("Centroid:", result)
        } else {
          console.error("No white pixels found in the segmented image.")
        }
      } catch (error) {
        console.error("Error computing centroid:", error)
      }
    }

    computeCentroid()
  }, [segmentedUrl])

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && containerRef.current && dragStart) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const newX = e.clientX - containerRect.left - dragStart.x
      const newY = e.clientY - containerRect.top - dragStart.y

      console.log("Moving:", { x: newX, y: newY, width, height })

      setPosition({
        x: Math.min(newX, width),
        y: Math.min(newY, height),
      })
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log("e.clientX ", e.clientX)
    console.log("e.clientY ", e.clientY)
    setIsDragging(false)
    setEndCoords({ x: centroid.x + position.x, y: centroid.y + position.y })
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [])

  /**
   * Submit arrow coordinates.
   */
  const handleSubmitArrow = () => {
    const points = [centroid, endCoords]
    setCoordinates(points)

    // Create a simple path string
    const path = generateLinePoints(centroid, endCoords, 49)
    setCoordinatePath(path)

    setArrowSubmitted(true)
    console.log("Arrow coordinates submitted:", points)
    console.log("Arrow path submitted:", path)
    
  }

  return (
    <div>
      <h4 className="text-center">
        <span className="relative z-10 text-sm">
          Click on the object you want to move, with a maximum of four points. If the object has different colors or
          parts, make sure to put a point in each.
        </span>
      </h4>
      <div className="flex justify-center w-full">
        <div
          ref={containerRef}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: "relative",
            overflow: "hidden",
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid #30363d",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={maskUrl || "/placeholder.svg"}
            alt="Draggable Mask"
            style={{
              position: "absolute",
              transform: `translate(${position.x}px, ${position.y}px)`,
              userSelect: "none",
              pointerEvents: "auto",
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        </div>
      </div>
      <div className="flex space-x-4 space-y-4" style={{margin: "10px 0"}}>
        <button
          onClick={handleSubmitArrow}
          disabled={endCoords.x === null || endCoords.y === null}
          className="flex-1 bg-primary hover:bg-primary/90 py-3 text-xl rounded-md"
        >
          Submit Movement
        </button>
      </div>
      {arrowSubmitted && <p className="text-center text-green-700 mt-2">Movement coordinates submitted!</p>}
    </div>
  )
}

export default DragSegment

