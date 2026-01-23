import * as React from "react"
import { cn } from "@/lib/utils"

export interface ColorPickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  label?: string
  showPreview?: boolean
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, value = "#000000", onChange, label, showPreview = true, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="flex items-center gap-3">
          {showPreview && (
            <div
              className="w-10 h-10 rounded-md border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: value }}
            />
          )}
          <div className="flex-1 flex items-center gap-2">
            <input
              type="color"
              ref={ref}
              value={value}
              onChange={handleChange}
              className={cn(
                "h-10 w-full cursor-pointer rounded-md border border-gray-300 bg-transparent",
                className
              )}
              {...props}
            />
            <input
              type="text"
              value={value}
              onChange={handleChange}
              className="h-10 w-24 rounded-md border border-gray-300 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="#000000"
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
            />
          </div>
        </div>
      </div>
    )
  }
)

ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
