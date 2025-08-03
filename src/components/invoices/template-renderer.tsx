'use client'

import { Image } from 'lucide-react'
import { TemplateElement } from './template-builder'

// Fonction utilitaire pour convertir une valeur en CSS
const toCssValue = (value: number | string | undefined, defaultUnit = 'px'): string => {
  if (value === undefined || value === null) return '0px'
  if (typeof value === 'string') {
    // Si c'est déjà une string avec unité, la retourner
    if (/^\d+(\.\d+)?(px|%|em|rem|vh|vw)$/.test(value)) return value
    // Si c'est une string sans unité, ajouter l'unité par défaut
    if (/^\d+(\.\d+)?$/.test(value)) return `${value}${defaultUnit}`
    return value
  }
  // Si c'est un nombre, ajouter l'unité par défaut
  return `${value}${defaultUnit}`
}

export interface TemplateRendererProps {
  elements: TemplateElement[]
  className?: string
  variables?: Record<string, any>
}

// Fonction pour remplacer les variables dans le texte
function replaceVariables(text: string, variables: Record<string, any> = {}): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
    const keys = variablePath.trim().split('.')
    let value = variables
    
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    
    return value !== undefined ? String(value) : match
  })
}

// Composant pour rendre un élément de template
function TemplateElementRenderer({ 
  element, 
  variables = {},
  level = 0 
}: { 
  element: TemplateElement
  variables?: Record<string, any>
  level?: number
}) {
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        const textContent = replaceVariables(element.content?.text || 'Texte par défaut', variables)
        return (
          <div 
            className="text-content"
            style={{ 
              fontFamily: element.style.font?.family,
              fontSize: `${element.style.font?.size}px`,
              fontWeight: element.style.font?.weight,
              color: element.style.font?.color,
              textAlign: element.style.font?.align as any
            }}
          >
            {textContent}
          </div>
        )
      
      case 'image':
        return (
          <div 
            className="overflow-hidden flex items-center justify-center"
            style={{
              width: element.style.size?.width || 100,
              height: element.style.size?.height || 100
            }}
          >
            {element.content?.src ? (
              <img 
                src={element.content.src} 
                alt={element.content.alt || ''} 
                className="max-w-full max-h-full object-contain"
                style={{
                  borderRadius: element.style.border?.radius,
                  border: element.style.border ? `${element.style.border.width}px ${element.style.border.style} ${element.style.border.color}` : undefined
                }}
                onLoad={(e) => {
                  // S'assurer que l'image est visible lors de l'impression
                  e.currentTarget.style.printColorAdjust = 'exact'
                  e.currentTarget.setAttribute('style', 
                    e.currentTarget.getAttribute('style') + '; -webkit-print-color-adjust: exact;'
                  )
                }}
              />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center w-full h-full">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        )
      
      case 'variable':
        const variableValue = replaceVariables(`{{${element.content?.variable || 'variable'}}}`, variables)
        return (
          <div 
            className="inline-block px-2 py-1 rounded text-sm"
            style={{
              backgroundColor: element.style.background,
              fontFamily: element.style.font?.family,
              fontSize: toCssValue(element.style.font?.size),
              fontWeight: element.style.font?.weight,
              color: element.style.font?.color,
              textAlign: element.style.font?.align as any,
              border: element.style.border ? `${element.style.border.width}px ${element.style.border.style} ${element.style.border.color}` : undefined,
              borderRadius: element.style.border?.radius
            }}
          >
            {variableValue}
          </div>
        )
      
      case 'table':
        const formatValue = (value: any, format: string) => {
          if (!value && value !== 0) return ''
          
          switch (format) {
            case 'currency':
              return `${parseFloat(value).toFixed(2)} €`
            case 'number':
              return parseFloat(value).toString()
            case 'percentage':
              return `${parseFloat(value).toFixed(1)}%`
            case 'date':
              return new Date(value).toLocaleDateString('fr-FR')
            default:
              return value.toString()
          }
        }

        const calculateTotalValue = (type: string, items: any[]) => {
          if (!items || !Array.isArray(items)) return 0

          switch (type) {
            case 'subtotal':
              return items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
            case 'tax':
              return items.reduce((sum, item) => sum + (parseFloat(item.taxAmount) || 0), 0)
            case 'total':
              return items.reduce((sum, item) => sum + (parseFloat(item.totalTTC) || parseFloat(item.total) || 0), 0)
            case 'discount':
              return items.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0)
            case 'shipping':
              return parseFloat(variables.invoice?.shipping || 0)
            default:
              return 0
          }
        }

        const renderTableRows = () => {
          if (element.content?.dataSource === 'items' && variables.items) {
            // Filtrer les colonnes actives seulement
            const activeColumns = element.content?.columns?.filter((col: any) => col.id) || []
            
            // Appliquer le maximum de lignes si configuré
            const items = element.content?.maxRows && element.content.maxRows > 0 
              ? variables.items.slice(0, element.content.maxRows)
              : variables.items

            // Rendu dynamique basé sur les articles
            return items.map((item: any, rowIndex: number) => {
              // Calculer le style des lignes alternées
              const isEvenRow = rowIndex % 2 === 0
              const stripeStyle = element.content?.stripeRows && !isEvenRow 
                ? { backgroundColor: '#f9fafb' } 
                : {}

              return (
                <tr key={rowIndex} style={stripeStyle}>
                  {activeColumns.map((column: any, colIndex: number) => {
                    let cellValue = ''
                    
                    if (column.type === 'variable' || !column.type) {
                      // Extraire la valeur depuis l'item
                      const variableParts = column.variable.split('.')
                      if (variableParts[0] === 'items' && variableParts[1]) {
                        cellValue = item[variableParts[1]] || ''
                      } else {
                        cellValue = replaceVariables(`{{${column.variable}}}`, variables)
                      }
                    } else {
                      cellValue = column.text || ''
                    }

                    const formattedValue = formatValue(cellValue, column.format || 'text')

                    // Calculer le padding basé sur l'espacement configuré
                    let padding = '6px'
                    if (element.content?.cellSpacing === 'compact') {
                      padding = '4px'
                    } else if (element.content?.cellSpacing === 'spacious') {
                      padding = '10px'
                    }

                    return (
                      <td 
                        key={colIndex} 
                        style={{
                          width: column.width !== 'auto' ? column.width : undefined,
                          textAlign: column.align || 'left',
                          backgroundColor: stripeStyle.backgroundColor || column.cellStyle?.backgroundColor || '#ffffff',
                          color: column.cellStyle?.color || '#374151',
                          fontWeight: column.cellStyle?.fontWeight || 'normal',
                          fontSize: column.cellStyle?.fontSize || '10px',
                          padding: padding,
                          border: element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'
                        }}
                      >
                        {formattedValue}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          } else {
            // Rendu statique basé sur les lignes définies
            return element.content?.rows?.map((row: string[], rowIndex: number) => {
              const isEvenRow = rowIndex % 2 === 0
              const stripeStyle = element.content?.stripeRows && !isEvenRow 
                ? { backgroundColor: '#f9fafb' } 
                : {}

              return (
                <tr key={rowIndex} style={stripeStyle}>
                  {row.map((cell, cellIndex) => {
                    const column = element.content?.columns?.[cellIndex] || {}
                    
                    let padding = '6px'
                    if (element.content?.cellSpacing === 'compact') {
                      padding = '4px'
                    } else if (element.content?.cellSpacing === 'spacious') {
                      padding = '10px'
                    }

                    return (
                      <td 
                        key={cellIndex} 
                        style={{
                          width: column.width !== 'auto' ? column.width : undefined,
                          textAlign: column.align || 'left',
                          backgroundColor: stripeStyle.backgroundColor || column.cellStyle?.backgroundColor || '#ffffff',
                          color: column.cellStyle?.color || '#374151',
                          fontWeight: column.cellStyle?.fontWeight || 'normal',
                          fontSize: column.cellStyle?.fontSize || '10px',
                          padding: padding,
                          border: element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'
                        }}
                      >
                        {replaceVariables(cell, variables)}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          }
        }

        const renderTotalRows = () => {
          if (!element.content?.showTotals || !element.content?.totalRows) return null

          return element.content.totalRows.map((totalRow: any, index: number) => {
            let value = '0.00 €'
            
            if (totalRow.type === 'custom') {
              value = totalRow.value || '0.00'
              if (value.includes('{{') && value.includes('}}')) {
                value = replaceVariables(value, variables)
              }
            } else {
              const calculatedValue = calculateTotalValue(totalRow.type, variables.items || [])
              value = formatValue(calculatedValue, totalRow.format || 'currency')
            }

            // Compter les colonnes actives pour le colspan
            const activeColumns = element.content?.columns?.filter((col: any) => col.id) || element.content?.columns || []
            const colSpan = activeColumns.length || 1
            const labelColSpan = Math.max(1, colSpan - 1)

            // Déterminer le style selon la configuration
            let backgroundColor = totalRow.style?.backgroundColor || '#f8fafc'
            let fontWeight = totalRow.style?.fontWeight || 'normal'
            let border = element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'

            // Appliquer les styles selon le type de total
            if (element.content?.totalStyle === 'highlighted') {
              backgroundColor = totalRow.type === 'total' ? '#fef3c7' : '#f3f4f6'
            } else if (element.content?.totalStyle === 'boxed') {
              border = '2px solid #374151'
              backgroundColor = '#f9fafb'
            }

            if (totalRow.type === 'total') {
              fontWeight = 'bold'
            }

            // Position des totaux
            const textAlign = element.content?.totalPosition === 'center' ? 'center' : 
                            element.content?.totalPosition === 'left' ? 'left' : 'right'

            // Calculer le padding des totaux selon l'espacement configuré
            let totalPadding = totalRow.style?.padding || '8px'
            if (element.content?.cellSpacing === 'compact') {
              totalPadding = '6px'
            } else if (element.content?.cellSpacing === 'spacious') {
              totalPadding = '12px'
            }

            return (
              <tr key={`total-${index}`}>
                <td 
                  colSpan={labelColSpan}
                  style={{
                    textAlign: textAlign,
                    backgroundColor: backgroundColor,
                    color: totalRow.style?.color || '#1f2937',
                    fontWeight: fontWeight,
                    fontSize: totalRow.style?.fontSize || '11px',
                    padding: totalPadding,
                    border: border
                  }}
                >
                  {totalRow.label}
                </td>
                <td 
                  style={{
                    textAlign: 'right',
                    backgroundColor: backgroundColor,
                    color: totalRow.style?.color || '#1f2937',
                    fontWeight: fontWeight,
                    fontSize: totalRow.style?.fontSize || '11px',
                    padding: totalPadding,
                    border: border
                  }}
                >
                  {value}
                </td>
              </tr>
            )
          })
        }

        return (
          <div 
            className="w-full"
            style={{
              display: 'flex',
              justifyContent: element.content?.alignment === 'center' ? 'center' : 
                           element.content?.alignment === 'right' ? 'flex-end' : 'flex-start'
            }}
          >
            <table 
              style={{
                borderCollapse: 'collapse',
                width: element.content?.width || '100%',
                border: element.style?.border ? `${element.style.border.width}px ${element.style.border.style} ${element.style.border.color}` : '1px solid #d1d5db',
                borderRadius: element.style?.border?.radius || 0,
                fontFamily: element.style?.font?.family || 'Arial, sans-serif'
              }}
            >
              <thead style={{ position: element.content?.fixedHeader ? 'sticky' : 'static', top: 0, zIndex: 1 }}>
                <tr>
                  {(() => {
                    // Filtrer pour ne montrer que les colonnes actives
                    const activeColumns = element.content?.columns?.filter((col: any) => col.id) || element.content?.columns || []
                    
                    return activeColumns.map((column: any, index: number) => {
                      const headerText = column.header || `Colonne ${index + 1}`
                      
                      // Calculer le padding basé sur l'espacement configuré
                      let padding = '8px'
                      if (element.content?.cellSpacing === 'compact') {
                        padding = '6px'
                      } else if (element.content?.cellSpacing === 'spacious') {
                        padding = '12px'
                      }
                      
                      return (
                        <th 
                          key={index} 
                          style={{
                            width: column.width !== 'auto' ? column.width : undefined,
                            textAlign: column.align || 'left',
                            backgroundColor: column.headerStyle?.backgroundColor || '#f8fafc',
                            color: column.headerStyle?.color || '#1f2937',
                            fontWeight: column.headerStyle?.fontWeight || 'bold',
                            fontSize: column.headerStyle?.fontSize || '11px',
                            padding: padding,
                            border: element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'
                          }}
                        >
                          {replaceVariables(headerText, variables)}
                        </th>
                      )
                    })
                  })()}
                </tr>
              </thead>
              <tbody>
                {renderTableRows()}
                {renderTotalRows()}
              </tbody>
            </table>
          </div>
        )
      
      case 'divider':
        return (
          <div 
            className="w-full"
            style={{
              height: element.style.size?.height || 1,
              backgroundColor: element.style.background || '#e5e7eb',
              marginTop: element.style.margin?.top,
              marginBottom: element.style.margin?.bottom
            }}
          />
        )
      
      case 'spacer':
        return (
          <div 
            className="w-full"
            style={{
              height: element.style.size?.height || 20
            }}
          />
        )
      
      case 'qrcode':
        {
          const qrSize = element.content?.size || 100
          const bgColor = (element.content?.backgroundColor || '#ffffff').replace('#', '')
          const fgColor = (element.content?.foregroundColor || '#000000').replace('#', '')
          const qrData = encodeURIComponent(replaceVariables(element.content?.data || 'https://example.com', variables))
          
          return (
            <div style={{ display: 'inline-block' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${qrData}&bgcolor=${bgColor}&color=${fgColor}`}
                alt="QR Code"
                style={{
                  width: qrSize,
                  height: qrSize,
                  display: 'block'
                }}
              />
            </div>
          )
        }
      
      default:
        // Pour les containers (header, section, footer, container)
        return null
    }
  }

  const hasChildren = element.children && element.children.length > 0
  const canContainChildren = element.constraints?.canContain && element.constraints.canContain.length > 0

  return (
    <div
      style={{
        position: (element.style.position?.type || 'relative') as any,
        left: element.style.position?.type === 'absolute' ? element.style.position?.x : undefined,
        top: element.style.position?.type === 'absolute' ? element.style.position?.y : undefined,
        zIndex: element.style.position?.zIndex,
        padding: `${element.style.padding?.top || 0}px ${element.style.padding?.right || 0}px ${element.style.padding?.bottom || 0}px ${element.style.padding?.left || 0}px`,
        margin: `${element.style.margin?.top || 0}px ${element.style.margin?.right || 0}px ${element.style.margin?.bottom || 0}px ${element.style.margin?.left || 0}px`,
        backgroundColor: element.style.background,
        border: element.style.border ? `${element.style.border.width}px ${element.style.border.style} ${element.style.border.color}` : undefined,
        borderRadius: element.style.border?.radius,
        display: element.style.flex ? 'flex' : (element.style.display || 'block'),
        flexDirection: element.style.flex?.direction as any,
        justifyContent: element.style.flex?.justify === 'flex-start' ? 'flex-start' : 
                       element.style.flex?.justify === 'flex-end' ? 'flex-end' :
                       element.style.flex?.justify === 'start' ? 'flex-start' :
                       element.style.flex?.justify === 'end' ? 'flex-end' :
                       element.style.flex?.justify || 'flex-start',
        alignItems: element.style.flex?.align === 'flex-start' ? 'flex-start' : 
                   element.style.flex?.align === 'flex-end' ? 'flex-end' :
                   element.style.flex?.align === 'start' ? 'flex-start' :
                   element.style.flex?.align === 'end' ? 'flex-end' :
                   element.style.flex?.align || 'stretch',
        flexWrap: element.style.flex?.wrap as any,
        gridTemplateColumns: element.style.grid ? `repeat(${element.style.grid.columns}, 1fr)` : undefined,
        gridTemplateRows: element.style.grid ? `repeat(${element.style.grid.rows}, 1fr)` : undefined,
        gap: element.style.grid?.gap,
        width: element.style.size?.width,
        height: element.style.size?.height,
        fontFamily: element.style.font?.family,
        fontSize: element.style.font?.size ? `${element.style.font.size}px` : undefined,
        fontWeight: element.style.font?.weight,
        color: element.style.font?.color,
        textAlign: element.style.font?.align as any
      }}
    >
      {/* Contenu : soit les enfants, soit le contenu de l'élément */}
      {canContainChildren && hasChildren ? (
        // Afficher directement les enfants pour les containers
        element.children!.map((child) => (
          <TemplateElementRenderer
            key={child.id}
            element={child}
            variables={variables}
            level={level + 1}
          />
        ))
      ) : (
        // Pour les éléments non-containers, afficher le contenu normal
        renderContent()
      )}
    </div>
  )
}

// Composant principal du renderer
export function TemplateRenderer({ elements, className = '', variables = {} }: TemplateRendererProps) {
  return (
    <div className={`template-renderer ${className}`}>
      {elements.map((element) => (
        <TemplateElementRenderer
          key={element.id}
          element={element}
          variables={variables}
        />
      ))}
    </div>
  )
} 