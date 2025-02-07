import { type FC, useRef, useState, useEffect, type MouseEvent } from "react"
import DraggableSailboat from "@/components/DragSegment"

interface Coords {
  x: number | null
  y: number | null
}

interface DrawArrowProps {
  /** The URL of the segmented image to draw on top of */
  segmentedImageUrl: string | null
  resizedOriginalUrl: string | null
  setCoordinatePath: (path: string) => void
  setCoordinates: (coords: { x: number; y: number }[]) => void
}

const DrawArrow: FC<DrawArrowProps> = ({ segmentedImageUrl, resizedOriginalUrl, setCoordinatePath, setCoordinates }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [startCoords, setStartCoords] = useState<Coords>({ x: null, y: null })
  const [endCoords, setEndCoords] = useState<Coords>({ x: null, y: null })
  const [arrowSubmitted, setArrowSubmitted] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState<Coords>({ x: null, y: null })
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false)
  const [cutoutDataUrl, setCutoutDataUrl] = useState<string | null>(null)


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
   * Convert a mouse event to coordinates relative to the canvas.
   */
  const getRelativeCoords = (event: MouseEvent<HTMLCanvasElement>): Coords => {
    if (!canvasRef.current) {
      return { x: null, y: null }
    }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  /**
   * Draw an arrow from (x1, y1) to (x2, y2) on the canvas
   */
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    // Clear the canvas before drawing a new arrow
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw the main line
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = "red"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw arrowhead
    const headLength = 10
    const angle = Math.atan2(y2 - y1, x2 - x1)

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6))
    ctx.lineTo(x2, y2)
    ctx.fillStyle = "red"
    ctx.fill()
  }

  /**
   * Mouse down: Start drawing arrow
   */
  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setArrowSubmitted(false)

    const coords = getRelativeCoords(event)
    setStartCoords(coords)
    setEndCoords(coords)
  }

  /**
   * Mouse move: Update current end coords if drawing
   */
  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const coords = getRelativeCoords(event)
    setMousePosition(coords)
    if (!isDrawing) return
    setEndCoords(coords)
  }

  /**
   * Mouse up: Finalize arrow
   */
  const handleMouseUp = (event: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false)
    const coords = getRelativeCoords(event)
    setEndCoords(coords)
  }

  /**
   * Re-draw arrow on each coords update while canvas is available.
   */
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Only draw if we have valid start and end coords
    if (startCoords.x !== null && startCoords.y !== null && endCoords.x !== null && endCoords.y !== null) {
      drawArrow(ctx, startCoords.x, startCoords.y, endCoords.x, endCoords.y)
    }
  }, [startCoords, endCoords, drawArrow]) // Added drawArrow to dependencies

  /**
   * Submit arrow coordinates.
   */
  const handleSubmitArrow = () => {
    if (startCoords.x !== null && startCoords.y !== null && endCoords.x !== null && endCoords.y !== null) {
      const points = [startCoords, endCoords]
      setCoordinates(points)

      // Create a simple path string
      const path = generateLinePoints(startCoords, endCoords, 49)
      setCoordinatePath(path)

      setArrowSubmitted(true)
      console.log("Arrow coordinates submitted:", points)
      console.log("Arrow path submitted:", path)
    }
  }

  /**
   * Reset arrow drawing and clear canvas.
   */
  const handleResetArrow = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    setStartCoords({ x: null, y: null })
    setEndCoords({ x: null, y: null })
    setArrowSubmitted(false)
  }

  const renderCoordinateDisplay = () => {
    if (mousePosition.x === null || mousePosition.y === null) return null
    return (
      <div
        className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none"
        style={{
          left: `${mousePosition.x + 10}px`,
          top: `${mousePosition.y + 10}px`,
          zIndex: 10,
        }}
      >
        X: {Math.round(mousePosition.x)}, Y: {Math.round(mousePosition.y)}
      </div>
    )
  }

  // If there's no segmented image, we can either return null or a placeholder
  if (!segmentedImageUrl) {
    return null
  }
  

  return (
    <div>
      <h3 className="text-center">
        <span className="relative z-10">
          Draw an arrow that describes the direction of movement.
        </span>
      </h3>
      <div className="relative border-2 border-deepGreen rounded-lg overflow-hidden">
        <img src={segmentedImageUrl || "/placeholder.svg"} alt="Segmented" className="w-full h-auto" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          width={720}
          height={480}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseEnter={() => setIsMouseOverCanvas(true)}
          onMouseLeave={() => {
            setIsMouseOverCanvas(false)
            setMousePosition({ x: null, y: null })
          }}
          style={{ cursor: "crosshair" }}
        />
        {isMouseOverCanvas && renderCoordinateDisplay()}

        <div className="flex space-x-2 p-2">
          <button
            onClick={handleSubmitArrow}
            disabled={startCoords.x === null || startCoords.y === null || endCoords.x === null || endCoords.y === null}
            className="flex-1 bg-deepGreen hover:bg-deepGreen/90 text-white py-2 rounded"
          >
            Submit Arrow
          </button>

          <button
            onClick={handleResetArrow}
            disabled={startCoords.x === null && endCoords.x === null}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded"
          >
            Reset Arrow
          </button>
        </div>

        {arrowSubmitted && <p className="text-center text-green-700 mt-2">Arrow coordinates submitted!</p>}
      </div>
    </div>
  )
}

export default DrawArrow

