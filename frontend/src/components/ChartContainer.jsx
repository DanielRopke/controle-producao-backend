import * as React from "react"
import * as RechartsPrimitive from "recharts"

// Copiado e adaptado de smart-report-refine-main/src/components/ui/chart.tsx
// Remove dependências de utilitários externos e ajusta para uso local


/**
 * @typedef {Object} ChartConfig
 * @property {string} label
 * @property {React.ComponentType} [icon]
 * @property {string} [color]
 */

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

export const ChartContainer = React.forwardRef(
  function ChartContainer({ config, className, children, ...props }, ref) {
    const uniqueId = React.useId()
    const chartId = `chart-${uniqueId.replace(/:/g, "")}`
    return (
      <ChartContext.Provider value={{ config }}>
        <div ref={ref} className={"flex aspect-video justify-center text-xs " + (className || "")} data-chart={chartId} {...props}>
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)

export const ChartTooltip = RechartsPrimitive.Tooltip
export const ChartLegend = RechartsPrimitive.Legend

// Helper para extrair config do payload
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) return undefined
  const payloadPayload = payload.payload && typeof payload.payload === "object" ? payload.payload : undefined
  let configLabelKey = key
  if (key in payload && typeof payload[key] === "string") configLabelKey = payload[key]
  else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") configLabelKey = payloadPayload[key]
  return config[configLabelKey] || config[key]
}

export function ChartTooltipContent({ active, payload, className, label, formatter, nameKey, labelKey }) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  return (
    <div className={"rounded-lg border bg-white px-2.5 py-1.5 text-xs shadow-xl " + (className || "") }>
      {payload.map((item, idx) => {
        const key = `${nameKey || item.name || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)
        return (
          <div key={item.dataKey} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded" style={{ backgroundColor: item.color || (itemConfig && itemConfig.color) }} />
            <span>{itemConfig?.label || item.name}</span>
            <span className="ml-auto font-mono font-medium">{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ChartLegendContent({ payload, className }) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <div className={"flex items-center gap-4 " + (className || "") }>
      {payload.map((item) => {
        const key = `${item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)
        return (
          <div key={item.value} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: item.color || (itemConfig && itemConfig.color) }} />
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
}
