'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  Over,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Type, 
  Image, 
  Hash, 
  Calendar, 
  DollarSign, 
  FileText, 
  Layout,
  Columns,
  Rows,
  Box,
  Settings,
  Save,
  Eye,
  Trash2,
  Move,
  RotateCcw,
  Plus,
  Package as ContainerIcon,
  Heading as HeaderIcon,
  MoreHorizontal,
  Upload,
  GripVertical,
  Palette,
  Calculator,
  Undo,
  Redo,
  ArrowLeft,
  QrCode,
  ScanLine,
  Clock,
  PenTool,
  Zap,
  Square,
  Grid3X3,
  Minus,
  SeparatorHorizontal,
  Badge as BadgeIcon,
  AlertCircle,
  ShieldCheck,
  Star,
  Target,
  Clipboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

// Types pour les valeurs avec unités
export interface ValueWithUnit {
  value: number
  unit: 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw'
}

export interface SpacingWithUnit {
  top: ValueWithUnit
  right: ValueWithUnit
  bottom: ValueWithUnit
  left: ValueWithUnit
}

export interface SizeWithUnit {
  width: ValueWithUnit | 'auto'
  height: ValueWithUnit | 'auto'
}

export interface PositionWithUnit {
  x: ValueWithUnit
  y: ValueWithUnit
  type?: string
  zIndex?: number
}

// Types étendus pour l'imbrication
export interface TemplateElement {
  id: string
  type: 'text' | 'image' | 'variable' | 'table' | 'container' | 'header' | 'footer' | 'section' | 'divider' | 'spacer' | 'qrcode' | 'barcode' | 'date' | 'signature' | 'logo' | 'calculator' | 'badge' | 'status' | 'line-break' | 'page-break' | 'background-shape' | 'border-frame' | 'column-layout' | 'grid-layout' | 'flex-layout' | 'card-layout'
  content?: any
  style: {
    position?: { x: number; y: number; type?: string; zIndex?: number }
    size?: { width: number | string; height: number | string }
    padding?: { top: number; right: number; bottom: number; left: number }
    margin?: { top: number; right: number; bottom: number; left: number }
    background?: string
    border?: { width: number; style: string; color: string; radius: number }
    font?: { family: string; size: number; weight: string; color: string; align: string }
    display?: 'block' | 'inline' | 'flex' | 'grid'
    flex?: { direction: string; justify: string; align: string; wrap: string }
    grid?: { columns: number; rows: number; gap: number }
  }
  children?: TemplateElement[]
  parent?: string
  constraints?: {
    canContain?: string[]
    canBeContainedIn?: string[]
    minChildren?: number
    maxChildren?: number
    resizable?: boolean
    movable?: boolean
  }
}

interface TemplateBuilderProps {
  template?: any
  onSave?: (template: any) => void
  onCancel?: () => void
}

// Hook personnalisé pour gérer l'historique avec undo/redo
function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)

  const pushToHistory = useCallback((newState: T) => {
    setHistory(prev => {
      // Supprimer tout ce qui vient après l'index actuel (en cas de redo puis nouvelle action)
      const newHistory = prev.slice(0, currentIndex + 1)
      // Ajouter le nouvel état
      newHistory.push(newState)
      // Limiter l'historique à 50 états pour éviter les fuites mémoire
      return newHistory.slice(-50)
    })
    setCurrentIndex(prev => Math.min(prev + 1, 49))
  }, [currentIndex])

  const resetHistory = useCallback((newInitialState: T) => {
    setHistory([newInitialState])
    setCurrentIndex(0)
  }, [])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, history.length])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1
  const currentState = history[currentIndex] || []

  return {
    currentState,
    pushToHistory,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex
  }
}

// Composant pour les zones de drop entre éléments
function DropZone({ 
  index, 
  parentId = null, 
  isActive = false 
}: { 
  index: number
  parentId?: string | null
  isActive?: boolean 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-zone-${parentId || 'root'}-${index}`,
    data: { 
      type: 'drop-zone',
      index,
      parentId
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-2 transition-all duration-200 flex items-center justify-center",
        isOver || isActive ? "h-8 bg-blue-100 border-2 border-dashed border-blue-400" : "hover:h-4 hover:bg-gray-100"
      )}
    >
      {(isOver || isActive) && (
        <div className="text-xs text-blue-600 font-medium">
          Déposer ici
        </div>
      )}
    </div>
  )
}

// Éléments disponibles dans la palette
const paletteItems = [
  // Contenants
  { 
    type: 'container', 
    icon: ContainerIcon, 
    label: 'Container',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'section', 'divider', 'spacer'],
      canBeContainedIn: ['header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'header', 
    icon: HeaderIcon, 
    label: 'Header',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'container', 'divider'],
      canBeContainedIn: [],
      maxChildren: 10,
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'section', 
    icon: Box, 
    label: 'Section',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'container', 'table', 'divider', 'spacer'],
      canBeContainedIn: ['container'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'footer', 
    icon: Layout, 
    label: 'Footer',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'container'],
      canBeContainedIn: [],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'column-layout', 
    icon: Columns, 
    label: 'Colonnes',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'section', 'divider'],
      canBeContainedIn: ['container', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'grid-layout', 
    icon: Grid3X3, 
    label: 'Grille',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'section'],
      canBeContainedIn: ['container', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'flex-layout', 
    icon: Box, 
    label: 'Flex',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'container'],
      canBeContainedIn: ['container', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'card-layout', 
    icon: Clipboard, 
    label: 'Carte',
    category: 'layout',
    constraints: {
      canContain: ['text', 'image', 'variable', 'divider'],
      canBeContainedIn: ['container', 'section'],
      resizable: true,
      movable: true
    }
  },
  
  // Éléments de contenu
  { 
    type: 'text', 
    icon: Type, 
    label: 'Texte',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'image', 
    icon: Image, 
    label: 'Image',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'variable', 
    icon: Hash, 
    label: 'Variable',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: false,
      movable: true
    }
  },
  { 
    type: 'table', 
    icon: Columns, 
    label: 'Tableau',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['section', 'container'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'qrcode', 
    icon: QrCode, 
    label: 'QR Code',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'barcode', 
    icon: ScanLine, 
    label: 'Code-barres',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'date', 
    icon: Calendar, 
    label: 'Date/Heure',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: false,
      movable: true
    }
  },
  { 
    type: 'signature', 
    icon: PenTool, 
    label: 'Signature',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'logo', 
    icon: Zap, 
    label: 'Logo',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'calculator', 
    icon: Calculator, 
    label: 'Calculateur',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'section'],
      resizable: false,
      movable: true
    }
  },
  { 
    type: 'badge', 
    icon: BadgeIcon, 
    label: 'Badge',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: false,
      movable: true
    }
  },
  { 
    type: 'status', 
    icon: AlertCircle, 
    label: 'Statut',
    category: 'content',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: false,
      movable: true
    }
  },
  
  // Éléments de mise en forme
  { 
    type: 'divider', 
    icon: MoreHorizontal, 
    label: 'Séparateur',
    category: 'formatting',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: false,
      movable: true
    }
  },
  { 
    type: 'spacer', 
    icon: Rows, 
    label: 'Espacement',
    category: 'formatting',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'line-break', 
    icon: Minus, 
    label: 'Saut de ligne',
    category: 'formatting',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: false,
      movable: true
    }
  },
  { 
    type: 'page-break', 
    icon: SeparatorHorizontal, 
    label: 'Saut de page',
    category: 'formatting',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'section'],
      resizable: false,
      movable: true
    }
  },
  { 
    type: 'background-shape', 
    icon: Square, 
    label: 'Forme',
    category: 'formatting',
    constraints: {
      canContain: [],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
  { 
    type: 'border-frame', 
    icon: Target, 
    label: 'Cadre',
    category: 'formatting',
    constraints: {
      canContain: ['text', 'image', 'variable'],
      canBeContainedIn: ['container', 'header', 'footer', 'section'],
      resizable: true,
      movable: true
    }
  },
]

// Valeurs par défaut pour chaque type d'élément
const defaultElementProperties: Record<string, Partial<TemplateElement>> = {
  container: {
    style: {
      display: 'flex',
      flex: { direction: 'column', justify: 'flex-start', align: 'stretch', wrap: 'nowrap' },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      background: 'transparent',
      border: { width: 1, style: 'solid', color: '#e5e7eb', radius: 8 },
      font: { family: 'Arial', size: 14, weight: 'normal', color: '#1f2937', align: 'left' }
    },
    children: []
  },
  header: {
    style: {
      display: 'flex',
      flex: { direction: 'row', justify: 'space-between', align: 'center', wrap: 'nowrap' },
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      background: '#f8fafc',
      border: { width: 0, style: 'none', color: 'transparent', radius: 0 }
    },
    children: [
      {
        id: 'header-logo',
        type: 'image',
        content: { src: '', alt: 'Logo entreprise', width: 80, height: 80 },
        style: {
          size: { width: 80, height: 80 },
          border: { width: 1, style: 'dashed', color: '#d1d5db', radius: 8 },
          margin: { top: 0, right: 16, bottom: 0, left: 0 }
        },
        constraints: {
          canContain: [],
          canBeContainedIn: ['header', 'container'],
          resizable: true,
          movable: true
        }
      },
      {
        id: 'header-company-info',
        type: 'container',
        style: {
          display: 'flex',
          flex: { direction: 'column', justify: 'flex-start', align: 'flex-start', wrap: 'nowrap' },
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          background: 'transparent'
        },
        children: [
          {
            id: 'company-name',
            type: 'text',
            content: { text: 'NOM DE VOTRE ENTREPRISE' },
            style: {
              font: { family: 'Arial', size: 24, weight: 'bold', color: '#1f2937', align: 'left' },
              margin: { top: 0, right: 0, bottom: 4, left: 0 }
            },
            constraints: {
              canContain: [],
              canBeContainedIn: ['container', 'header', 'footer', 'section'],
              resizable: true,
              movable: true
            }
          },
          {
            id: 'company-tagline',
            type: 'text',
            content: { text: 'Votre slogan ou description' },
            style: {
              font: { family: 'Arial', size: 14, weight: 'normal', color: '#6b7280', align: 'left' },
              margin: { top: 0, right: 0, bottom: 0, left: 0 }
            },
            constraints: {
              canContain: [],
              canBeContainedIn: ['container', 'header', 'footer', 'section'],
              resizable: true,
              movable: true
            }
          }
        ],
        constraints: {
          canContain: ['text', 'image', 'variable'],
          canBeContainedIn: ['header', 'section'],
          resizable: true,
          movable: true
        }
      },
      {
        id: 'header-contact',
        type: 'container',
        style: {
          display: 'flex',
          flex: { direction: 'column', justify: 'flex-start', align: 'flex-end', wrap: 'nowrap' },
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          background: 'transparent'
        },
        children: [
          {
            id: 'company-email',
            type: 'variable',
            content: { variable: 'company.email', format: 'text' },
            style: {
              font: { family: 'Arial', size: 12, weight: 'normal', color: '#374151', align: 'right' },
              background: 'transparent',
              padding: { top: 2, right: 0, bottom: 2, left: 0 },
              margin: { top: 0, right: 0, bottom: 2, left: 0 }
            },
            constraints: {
              canContain: [],
              canBeContainedIn: ['container', 'header', 'footer', 'section'],
              resizable: false,
              movable: true
            }
          },
          {
            id: 'company-phone',
            type: 'variable',
            content: { variable: 'company.phone', format: 'text' },
            style: {
              font: { family: 'Arial', size: 12, weight: 'normal', color: '#374151', align: 'right' },
              background: 'transparent',
              padding: { top: 2, right: 0, bottom: 2, left: 0 },
              margin: { top: 0, right: 0, bottom: 0, left: 0 }
            },
            constraints: {
              canContain: [],
              canBeContainedIn: ['container', 'header', 'footer', 'section'],
              resizable: false,
              movable: true
            }
          }
        ],
        constraints: {
          canContain: ['text', 'image', 'variable'],
          canBeContainedIn: ['header', 'section'],
          resizable: true,
          movable: true
        }
      }
    ]
  },
  section: {
    style: {
      display: 'flex',
      flex: { direction: 'column', justify: 'flex-start', align: 'stretch', wrap: 'nowrap' },
      font: { family: 'Arial', size: 14, weight: 'normal', color: '#1f2937', align: 'left' },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      margin: { top: 0, right: 0, bottom: 16, left: 0 }
    },
    children: []
  },
  footer: {
    style: {
      display: 'flex',
      flex: { direction: 'row', justify: 'center', align: 'center', wrap: 'nowrap' },
      font: { family: 'Arial', size: 12, weight: 'normal', color: '#6b7280', align: 'center' },
      padding: { top: 16, right: 24, bottom: 16, left: 24 },
      background: '#f8fafc',
      border: { width: 0, style: 'none', color: 'transparent', radius: 0 }
    },
    children: []
  },
  text: {
    style: {
      font: { family: 'Arial', size: 14, weight: 'normal', color: '#1f2937', align: 'left' },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    }
  },
  image: {
    content: { src: '', alt: 'Image', width: 100, height: 100 },
    style: {
      size: { width: 100, height: 100 },
      border: { width: 0, style: 'none', color: 'transparent', radius: 4 }
    }
  },
  variable: {
    style: {
      font: { family: 'Arial', size: 14, weight: 'normal', color: '#1f2937', align: 'left' },
      background: '#f3f4f6',
      border: { width: 1, style: 'solid', color: '#d1d5db', radius: 4 },
      padding: { top: 4, right: 8, bottom: 4, left: 8 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    }
  },
  table: {
    style: {
      font: { family: 'Arial', size: 12, weight: 'normal', color: '#1f2937', align: 'left' },
      border: { width: 1, style: 'solid', color: '#d1d5db', radius: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 16, right: 0, bottom: 16, left: 0 }
    },
    content: {
      dataSource: 'items',
      width: '100%',
      alignment: 'left',
      showTotals: true,
      cellBorders: true,
      cellSpacing: 'normal',
      columns: [
        {
          id: 'description',
          header: 'Description',
          variable: 'items.description',
          type: 'variable',
          width: '40%',
          align: 'left',
          format: 'text',
          headerStyle: {
            backgroundColor: '#f8fafc',
            color: '#1f2937',
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '8px'
          },
          cellStyle: {
            backgroundColor: '#ffffff',
            color: '#374151',
            fontWeight: 'normal',
            fontSize: '10px',
            padding: '6px'
          }
        },
        {
          id: 'quantity',
          header: 'Quantité',
          variable: 'items.quantity',
          type: 'variable',
          width: '10%',
          align: 'right',
          format: 'number',
          headerStyle: {
            backgroundColor: '#f8fafc',
            color: '#1f2937',
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '8px'
          },
          cellStyle: {
            backgroundColor: '#ffffff',
            color: '#374151',
            fontWeight: 'normal',
            fontSize: '10px',
            padding: '6px'
          }
        },
        {
          id: 'unitPrice',
          header: 'Prix unitaire',
          variable: 'items.unitPrice',
          type: 'variable',
          width: '15%',
          align: 'right',
          format: 'currency',
          headerStyle: {
            backgroundColor: '#f8fafc',
            color: '#1f2937',
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '8px'
          },
          cellStyle: {
            backgroundColor: '#ffffff',
            color: '#374151',
            fontWeight: 'normal',
            fontSize: '10px',
            padding: '6px'
          }
        },
        {
          id: 'total',
          header: 'Total TTC',
          variable: 'items.total',
          type: 'variable',
          width: '15%',
          align: 'right',
          format: 'currency',
          headerStyle: {
            backgroundColor: '#f8fafc',
            color: '#1f2937',
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '8px'
          },
          cellStyle: {
            backgroundColor: '#ffffff',
            color: '#374151',
            fontWeight: 'normal',
            fontSize: '10px',
            padding: '6px'
          }
        }
      ],
      totalRows: [
        {
          type: 'subtotal',
          label: 'Sous-total HT',
          format: 'currency',
          calculation: 'auto',
          value: null,
          style: {
            backgroundColor: '#ffffff',
            fontWeight: 'normal',
            fontSize: '11px',
            padding: '8px'
          }
        },
        {
          type: 'tax',
          label: 'TVA totale',
          format: 'currency',
          calculation: 'auto',
          value: null,
          style: {
            backgroundColor: '#ffffff',
            fontWeight: 'normal',
            fontSize: '11px',
            padding: '8px'
          }
        },
        {
          type: 'total',
          label: 'Total TTC',
          format: 'currency',
          calculation: 'auto',
          value: null,
          style: {
            backgroundColor: '#f3f4f6',
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '8px'
          }
        }
      ]
    }
  },
  divider: {
    style: {
      size: { width: '100%', height: 1 },
      background: '#e5e7eb',
      margin: { top: 8, right: 0, bottom: 8, left: 0 }
    }
  },
  spacer: {
    style: {
      size: { width: '100%', height: 20 },
      background: 'transparent'
    }
  },
  
  // Nouveaux éléments de contenu
  qrcode: {
    content: { 
      data: 'https://example.com', 
      size: 100,
      backgroundColor: '#ffffff',
      foregroundColor: '#000000'
    },
    style: {
      size: { width: 100, height: 100 },
      background: 'transparent',
      border: { width: 1, style: 'dashed', color: '#d1d5db', radius: 4 }
    }
  },
  barcode: {
    content: { data: '123456789', type: 'code128', width: 200, height: 50 },
    style: {
      size: { width: 200, height: 50 },
      background: 'transparent'
    }
  },
  date: {
    content: { format: 'DD/MM/YYYY', type: 'current' },
    style: {
      font: { family: 'Arial', size: 12, weight: 'normal', color: '#374151', align: 'left' },
      background: 'transparent'
    }
  },
  signature: {
    content: { placeholder: 'Signature', width: 150, height: 75 },
    style: {
      size: { width: 150, height: 75 },
      background: 'transparent',
      border: { width: 1, style: 'solid', color: '#d1d5db', radius: 4 }
    }
  },
  logo: {
    content: { src: '', alt: 'Logo', width: 120, height: 60 },
    style: {
      size: { width: 120, height: 60 },
      background: 'transparent',
      border: { width: 1, style: 'dashed', color: '#d1d5db', radius: 4 }
    }
  },
  calculator: {
    content: { formula: 'SUM', field: 'amount', format: 'currency' },
    style: {
      font: { family: 'Arial', size: 14, weight: 'bold', color: '#059669', align: 'right' },
      background: 'transparent',
      padding: { top: 4, right: 8, bottom: 4, left: 8 }
    }
  },
  badge: {
    content: { text: 'NOUVEAU', style: 'primary' },
    style: {
      font: { family: 'Arial', size: 10, weight: 'bold', color: '#ffffff', align: 'center' },
      background: '#3b82f6',
      padding: { top: 4, right: 8, bottom: 4, left: 8 },
      border: { width: 0, style: 'none', color: 'transparent', radius: 12 }
    }
  },
  status: {
    content: { status: 'ACTIVE', colors: { active: '#10b981', inactive: '#ef4444', pending: '#f59e0b' } },
    style: {
      font: { family: 'Arial', size: 12, weight: 'medium', color: '#ffffff', align: 'center' },
      background: '#10b981',
      padding: { top: 2, right: 6, bottom: 2, left: 6 },
      border: { width: 0, style: 'none', color: 'transparent', radius: 4 }
    }
  },
  
  // Nouveaux éléments de formatage
  'line-break': {
    style: {
      size: { width: '100%', height: 1 },
      background: 'transparent'
    }
  },
  'page-break': {
    style: {
      size: { width: '100%', height: 1 },
      background: 'transparent'
    }
  },
  'background-shape': {
    content: { shape: 'rectangle', fill: '#f3f4f6', opacity: 0.5 },
    style: {
      size: { width: 200, height: 100 },
      background: '#f3f4f6',
      border: { width: 0, style: 'none', color: 'transparent', radius: 8 }
    }
  },
  'border-frame': {
    style: {
      display: 'flex',
      flex: { direction: 'column', justify: 'center', align: 'center', wrap: 'nowrap' },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      background: 'transparent',
      border: { width: 2, style: 'solid', color: '#374151', radius: 8 }
    },
    children: []
  },
  
  // Nouveaux éléments de layout
  'column-layout': {
    style: {
      display: 'flex',
      flex: { direction: 'row', justify: 'space-between', align: 'stretch', wrap: 'nowrap' },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      background: 'transparent'
    },
    children: []
  },
  'grid-layout': {
    style: {
      display: 'grid',
      grid: { columns: 2, rows: 2, gap: 16 },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      background: 'transparent'
    },
    children: []
  },
  'flex-layout': {
    style: {
      display: 'flex',
      flex: { direction: 'row', justify: 'flex-start', align: 'flex-start', wrap: 'wrap' },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      background: 'transparent'
    },
    children: []
  },
  'card-layout': {
    style: {
      display: 'flex',
      flex: { direction: 'column', justify: 'flex-start', align: 'stretch', wrap: 'nowrap' },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      background: '#ffffff',
      border: { width: 1, style: 'solid', color: '#e5e7eb', radius: 8 }
    },
    children: []
  }
}

// Variables disponibles
const availableVariables = [
  { key: 'invoice.number', label: 'Numéro de facture', category: 'Facture' },
  { key: 'invoice.date', label: 'Date de facture', category: 'Facture' },
  { key: 'invoice.dueDate', label: 'Date d\'échéance', category: 'Facture' },
  { key: 'invoice.total', label: 'Total TTC', category: 'Facture' },
  { key: 'invoice.subtotal', label: 'Sous-total HT', category: 'Facture' },
  { key: 'invoice.tax', label: 'TVA', category: 'Facture' },
  { key: 'client.name', label: 'Nom du client', category: 'Client' },
  { key: 'client.company', label: 'Entreprise du client', category: 'Client' },
  { key: 'client.email', label: 'Email du client', category: 'Client' },
  { key: 'client.address', label: 'Adresse du client', category: 'Client' },
  { key: 'company.name', label: 'Nom de l\'entreprise', category: 'Entreprise' },
  { key: 'company.address', label: 'Adresse de l\'entreprise', category: 'Entreprise' },
  { key: 'company.phone', label: 'Téléphone de l\'entreprise', category: 'Entreprise' },
  { key: 'company.email', label: 'Email de l\'entreprise', category: 'Entreprise' },
]

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

// Composant pour saisir une valeur avec unité
function UnitInput({ 
  value, 
  onChange, 
  allowedUnits = ['px', '%', 'em', 'rem'],
  step = 1,
  className = "h-8"
}: { 
  value: number | string
  onChange: (newValue: string) => void
  allowedUnits?: string[]
  step?: number
  className?: string
}) {
  // Parser la valeur actuelle
  const parseValue = (val: number | string) => {
    if (typeof val === 'number') return { value: val, unit: 'px' }
    const match = String(val).match(/^(\d+(?:\.\d+)?)(px|%|em|rem|vh|vw|dvh|dvw)?$/)
    if (match) {
      return { value: parseFloat(match[1]), unit: match[2] || 'px' }
    }
    return { value: 0, unit: 'px' }
  }

  const { value: numValue, unit } = parseValue(value)

  const handleValueChange = (newValue: number) => {
    onChange(`${newValue}${unit}`)
  }

  const handleUnitChange = (newUnit: string) => {
    onChange(`${numValue}${newUnit}`)
  }

  return (
    <div className="flex items-stretch">
      <Input
        type="number"
        value={numValue}
        onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
        className={`${className} rounded-r-none border-r-0 flex-1`}
        step={step}
      />
      <Select value={unit} onValueChange={handleUnitChange}>
        <SelectTrigger className={`${className} w-16 rounded-l-none border-l-0 flex items-center justify-center`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowedUnits.map(unitOption => (
            <SelectItem key={unitOption} value={unitOption}>{unitOption}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Composant pour un élément de la palette
function PaletteItem({ type, icon: Icon, label, category }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `palette-${type}`,
    data: { type, isFromPalette: true }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-col items-center gap-2 p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <Icon className="h-6 w-6 text-gray-600" />
      <span className="text-xs font-medium text-center">{label}</span>
      <Badge variant="outline" className="text-[10px]">{category}</Badge>
    </div>
  )
}

// Composant pour un élément de template
function TemplateElementComponent({ 
  element, 
  selectedElement, 
  onSelect, 
  onUpdate,
  level = 0 
}: { 
  element: TemplateElement
  selectedElement: TemplateElement | null
  onSelect: (element: TemplateElement) => void
  onUpdate: (element: TemplateElement) => void
  level?: number
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: element.id,
    data: { element, isFromCanvas: true }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  const canContainChildren = element.constraints?.canContain && element.constraints.canContain.length > 0

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div 
            className="text-content"
            style={{ 
              fontFamily: element.style.font?.family,
              fontSize: toCssValue(element.style.font?.size),
              fontWeight: element.style.font?.weight,
              color: element.style.font?.color,
              textAlign: element.style.font?.align as any
            }}
          >
            {element.content?.text || 'Texte par défaut'}
          </div>
        )
      
      case 'image':
        return (
          <div 
            className="bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center"
            style={{
              width: element.style.size?.width || 100,
              height: element.style.size?.height || 100
            }}
          >
            {element.content?.src ? (
              <img src={element.content.src} alt={element.content.alt} className="max-w-full max-h-full object-contain" />
            ) : (
              <Image className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )
      
      case 'variable':
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
              border: `${element.style.border?.width}px ${element.style.border?.style} ${element.style.border?.color}`,
              borderRadius: element.style.border?.radius
            }}
          >
            {`{{${element.content?.variable || 'variable'}}}`}
          </div>
        )
      
      case 'table':
        return (
          <div className="w-full">
            <table 
              className="w-full border-collapse"
              style={{ 
                width: element.content?.width || '100%',
                margin: element.content?.alignment === 'center' ? '0 auto' :
                       element.content?.alignment === 'right' ? '0 0 0 auto' : '0'
              }}
            >
              <thead>
                <tr>
                  {(() => {
                    // Filtrer les colonnes actives ou utiliser toutes les colonnes si pas de filtre
                    const activeColumns = element.content?.columns?.filter((col: any) => col.id) || 
                                          element.content?.columns || 
                                          element.content?.headers || []
                    
                    return activeColumns.map((columnOrHeader: any, index: number) => {
                      const headerText = typeof columnOrHeader === 'string' 
                        ? columnOrHeader 
                        : columnOrHeader.header || `Colonne ${index + 1}`
                      
                      // Calculer le style selon la configuration
                      let borderStyle = element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'
                      let padding = element.content?.cellSpacing === 'compact' ? '4px' :
                                   element.content?.cellSpacing === 'spacious' ? '12px' : '8px'
                      
                      return (
                        <th 
                          key={index} 
                          className="bg-gray-50 text-left text-xs font-semibold text-gray-700"
                          style={{
                            border: borderStyle,
                            padding: padding,
                            width: columnOrHeader.width !== 'auto' ? columnOrHeader.width : undefined,
                            textAlign: columnOrHeader.align || 'left'
                          }}
                        >
                          {headerText}
                        </th>
                      )
                    })
                  })()}
                </tr>
              </thead>
              <tbody>
                {element.content?.dataSource === 'items' && element.content?.columns ? (
                  // Aperçu avec des données d'exemple pour les variables
                  (() => {
                    const activeColumns = element.content.columns.filter((col: any) => col.id) || element.content.columns
                    const maxRows = element.content?.maxRows || 3
                    const sampleRows = Array.from({ length: Math.min(maxRows, 3) }, (_, i) => i)
                    
                    return sampleRows.map((_, rowIndex) => {
                      const isEvenRow = rowIndex % 2 === 0
                      const stripeClass = element.content?.stripeRows && !isEvenRow ? 'bg-gray-50' : ''
                      
                      return (
                        <tr key={rowIndex} className={stripeClass}>
                          {activeColumns.map((column: any, colIndex: number) => {
                            let previewValue = ''
                            
                            if (column.type === 'variable') {
                              // Valeurs d'exemple basées sur le type de variable
                              switch (column.variable) {
                                case 'items.description':
                                  previewValue = `Produit ${rowIndex + 1}`
                                  break
                                case 'items.quantity':
                                  previewValue = String(rowIndex + 1)
                                  break
                                case 'items.unitPrice':
                                  previewValue = String((rowIndex + 1) * 50)
                                  break
                                case 'items.total':
                                  previewValue = String((rowIndex + 1) * 50 * (rowIndex + 1))
                                  break
                                case 'items.taxRate':
                                  previewValue = '20'
                                  break
                                case 'items.taxAmount':
                                  previewValue = String(((rowIndex + 1) * 50 * (rowIndex + 1)) * 0.2)
                                  break
                                case 'items.subtotal':
                                  previewValue = String((rowIndex + 1) * 50 * (rowIndex + 1))
                                  break
                                case 'items.discount':
                                  previewValue = '5'
                                  break
                                case 'items.category':
                                  previewValue = 'Service'
                                  break
                                case 'items.reference':
                                  previewValue = `REF-${rowIndex + 1}`
                                  break
                                default:
                                  previewValue = '{{' + column.variable + '}}'
                              }
                              
                              // Appliquer le formatage
                              if (column.format === 'currency') {
                                previewValue = previewValue + ' €'
                              } else if (column.format === 'percentage') {
                                previewValue = previewValue + '%'
                              }
                            } else {
                              previewValue = column.text || ''
                            }

                            let borderStyle = element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'
                            let padding = element.content?.cellSpacing === 'compact' ? '4px' :
                                         element.content?.cellSpacing === 'spacious' ? '10px' : '6px'

                            return (
                              <td 
                                key={colIndex} 
                                className="text-xs text-gray-600"
                                style={{
                                  border: borderStyle,
                                  padding: padding,
                                  textAlign: column.align || 'left'
                                }}
                              >
                                {previewValue}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  })()
                ) : (
                  // Rendu statique normal
                  element.content?.rows?.map((row: string[], rowIndex: number) => {
                    const isEvenRow = rowIndex % 2 === 0
                    const stripeClass = element.content?.stripeRows && !isEvenRow ? 'bg-gray-50' : ''
                    
                    return (
                      <tr key={rowIndex} className={stripeClass}>
                        {row.map((cell, cellIndex) => {
                          let borderStyle = element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'
                          let padding = element.content?.cellSpacing === 'compact' ? '4px' :
                                       element.content?.cellSpacing === 'spacious' ? '10px' : '6px'
                          
                          return (
                            <td 
                              key={cellIndex} 
                              className="text-xs text-gray-600"
                              style={{
                                border: borderStyle,
                                padding: padding
                              }}
                            >
                              {cell}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
                
                {/* Aperçu des lignes de totaux */}
                {element.content?.showTotals && element.content?.totalRows && element.content.totalRows.length > 0 && (
                  element.content.totalRows.map((totalRow: any, index: number) => {
                    const activeColumns = element.content?.columns?.filter((col: any) => col.id) || 
                                          element.content?.columns || []
                    const colSpan = activeColumns.length || 1
                    const labelColSpan = Math.max(1, colSpan - 1)
                    
                    let backgroundColor = '#f8fafc'
                    let fontWeight = 'normal'
                    let borderStyle = element.content?.cellBorders === false ? 'none' : '1px solid #d1d5db'
                    
                    if (element.content?.totalStyle === 'highlighted') {
                      backgroundColor = totalRow.type === 'total' ? '#fef3c7' : '#f3f4f6'
                    } else if (element.content?.totalStyle === 'boxed') {
                      borderStyle = '2px solid #374151'
                      backgroundColor = '#f9fafb'
                    }
                    
                    if (totalRow.type === 'total') {
                      fontWeight = 'bold'
                    }
                    
                    const textAlign = element.content?.totalPosition === 'center' ? 'center' : 
                                    element.content?.totalPosition === 'left' ? 'left' : 'right'
                    
                    // Calculer le padding des totaux selon l'espacement configuré
                    let totalPadding = '8px'
                    if (element.content?.cellSpacing === 'compact') {
                      totalPadding = '6px'
                    } else if (element.content?.cellSpacing === 'spacious') {
                      totalPadding = '12px'
                    }
                    
                    return (
                      <tr key={`total-preview-${index}`}>
                        <td 
                          colSpan={labelColSpan}
                          className="text-xs"
                          style={{
                            textAlign: textAlign,
                            backgroundColor: backgroundColor,
                            fontWeight: fontWeight,
                            border: borderStyle,
                            padding: totalPadding
                          }}
                        >
                          {totalRow.label}
                        </td>
                        <td 
                          className="text-xs"
                          style={{
                            textAlign: 'right',
                            backgroundColor: backgroundColor,
                            fontWeight: fontWeight,
                            border: borderStyle,
                            padding: totalPadding
                          }}
                        >
                          {totalRow.type === 'total' ? '550.00 €' : 
                           totalRow.type === 'subtotal' ? '450.00 €' :
                           totalRow.type === 'tax' ? '90.00 €' :
                           totalRow.type === 'discount' ? '10.00 €' :
                           totalRow.type === 'shipping' ? '10.00 €' : '0.00 €'}
                        </td>
                      </tr>
                    )
                  })
                )}
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
              backgroundColor: element.style.background,
              marginTop: element.style.margin?.top,
              marginBottom: element.style.margin?.bottom
            }}
          />
        )
      
      case 'spacer':
        return (
          <div 
            className="w-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500"
            style={{
              height: element.style.size?.height || 20
            }}
          >
            Espacement {element.style.size?.height}px
          </div>
        )
      
      case 'qrcode':
        {
          const qrSize = element.content?.size || 100
          const bgColor = (element.content?.backgroundColor || '#ffffff').replace('#', '')
          const fgColor = (element.content?.foregroundColor || '#000000').replace('#', '')
          const qrData = encodeURIComponent(element.content?.data || 'https://example.com')
          
          return (
            <div 
              className="bg-white border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg p-2"
              style={{
                width: qrSize,
                height: qrSize
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${qrData}&bgcolor=${bgColor}&color=${fgColor}`}
                alt="QR Code"
                className="max-w-full max-h-full object-contain"
                style={{
                  width: Math.max(40, qrSize - 16),
                  height: Math.max(40, qrSize - 16)
                }}
                onError={(e) => {
                  // Fallback si l'API ne fonctionne pas
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )
        }
      
      case 'barcode':
        return (
          <div 
            className="bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-xs text-gray-500 rounded-lg"
            style={{
              width: element.style.size?.width || 200,
              height: element.style.size?.height || 50
            }}
          >
            <ScanLine className="h-6 w-6 text-gray-400 mb-1" />
            <div className="text-center">
              <div className="font-medium">Code-barres</div>
              <div className="text-[10px] mt-1">
                {element.content?.data || '123456789'}
              </div>
            </div>
          </div>
        )
      
      case 'date':
        return (
          <div 
            className="inline-block px-2 py-1 rounded text-sm bg-blue-50 border border-blue-200"
            style={{
              fontFamily: element.style.font?.family,
              fontSize: toCssValue(element.style.font?.size),
              fontWeight: element.style.font?.weight,
              color: element.style.font?.color,
              textAlign: element.style.font?.align as any
            }}
          >
            <Calendar className="h-3 w-3 inline mr-1" />
            {element.content?.type === 'current' ? new Date().toLocaleDateString() : '01/01/2024'}
          </div>
        )
      
      case 'signature':
        return (
          <div 
            className="bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500 rounded-lg"
            style={{
              width: element.style.size?.width || 150,
              height: element.style.size?.height || 75
            }}
          >
            <div className="text-center">
              <PenTool className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <div className="font-medium">Signature</div>
              <div className="text-[10px] mt-1">
                {element.content?.placeholder || 'Signature'}
              </div>
            </div>
          </div>
        )
      
      case 'logo':
        return (
          <div 
            className="bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500 rounded-lg"
            style={{
              width: element.style.size?.width || 120,
              height: element.style.size?.height || 60
            }}
          >
            {element.content?.src ? (
              <img 
                src={element.content.src} 
                alt={element.content.alt || 'Logo'} 
                className="max-w-full max-h-full object-contain" 
              />
            ) : (
              <div className="text-center">
                <Zap className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <div className="font-medium">Logo</div>
              </div>
            )}
          </div>
        )
      
      case 'calculator':
        return (
          <div 
            className="inline-block px-2 py-1 rounded text-sm bg-green-50 border border-green-200"
            style={{
              fontFamily: element.style.font?.family,
              fontSize: toCssValue(element.style.font?.size),
              fontWeight: element.style.font?.weight,
              color: element.style.font?.color,
              textAlign: element.style.font?.align as any
            }}
          >
            <Calculator className="h-3 w-3 inline mr-1" />
            {element.content?.formula || 'SUM'}: €0.00
          </div>
        )
      
      case 'badge':
        return (
          <div 
            className="inline-block px-2 py-1 rounded-full text-xs font-bold text-white"
            style={{
              backgroundColor: element.style.background || '#3b82f6',
              color: element.style.font?.color || '#ffffff'
            }}
          >
            {element.content?.text || 'BADGE'}
          </div>
        )
      
      case 'status':
        return (
          <div 
            className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
            style={{
              backgroundColor: element.style.background || '#10b981',
              color: element.style.font?.color || '#ffffff'
            }}
          >
            {element.content?.status || 'ACTIF'}
          </div>
        )
      
      case 'line-break':
        return (
          <div className="w-full h-px bg-gray-300 my-2"></div>
        )
      
      case 'page-break':
        return (
          <div className="w-full border-t-2 border-dashed border-gray-400 my-4 text-center">
            <span className="bg-white px-2 text-xs text-gray-500 relative -top-2">SAUT DE PAGE</span>
          </div>
        )
      
      case 'background-shape':
        return (
          <div 
            className="rounded-lg"
            style={{
              width: element.style.size?.width || 200,
              height: element.style.size?.height || 100,
              backgroundColor: element.style.background || '#f3f4f6',
              opacity: element.content?.opacity || 0.5
            }}
          >
          </div>
        )
      
      case 'border-frame':
        return (
          <div 
            className="border-2 border-dashed border-gray-400 rounded-lg p-4 flex items-center justify-center min-h-[60px]"
            style={{
              borderColor: element.style.border?.color || '#374151',
              borderRadius: element.style.border?.radius || 8
            }}
          >
            <div className="text-xs text-gray-500 text-center">
              <Target className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <div className="font-medium">Cadre décoratif</div>
              <div className="text-[10px] mt-1">Glissez du contenu ici</div>
            </div>
          </div>
        )
      
      case 'column-layout':
        return (
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 min-h-[80px]">
            <div className="flex items-center justify-center h-full">
              <div className="text-xs text-blue-600 text-center">
                <Columns className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <div className="font-medium">Layout Colonnes</div>
                <div className="text-[10px] mt-1">Disposition en colonnes</div>
              </div>
            </div>
          </div>
        )
      
      case 'grid-layout':
        return (
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 min-h-[80px]">
            <div className="flex items-center justify-center h-full">
              <div className="text-xs text-purple-600 text-center">
                <Grid3X3 className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                <div className="font-medium">Layout Grille</div>
                <div className="text-[10px] mt-1">Grille 2x2</div>
              </div>
            </div>
          </div>
        )
      
      case 'flex-layout':
        return (
          <div className="border-2 border-dashed border-green-300 rounded-lg p-4 min-h-[80px]">
            <div className="flex items-center justify-center h-full">
              <div className="text-xs text-green-600 text-center">
                <Box className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <div className="font-medium">Layout Flex</div>
                <div className="text-[10px] mt-1">Disposition flexible</div>
              </div>
            </div>
          </div>
        )
      
      case 'card-layout':
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm min-h-[80px]">
            <div className="flex items-center justify-center h-full">
              <div className="text-xs text-gray-600 text-center">
                <Clipboard className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <div className="font-medium">Carte</div>
                <div className="text-[10px] mt-1">Conteneur avec style</div>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-gray-500 italic">
            Élément {element.type}
          </div>
        )
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={cn(
        "relative border-2 border-transparent hover:border-blue-300 transition-colors",
        selectedElement?.id === element.id && "border-blue-500 bg-blue-50",
        isDragging && "opacity-50",
        canContainChildren && "min-h-[60px]",
        level > 0 && "ml-4 border-l-2 border-gray-200 pl-4"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(element)
      }}
      style={{
        ...style,
        position: (element.style.position?.type || 'relative') as any,
        left: element.style.position?.type === 'absolute' ? element.style.position?.x : undefined,
        top: element.style.position?.type === 'absolute' ? element.style.position?.y : undefined,
        zIndex: element.style.position?.zIndex,
        padding: `${toCssValue(element.style.padding?.top)} ${toCssValue(element.style.padding?.right)} ${toCssValue(element.style.padding?.bottom)} ${toCssValue(element.style.padding?.left)}`,
        margin: `${toCssValue(element.style.margin?.top)} ${toCssValue(element.style.margin?.right)} ${toCssValue(element.style.margin?.bottom)} ${toCssValue(element.style.margin?.left)}`,
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
        height: element.style.size?.height
      }}
    >
      {/* Icône de drag */}
      <div
        {...listeners}
        className={cn(
          "absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity",
          selectedElement?.id === element.id && "opacity-100"
        )}
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Contenu : soit les enfants, soit le contenu de l'élément, soit le placeholder */}
      {canContainChildren ? (
        element.children && element.children.length > 0 ? (
          // Comportement différent selon le type d'élément
          element.type === 'header' ? (
            // Pour le header, garder l'affichage flex horizontal original avec zones de drop
            <>
              <DropZone index={0} parentId={element.id} />
              {element.children.map((child, index) => (
                <React.Fragment key={child.id}>
                  <TemplateElementComponent
                    element={child}
                    selectedElement={selectedElement}
                    onSelect={onSelect}
                    onUpdate={onUpdate}
                    level={level + 1}
                  />
                  <DropZone index={index + 1} parentId={element.id} />
                </React.Fragment>
              ))}
            </>
          ) : (
            // Pour les autres conteneurs, utiliser l'affichage vertical avec zones de drop
            <div className="w-full">
              <DropZone index={0} parentId={element.id} />
              
              {element.children.map((child, index) => (
                <div key={child.id}>
                  <TemplateElementComponent
                    element={child}
                    selectedElement={selectedElement}
                    onSelect={onSelect}
                    onUpdate={onUpdate}
                    level={level + 1}
                  />
                  <DropZone index={index + 1} parentId={element.id} />
                </div>
              ))}
            </div>
          )
        ) : (
          // Placeholder pour containers vides
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
            <DropZone index={0} parentId={element.id} isActive={true} />
            <div className="text-xs mt-2">Glissez des éléments ici</div>
          </div>
        )
      ) : (
        // Pour les éléments non-containers, afficher le contenu normal
        <div className="w-full">
          {renderContent()}
        </div>
      )}
    </div>
  )
}

// Panel de propriétés
function PropertiesPanel({ 
  selectedElement, 
  onUpdate, 
  onDelete,
  onMoveElement
}: {
  selectedElement: TemplateElement | null
  onUpdate: (element: TemplateElement) => void
  onDelete: () => void
  onMoveElement?: (direction: 'up' | 'down' | 'first' | 'last') => void
}) {
  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
          <Settings className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Propriétés</h3>
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          Sélectionnez un élément dans le canvas pour modifier ses propriétés et personnaliser son apparence.
        </p>
      </div>
    )
  }

  const updateStyle = (property: string, value: any) => {
    const updatedElement = {
      ...selectedElement,
      style: {
        ...selectedElement.style,
        [property]: value
      }
    }
    onUpdate(updatedElement)
  }

  const updateContent = (property: string, value: any) => {
    const updatedElement = {
      ...selectedElement,
      content: {
        ...selectedElement.content,
        [property]: value
      }
    }
    onUpdate(updatedElement)
  }

  const updateNestedStyle = (category: string, property: string, value: any) => {
    const currentCategoryValue = selectedElement.style[category as keyof typeof selectedElement.style]
    
    let updatedStyle = {
      ...selectedElement.style,
      [category]: {
        ...(typeof currentCategoryValue === 'object' && currentCategoryValue !== null ? currentCategoryValue : {}),
        [property]: value
      }
    }

    // Si on modifie des propriétés flex, forcer display: 'flex'
    if (category === 'flex') {
      updatedStyle.display = 'flex'
    }

    const updatedElement = {
      ...selectedElement,
      style: updatedStyle
    }
    onUpdate(updatedElement)
  }

  const elementInfo = paletteItems.find(item => item.type === selectedElement.type)

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header moderne */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              {elementInfo?.icon && <elementInfo.icon className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Propriétés</h3>
              <p className="text-sm text-slate-600 font-medium">
                {elementInfo?.label || selectedElement.type}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu avec onglets */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="content" className="h-full">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 pt-4 pb-2">
            <TabsList className="grid w-full grid-cols-4 h-11 p-1 bg-slate-100 rounded-xl">
              <TabsTrigger value="content" className="text-xs font-semibold rounded-lg">
                <FileText className="h-3.5 w-3.5" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs font-semibold rounded-lg">
                <Palette className="h-3.5 w-3.5" />
                Style
              </TabsTrigger>
              <TabsTrigger value="layout" className="text-xs font-semibold rounded-lg">
                <Layout className="h-3.5 w-3.5" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="spacing" className="text-xs font-semibold rounded-lg">
                <Box className="h-3.5 w-3.5" />
                Espace
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="content" className="space-y-6 mt-0">
              {selectedElement.type === 'text' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <Type className="h-4 w-4 mr-2 text-blue-500" />
                      Contenu du texte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Label className="text-xs font-medium text-slate-600">Texte</Label>
                      <Textarea
                        value={selectedElement.content?.text || ''}
                        onChange={(e) => updateContent('text', e.target.value)}
                        rows={3}
                        className="resize-none border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                        placeholder="Saisissez votre texte..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'image' && (
                <div className="space-y-6">
                  {/* Upload d'image moderne */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                        <Image className="h-4 w-4 mr-2 text-green-500" />
                        Source de l'image
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Zone de drag & drop */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file || !selectedElement) return

                            if (!file.type.startsWith('image/')) {
                              alert('Veuillez sélectionner un fichier image valide')
                              return
                            }

                            if (file.size > 5 * 1024 * 1024) {
                              alert('L\'image est trop volumineuse. Taille maximum : 5MB')
                              return
                            }

                            const reader = new FileReader()
                            reader.onload = (e) => {
                              const base64 = e.target?.result as string
                              updateContent('src', base64)
                              if (!selectedElement.content?.alt) {
                                updateContent('alt', file.name.split('.')[0])
                              }
                            }
                            reader.onerror = () => {
                              alert('Erreur lors de la lecture du fichier')
                            }
                            reader.readAsDataURL(file)
                          }}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-white hover:bg-slate-50 hover:border-blue-400 transition-all duration-200"
                        >
                          <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-500 mb-2" />
                          <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600">
                            Glissez une image ou cliquez
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PNG, JPG jusqu'à 5MB
                          </p>
                        </label>
                      </div>

                      {/* URL alternative */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-slate-100 px-2 text-slate-500 font-medium">ou</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">URL de l'image</Label>
                        <Input
                          value={selectedElement.content?.src || ''}
                          onChange={(e) => updateContent('src', e.target.value)}
                          placeholder="https://exemple.com/image.jpg"
                          className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paramètres de l'image */}
                  <Card className="border-0 shadow-sm bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-purple-500" />
                        Paramètres
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Texte alternatif</Label>
                        <Input
                          value={selectedElement.content?.alt || ''}
                          onChange={(e) => updateContent('alt', e.target.value)}
                          placeholder="Description de l'image pour l'accessibilité..."
                          className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        <p className="text-xs text-slate-500">
                          Améliore l'accessibilité et le SEO
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Aperçu de l'image */}
                  {selectedElement.content?.src && (
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-amber-500" />
                          Aperçu
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative bg-slate-100 rounded-lg p-4 flex items-center justify-center min-h-[120px]">
                          <img
                            src={selectedElement.content.src}
                            alt={selectedElement.content.alt || 'Aperçu'}
                            className="max-w-full max-h-32 object-contain rounded shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {selectedElement.content.alt || 'Sans description'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateContent('src', '')}
                            className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {selectedElement.type === 'variable' && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-sm bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-cyan-500" />
                        Variable dynamique
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Variable</Label>
                        <Select
                          value={selectedElement.content?.variable || ''}
                          onValueChange={(value) => updateContent('variable', value)}
                        >
                          <SelectTrigger className="border-slate-200 focus:border-blue-400">
                            <SelectValue placeholder="Choisir une variable" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVariables.map((variable) => (
                              <SelectItem key={variable.key} value={variable.key}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{variable.label}</span>
                                  <span className="text-xs text-slate-500">{variable.category}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Format d'affichage</Label>
                        <Select
                          value={selectedElement.content?.format || 'text'}
                          onValueChange={(value) => updateContent('format', value)}
                        >
                          <SelectTrigger className="border-slate-200 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texte simple</SelectItem>
                            <SelectItem value="currency">Monétaire (€)</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="number">Nombre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedElement.type === 'table' && (
                <div className="space-y-6">
                  {/* Configuration générale du tableau */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                        <Columns className="h-4 w-4 mr-2 text-blue-500" />
                        Configuration générale
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600">Largeur du tableau</Label>
                          <Select
                            value={selectedElement.content?.width || '100%'}
                            onValueChange={(value) => updateContent('width', value)}
                          >
                            <SelectTrigger className="border-slate-200 focus:border-blue-400 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="100%">Largeur complète (100%)</SelectItem>
                              <SelectItem value="75%">3/4 de la page (75%)</SelectItem>
                              <SelectItem value="50%">Moitié de la page (50%)</SelectItem>
                              <SelectItem value="auto">Automatique</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600">Alignement</Label>
                          <Select
                            value={selectedElement.content?.alignment || 'left'}
                            onValueChange={(value) => updateContent('alignment', value)}
                          >
                            <SelectTrigger className="border-slate-200 focus:border-blue-400 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">À gauche</SelectItem>
                              <SelectItem value="center">Centré</SelectItem>
                              <SelectItem value="right">À droite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Source des données</Label>
                        <Select
                          value={selectedElement.content?.dataSource || 'static'}
                          onValueChange={(value) => updateContent('dataSource', value)}
                        >
                          <SelectTrigger className="border-slate-200 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">Données statiques</SelectItem>
                            <SelectItem value="items">Ligne de facture (dynamique)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuration des colonnes */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                        <Layout className="h-4 w-4 mr-2 text-green-500" />
                        Colonnes disponibles
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-1">Cochez les colonnes que vous souhaitez afficher</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const availableColumns = [
                          { id: 'description', label: 'Description', variable: 'items.description', defaultWidth: '40%' },
                          { id: 'quantity', label: 'Quantité', variable: 'items.quantity', defaultWidth: '10%', format: 'number' },
                          { id: 'unitPrice', label: 'Prix unitaire', variable: 'items.unitPrice', defaultWidth: '15%', format: 'currency' },
                          { id: 'discount', label: 'Remise', variable: 'items.discount', defaultWidth: '10%', format: 'percentage' },
                          { id: 'subtotal', label: 'Sous-total HT', variable: 'items.subtotal', defaultWidth: '15%', format: 'currency' },
                          { id: 'taxRate', label: 'Taux TVA', variable: 'items.taxRate', defaultWidth: '10%', format: 'percentage' },
                          { id: 'taxAmount', label: 'Montant TVA', variable: 'items.taxAmount', defaultWidth: '12%', format: 'currency' },
                          { id: 'total', label: 'Total TTC', variable: 'items.total', defaultWidth: '15%', format: 'currency' },
                          { id: 'category', label: 'Catégorie', variable: 'items.category', defaultWidth: '15%' },
                          { id: 'reference', label: 'Référence', variable: 'items.reference', defaultWidth: '12%' }
                        ]

                        const currentColumns = selectedElement.content?.columns || []
                        
                        return (
                          <div className="space-y-2">
                            {availableColumns.map((column) => {
                              const isActive = currentColumns.some((col: any) => col.id === column.id)
                              
                              return (
                                <div key={column.id} className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200">
                                  <input
                                    type="checkbox"
                                    id={`column-${column.id}`}
                                    checked={isActive}
                                    onChange={(e) => {
                                      const newColumns = [...currentColumns]
                                      if (e.target.checked) {
                                        // Ajouter la colonne
                                        newColumns.push({
                                          id: column.id,
                                          header: column.label,
                                          variable: column.variable,
                                          type: 'variable',
                                          width: column.defaultWidth,
                                          align: column.format === 'currency' || column.format === 'number' ? 'right' : 'left',
                                          format: column.format || 'text',
                                          headerStyle: {
                                            backgroundColor: '#f8fafc',
                                            color: '#1f2937',
                                            fontWeight: 'bold',
                                            fontSize: '11px',
                                            padding: '8px'
                                          },
                                          cellStyle: {
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            fontWeight: 'normal',
                                            fontSize: '10px',
                                            padding: '6px'
                                          }
                                        })
                                      } else {
                                        // Supprimer la colonne
                                        const index = newColumns.findIndex((col: any) => col.id === column.id)
                                        if (index !== -1) {
                                          newColumns.splice(index, 1)
                                        }
                                      }
                                      updateContent('columns', newColumns)
                                    }}
                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                                  />
                                  <label htmlFor={`column-${column.id}`} className="text-xs font-medium text-slate-700 cursor-pointer flex-1 min-w-0">
                                    <span className="block truncate">{column.label}</span>
                                  </label>
                                  {column.format && (
                                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                                      {column.format}
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  {/* Configuration des totaux */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                        <Calculator className="h-4 w-4 mr-2 text-amber-500" />
                        Lignes de totaux
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-1">Configurez l'affichage des totaux en bas du tableau</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="show-totals"
                          checked={selectedElement.content?.showTotals || false}
                          onChange={(e) => updateContent('showTotals', e.target.checked)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="show-totals" className="text-sm font-medium text-slate-700 cursor-pointer">
                          Afficher les lignes de totaux
                        </label>
                      </div>
                      
                      {selectedElement.content?.showTotals && (
                        <div className="space-y-4 mt-4 p-4 bg-white rounded-lg border border-amber-200">
                          <div className="space-y-3">
                            <Label className="text-xs font-medium text-slate-600">Types de totaux à afficher</Label>
                            
                            {[
                              { id: 'subtotal', label: 'Sous-total HT', format: 'currency' },
                              { id: 'discount', label: 'Remise totale', format: 'currency' },
                              { id: 'shipping', label: 'Frais de port', format: 'currency' },
                              { id: 'tax', label: 'TVA totale', format: 'currency' },
                              { id: 'total', label: 'Total TTC', format: 'currency', default: true }
                            ].map((totalType) => {
                              const totalRows = selectedElement.content?.totalRows || []
                              const isActive = totalRows.some((row: any) => row.type === totalType.id)
                              
                              return (
                                <div key={totalType.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`total-${totalType.id}`}
                                    checked={isActive}
                                    onChange={(e) => {
                                      const newTotalRows = [...totalRows]
                                      if (e.target.checked) {
                                        newTotalRows.push({
                                          type: totalType.id,
                                          label: totalType.label,
                                          format: totalType.format,
                                          calculation: 'auto',
                                          value: null,
                                          style: {
                                            backgroundColor: totalType.id === 'total' ? '#f3f4f6' : '#ffffff',
                                            fontWeight: totalType.id === 'total' ? 'bold' : 'normal',
                                            fontSize: '11px',
                                            padding: '8px'
                                          }
                                        })
                                      } else {
                                        const index = newTotalRows.findIndex((row: any) => row.type === totalType.id)
                                        if (index !== -1) {
                                          newTotalRows.splice(index, 1)
                                        }
                                      }
                                      updateContent('totalRows', newTotalRows)
                                    }}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <label htmlFor={`total-${totalType.id}`} className="text-xs font-medium text-slate-700 cursor-pointer flex-1 min-w-0">
                                    <span className="block truncate">{totalType.label}</span>
                                  </label>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {totalType.format}
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-200">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-slate-600">Position des totaux</Label>
                              <Select
                                value={selectedElement.content?.totalPosition || 'right'}
                                onValueChange={(value) => updateContent('totalPosition', value)}
                              >
                                <SelectTrigger className="border-slate-200 focus:border-amber-400 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Aligné à gauche</SelectItem>
                                  <SelectItem value="right">Aligné à droite</SelectItem>
                                  <SelectItem value="center">Centré</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-slate-600">Style des totaux</Label>
                              <Select
                                value={selectedElement.content?.totalStyle || 'standard'}
                                onValueChange={(value) => updateContent('totalStyle', value)}
                              >
                                <SelectTrigger className="border-slate-200 focus:border-amber-400 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="highlighted">Surligné</SelectItem>
                                  <SelectItem value="boxed">Encadré</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Options avancées */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-purple-500" />
                        Options avancées
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600">Lignes alternées</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="stripe-rows"
                              checked={selectedElement.content?.stripeRows || false}
                              onChange={(e) => updateContent('stripeRows', e.target.checked)}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="stripe-rows" className="text-xs text-slate-700 cursor-pointer">
                              Activer
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600">Bordures de cellules</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="cell-borders"
                              checked={selectedElement.content?.cellBorders !== false}
                              onChange={(e) => updateContent('cellBorders', e.target.checked)}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="cell-borders" className="text-xs text-slate-700 cursor-pointer">
                              Afficher
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600">Espacement des cellules</Label>
                          <Select
                            value={selectedElement.content?.cellSpacing || 'normal'}
                            onValueChange={(value) => updateContent('cellSpacing', value)}
                          >
                            <SelectTrigger className="border-slate-200 focus:border-purple-400 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compact">Compact</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="spacious">Spacieux</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600">En-tête figé</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="fixed-header"
                              checked={selectedElement.content?.fixedHeader || false}
                              onChange={(e) => updateContent('fixedHeader', e.target.checked)}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="fixed-header" className="text-xs text-slate-700 cursor-pointer">
                              Activer
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Nombre maximum de lignes (0 = illimité)</Label>
                        <Input
                          type="number"
                          value={selectedElement.content?.maxRows || 0}
                          onChange={(e) => updateContent('maxRows', parseInt(e.target.value) || 0)}
                          className="border-slate-200 focus:border-purple-400 h-8"
                          min="0"
                          max="1000"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedElement.type === 'qrcode' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <QrCode className="h-4 w-4 mr-2 text-indigo-500" />
                      Configuration QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Contenu du QR Code</Label>
                      <Input
                        value={selectedElement.content?.data || ''}
                        onChange={(e) => updateContent('data', e.target.value)}
                        placeholder="https://example.com ou texte"
                        className="border-slate-200 focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Taille (px)</Label>
                      <Input
                        type="number"
                        value={selectedElement.content?.size || 100}
                        onChange={(e) => {
                          const size = parseInt(e.target.value) || 100
                          if (size >= 50 && size <= 300) {
                            updateContent('size', size)
                            updateNestedStyle('size', 'width', size)
                            updateNestedStyle('size', 'height', size)
                          }
                        }}
                        min="50"
                        max="300"
                        className="border-slate-200 focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Couleur de fond</Label>
                      <Input
                        type="color"
                        value={selectedElement.content?.backgroundColor || '#ffffff'}
                        onChange={(e) => updateContent('backgroundColor', e.target.value)}
                        className="border-slate-200 focus:border-indigo-400 h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Couleur des cases</Label>
                      <Input
                        type="color"
                        value={selectedElement.content?.foregroundColor || '#000000'}
                        onChange={(e) => updateContent('foregroundColor', e.target.value)}
                        className="border-slate-200 focus:border-indigo-400 h-10"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'barcode' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <ScanLine className="h-4 w-4 mr-2 text-purple-500" />
                      Configuration Code-barres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Données</Label>
                      <Input
                        value={selectedElement.content?.data || ''}
                        onChange={(e) => updateContent('data', e.target.value)}
                        placeholder="123456789"
                        className="border-slate-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Type</Label>
                      <Select
                        value={selectedElement.content?.type || 'code128'}
                        onValueChange={(value) => updateContent('type', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-purple-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="code128">Code 128</SelectItem>
                          <SelectItem value="ean13">EAN-13</SelectItem>
                          <SelectItem value="upc">UPC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'date' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      Configuration Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Type de date</Label>
                      <Select
                        value={selectedElement.content?.type || 'current'}
                        onValueChange={(value) => updateContent('type', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Date actuelle</SelectItem>
                          <SelectItem value="invoice">Date de facture</SelectItem>
                          <SelectItem value="due">Date d'échéance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Format</Label>
                      <Select
                        value={selectedElement.content?.format || 'DD/MM/YYYY'}
                        onValueChange={(value) => updateContent('format', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">01/12/2024</SelectItem>
                          <SelectItem value="MM/DD/YYYY">12/01/2024</SelectItem>
                          <SelectItem value="YYYY-MM-DD">2024-12-01</SelectItem>
                          <SelectItem value="DD MMM YYYY">01 Déc 2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'signature' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <PenTool className="h-4 w-4 mr-2 text-amber-500" />
                      Configuration Signature
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Texte d'indication</Label>
                      <Input
                        value={selectedElement.content?.placeholder || ''}
                        onChange={(e) => updateContent('placeholder', e.target.value)}
                        placeholder="Signature"
                        className="border-slate-200 focus:border-amber-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'logo' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                      Configuration Logo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">URL de l'image</Label>
                      <Input
                        value={selectedElement.content?.src || ''}
                        onChange={(e) => updateContent('src', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="border-slate-200 focus:border-yellow-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Texte alternatif</Label>
                      <Input
                        value={selectedElement.content?.alt || ''}
                        onChange={(e) => updateContent('alt', e.target.value)}
                        placeholder="Description du logo"
                        className="border-slate-200 focus:border-yellow-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'calculator' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <Calculator className="h-4 w-4 mr-2 text-green-500" />
                      Configuration Calculateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Formule</Label>
                      <Select
                        value={selectedElement.content?.formula || 'SUM'}
                        onValueChange={(value) => updateContent('formula', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-green-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUM">Somme (SUM)</SelectItem>
                          <SelectItem value="AVG">Moyenne (AVG)</SelectItem>
                          <SelectItem value="COUNT">Nombre (COUNT)</SelectItem>
                          <SelectItem value="MAX">Maximum (MAX)</SelectItem>
                          <SelectItem value="MIN">Minimum (MIN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Champ à calculer</Label>
                      <Select
                        value={selectedElement.content?.field || 'amount'}
                        onValueChange={(value) => updateContent('field', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-green-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">Montant</SelectItem>
                          <SelectItem value="quantity">Quantité</SelectItem>
                          <SelectItem value="price">Prix unitaire</SelectItem>
                          <SelectItem value="tax">TVA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Format</Label>
                      <Select
                        value={selectedElement.content?.format || 'currency'}
                        onValueChange={(value) => updateContent('format', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-green-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="currency">Devise (€)</SelectItem>
                          <SelectItem value="number">Nombre</SelectItem>
                          <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'badge' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <BadgeIcon className="h-4 w-4 mr-2 text-blue-500" />
                      Configuration Badge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Texte</Label>
                      <Input
                        value={selectedElement.content?.text || ''}
                        onChange={(e) => updateContent('text', e.target.value)}
                        placeholder="NOUVEAU"
                        className="border-slate-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Style</Label>
                      <Select
                        value={selectedElement.content?.style || 'primary'}
                        onValueChange={(value) => {
                          updateContent('style', value)
                          const colors = {
                            primary: '#3b82f6',
                            success: '#10b981',
                            warning: '#f59e0b',
                            danger: '#ef4444',
                            info: '#06b6d4'
                          }
                          updateStyle('background', colors[value as keyof typeof colors])
                        }}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primaire (Bleu)</SelectItem>
                          <SelectItem value="success">Succès (Vert)</SelectItem>
                          <SelectItem value="warning">Attention (Orange)</SelectItem>
                          <SelectItem value="danger">Danger (Rouge)</SelectItem>
                          <SelectItem value="info">Info (Cyan)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedElement.type === 'status' && (
                <Card className="border-0 shadow-sm bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-emerald-500" />
                      Configuration Statut
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Statut</Label>
                      <Select
                        value={selectedElement.content?.status || 'ACTIVE'}
                        onValueChange={(value) => {
                          updateContent('status', value)
                          const colors = {
                            ACTIVE: '#10b981',
                            INACTIVE: '#ef4444',
                            PENDING: '#f59e0b',
                            DRAFT: '#6b7280'
                          }
                          updateStyle('background', colors[value as keyof typeof colors])
                        }}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-emerald-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Actif</SelectItem>
                          <SelectItem value="INACTIVE">Inactif</SelectItem>
                          <SelectItem value="PENDING">En attente</SelectItem>
                          <SelectItem value="DRAFT">Brouillon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              {/* Police */}
              {(selectedElement.type === 'text' || 
                selectedElement.type === 'variable' || 
                selectedElement.type === 'table' || 
                selectedElement.type === 'container' || 
                selectedElement.type === 'header' || 
                selectedElement.type === 'footer' || 
                selectedElement.type === 'section') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Police</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Famille</Label>
                        <Select
                          value={selectedElement.style.font?.family || 'Arial'}
                          onValueChange={(value) => updateNestedStyle('font', 'family', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Polices system-ui */}
                            <SelectItem value="system-ui">System UI</SelectItem>
                            <SelectItem value="-apple-system">Apple System</SelectItem>
                            
                            {/* Polices Sans-serif classiques */}
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Helvetica Neue">Helvetica Neue</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                            <SelectItem value="Tahoma">Tahoma</SelectItem>
                            <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                            <SelectItem value="Segoe UI">Segoe UI</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Lato">Lato</SelectItem>
                            <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                            
                            {/* Polices Serif */}
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Times">Times</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="serif">Serif (generic)</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                            <SelectItem value="Merriweather">Merriweather</SelectItem>
                            <SelectItem value="Lora">Lora</SelectItem>
                            
                            {/* Polices Monospace */}
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Courier">Courier</SelectItem>
                            <SelectItem value="Monaco">Monaco</SelectItem>
                            <SelectItem value="Consolas">Consolas</SelectItem>
                            <SelectItem value="Menlo">Menlo</SelectItem>
                            <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                            <SelectItem value="monospace">Monospace (generic)</SelectItem>
                            
                            {/* Polices Display/Fancy */}
                            <SelectItem value="Impact">Impact</SelectItem>
                            <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                            <SelectItem value="Brush Script MT">Brush Script MT</SelectItem>
                            <SelectItem value="Lucida Handwriting">Lucida Handwriting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Taille</Label>
                        <UnitInput
                          value={selectedElement.style.font?.size || 14}
                          onChange={(value) => updateNestedStyle('font', 'size', value)}
                          allowedUnits={['px', 'em', 'rem', '%']}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Poids</Label>
                        <Select
                          value={selectedElement.style.font?.weight || 'normal'}
                          onValueChange={(value) => updateNestedStyle('font', 'weight', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Gras</SelectItem>
                            <SelectItem value="lighter">Léger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Couleur</Label>
                        <Input
                          type="color"
                          value={selectedElement.style.font?.color || '#000000'}
                          onChange={(e) => updateNestedStyle('font', 'color', e.target.value)}
                          className="h-8 p-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Alignement</Label>
                      <Select
                        value={selectedElement.style.font?.align || 'left'}
                        onValueChange={(value) => updateNestedStyle('font', 'align', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Gauche</SelectItem>
                          <SelectItem value="center">Centre</SelectItem>
                          <SelectItem value="right">Droite</SelectItem>
                          <SelectItem value="justify">Justifié</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Background et bordure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Apparence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Couleur de fond</Label>
                    <Input
                      type="color"
                      value={selectedElement.style.background || '#ffffff'}
                      onChange={(e) => updateStyle('background', e.target.value)}
                      className="h-8 p-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Bordure</Label>
                      <Input
                        type="number"
                        value={selectedElement.style.border?.width || 0}
                        onChange={(e) => updateNestedStyle('border', 'width', parseInt(e.target.value))}
                        className="h-8"
                        placeholder="Épaisseur"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Couleur bordure</Label>
                      <Input
                        type="color"
                        value={selectedElement.style.border?.color || '#000000'}
                        onChange={(e) => updateNestedStyle('border', 'color', e.target.value)}
                        className="h-8 p-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Style bordure</Label>
                      <Select
                        value={selectedElement.style.border?.style || 'solid'}
                        onValueChange={(value) => updateNestedStyle('border', 'style', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solide</SelectItem>
                          <SelectItem value="dashed">Tirets</SelectItem>
                          <SelectItem value="dotted">Points</SelectItem>
                          <SelectItem value="none">Aucune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Rayon bordure</Label>
                      <Input
                        type="number"
                        value={selectedElement.style.border?.radius || 0}
                        onChange={(e) => updateNestedStyle('border', 'radius', parseInt(e.target.value))}
                        className="h-8"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              {/* Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Type de position</Label>
                    <Select
                      value={selectedElement.style.position?.type || 'relative'}
                      onValueChange={(value) => updateNestedStyle('position', 'type', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relative">Relative</SelectItem>
                        <SelectItem value="absolute">Absolue</SelectItem>
                        <SelectItem value="static">Statique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedElement.style.position?.type === 'absolute' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X (left)</Label>
                        <Input
                          type="number"
                          value={selectedElement.style.position?.x || 0}
                          onChange={(e) => updateNestedStyle('position', 'x', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y (top)</Label>
                        <Input
                          type="number"
                          value={selectedElement.style.position?.y || 0}
                          onChange={(e) => updateNestedStyle('position', 'y', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Z-index</Label>
                    <Input
                      type="number"
                      value={selectedElement.style.position?.zIndex || 1}
                      onChange={(e) => updateNestedStyle('position', 'zIndex', parseInt(e.target.value))}
                      className="h-8"
                      min="0"
                      max="999"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Taille */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Largeur</Label>
                      <UnitInput
                        value={selectedElement.style.size?.width || 'auto'}
                        onChange={(value) => updateNestedStyle('size', 'width', value)}
                        allowedUnits={['px', '%', 'em', 'rem', 'vh', 'vw']}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hauteur</Label>
                      <UnitInput
                        value={selectedElement.style.size?.height || 'auto'}
                        onChange={(value) => updateNestedStyle('size', 'height', value)}
                        allowedUnits={['px', '%', 'em', 'rem', 'vh', 'dvh']}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ordre dans le conteneur */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ordre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMoveElement?.('up')}
                      className="flex-1"
                      disabled={!onMoveElement}
                    >
                      ↑ Monter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMoveElement?.('down')}
                      className="flex-1"
                      disabled={!onMoveElement}
                    >
                      ↓ Descendre
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMoveElement?.('first')}
                      className="text-xs"
                      disabled={!onMoveElement}
                    >
                      Premier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMoveElement?.('last')}
                      className="text-xs"
                      disabled={!onMoveElement}
                    >
                      Dernier
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Flexbox pour les conteneurs */}
              {selectedElement.constraints?.canContain && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Flexbox</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Direction</Label>
                      <Select
                        value={selectedElement.style.flex?.direction || 'column'}
                        onValueChange={(value) => updateNestedStyle('flex', 'direction', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="row">Ligne</SelectItem>
                          <SelectItem value="column">Colonne</SelectItem>
                          <SelectItem value="row-reverse">Ligne inversée</SelectItem>
                          <SelectItem value="column-reverse">Colonne inversée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Justification</Label>
                        <Select
                          value={selectedElement.style.flex?.justify || 'flex-start'}
                          onValueChange={(value) => updateNestedStyle('flex', 'justify', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flex-start">Début</SelectItem>
                            <SelectItem value="center">Centre</SelectItem>
                            <SelectItem value="flex-end">Fin</SelectItem>
                            <SelectItem value="space-between">Espacement</SelectItem>
                            <SelectItem value="space-around">Autour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Alignement</Label>
                        <Select
                          value={selectedElement.style.flex?.align || 'stretch'}
                          onValueChange={(value) => updateNestedStyle('flex', 'align', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stretch">Étirer</SelectItem>
                            <SelectItem value="flex-start">Début</SelectItem>
                            <SelectItem value="center">Centre</SelectItem>
                            <SelectItem value="flex-end">Fin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="spacing" className="space-y-4">
              {/* Padding */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Padding intérieur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Haut</Label>
                      <UnitInput
                        value={selectedElement.style.padding?.top || 0}
                        onChange={(value) => updateNestedStyle('padding', 'top', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Droite</Label>
                      <UnitInput
                        value={selectedElement.style.padding?.right || 0}
                        onChange={(value) => updateNestedStyle('padding', 'right', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Bas</Label>
                      <UnitInput
                        value={selectedElement.style.padding?.bottom || 0}
                        onChange={(value) => updateNestedStyle('padding', 'bottom', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Gauche</Label>
                      <UnitInput
                        value={selectedElement.style.padding?.left || 0}
                        onChange={(value) => updateNestedStyle('padding', 'left', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Margin */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Margin extérieur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Haut</Label>
                      <UnitInput
                        value={selectedElement.style.margin?.top || 0}
                        onChange={(value) => updateNestedStyle('margin', 'top', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Droite</Label>
                      <UnitInput
                        value={selectedElement.style.margin?.right || 0}
                        onChange={(value) => updateNestedStyle('margin', 'right', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Bas</Label>
                      <UnitInput
                        value={selectedElement.style.margin?.bottom || 0}
                        onChange={(value) => updateNestedStyle('margin', 'bottom', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Gauche</Label>
                      <UnitInput
                        value={selectedElement.style.margin?.left || 0}
                        onChange={(value) => updateNestedStyle('margin', 'left', value)}
                        allowedUnits={['px', '%', 'em', 'rem']}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export function TemplateBuilder({ template, onSave, onCancel }: TemplateBuilderProps) {
  // Utiliser le hook d'historique pour les éléments
  const {
    currentState: elements,
    pushToHistory: pushElementsToHistory,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory<TemplateElement[]>([])
  
  const [selectedElement, setSelectedElement] = useState<TemplateElement | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState(template?.name || 'Nouveau template')
  const [isEditingName, setIsEditingName] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Générer un ID unique
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Fonction pour corriger les éléments existants qui ont des propriétés flex mais pas display: 'flex'
  const fixFlexElements = (elements: TemplateElement[]): TemplateElement[] => {
    return elements.map(element => {
      let fixedElement = { ...element }
      
      // Si l'élément a des propriétés flex mais pas display: 'flex', corriger
      if (element.style.flex && element.style.display !== 'flex') {
        fixedElement = {
          ...fixedElement,
          style: {
            ...fixedElement.style,
            display: 'flex'
          }
        }
      }
      
      // Appliquer récursivement aux enfants
      if (element.children && element.children.length > 0) {
        fixedElement.children = fixFlexElements(element.children)
      }
      
      return fixedElement
    })
  }

  // Helper pour mettre à jour les éléments avec historique
  const updateElements = useCallback((newElementsOrUpdater: TemplateElement[] | ((prev: TemplateElement[]) => TemplateElement[])) => {
    if (typeof newElementsOrUpdater === 'function') {
      const newElements = newElementsOrUpdater(elements)
      pushElementsToHistory(newElements)
    } else {
      pushElementsToHistory(newElementsOrUpdater)
    }
  }, [elements, pushElementsToHistory])

  // Appliquer la correction au chargement
  useEffect(() => {
    if (template?.elements) {
      const fixedElements = fixFlexElements(template.elements)
      resetHistory(fixedElements)
    } else if (template && !template.elements) {
      // Template existant mais sans éléments
      resetHistory([])
    }
  }, [template?.elements, resetHistory])

  // Initialiser pour un nouveau template
  useEffect(() => {
    if (template === null || (template && template.elements === undefined)) {
      resetHistory([])
    }
  }, [template, resetHistory])

  // Synchroniser le nom du template
  useEffect(() => {
    if (template?.name) {
      setTemplateName(template.name)
    }
  }, [template?.name])

  // Raccourcis clavier pour undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Gérer l'édition du nom
  const handleNameEdit = () => {
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    setIsEditingName(false)
    // Optionnel : sauvegarder automatiquement le nom
  }

  const handleNameCancel = () => {
    setTemplateName(template?.name || 'Nouveau template')
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      handleNameCancel()
    }
  }

  // Trouver un élément par ID (récursif pour l'imbrication)
  const findElementById = (elements: TemplateElement[], id: string): TemplateElement | null => {
    for (const element of elements) {
      if (element.id === id) return element
      if (element.children) {
        const found = findElementById(element.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Mettre à jour un élément (récursif)
  const updateElementInTree = (elements: TemplateElement[], updatedElement: TemplateElement): TemplateElement[] => {
    return elements.map(element => {
      if (element.id === updatedElement.id) {
        return updatedElement
      }
      if (element.children) {
        return {
          ...element,
          children: updateElementInTree(element.children, updatedElement)
        }
      }
      return element
    })
  }

  // Supprimer un élément (récursif)
  const removeElementFromTree = (elements: TemplateElement[], elementId: string): TemplateElement[] => {
    return elements.filter(element => {
      if (element.id === elementId) return false
      if (element.children) {
        element.children = removeElementFromTree(element.children, elementId)
      }
      return true
    })
  }

  // Vérifier si un élément peut être déposé dans un conteneur
  const canDropInContainer = (draggedType: string, containerElement: TemplateElement): boolean => {
    const constraints = containerElement.constraints
    if (!constraints?.canContain) return false
    return constraints.canContain.includes(draggedType)
  }

  // Déplacer un élément dans son conteneur parent
  const moveElementInParent = (direction: 'up' | 'down' | 'first' | 'last') => {
    if (!selectedElement) return

    const moveInArray = (arr: TemplateElement[], elementId: string): TemplateElement[] => {
      const index = arr.findIndex(el => el.id === elementId)
      if (index === -1) return arr

      const newArr = [...arr]
      const element = newArr[index]

      switch (direction) {
        case 'up':
          if (index > 0) {
            newArr[index] = newArr[index - 1]
            newArr[index - 1] = element
          }
          break
        case 'down':
          if (index < newArr.length - 1) {
            newArr[index] = newArr[index + 1]
            newArr[index + 1] = element
          }
          break
        case 'first':
          newArr.splice(index, 1)
          newArr.unshift(element)
          break
        case 'last':
          newArr.splice(index, 1)
          newArr.push(element)
          break
      }
      return newArr
    }

    const moveInTree = (elements: TemplateElement[]): TemplateElement[] => {
      // Chercher l'élément dans le niveau racine
      if (elements.find(el => el.id === selectedElement.id)) {
        return moveInArray(elements, selectedElement.id)
      }

      // Chercher dans les enfants
      return elements.map(element => {
        if (element.children && element.children.find(child => child.id === selectedElement.id)) {
          return {
            ...element,
            children: moveInArray(element.children, selectedElement.id)
          }
        }
        if (element.children) {
          return {
            ...element,
            children: moveInTree(element.children)
          }
        }
        return element
      })
    }

    updateElements(prev => moveInTree(prev))
  }

  // Gérer le début du drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Gérer le drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Créer un nouvel élément depuis la palette
    if (activeData?.isFromPalette) {
      const elementType = activeData.type
      const paletteItem = paletteItems.find(item => item.type === elementType)
      
      const defaultProps = defaultElementProperties[elementType] || { style: {} }
      const newElement: TemplateElement = {
        id: generateId(),
        type: elementType,
        ...defaultProps,
        style: {
          ...defaultProps.style
        },
        constraints: paletteItem?.constraints,
        children: defaultProps?.children || []
      }

      // Si on drop sur une zone de drop spécifique
      if (overData?.type === 'drop-zone') {
        const targetIndex = overData.index
        const parentId = overData.parentId

        if (parentId) {
          // Insérer dans un conteneur à une position spécifique
          const parentElement = findElementById(elements, parentId)
          if (parentElement && canDropInContainer(elementType, parentElement)) {
            const newChildren = [...(parentElement.children || [])]
            newChildren.splice(targetIndex, 0, newElement)
            
            const updatedContainer = {
              ...parentElement,
              children: newChildren
            }
            updateElements(prev => updateElementInTree(prev, updatedContainer))
          }
        } else {
          // Insérer à la racine à une position spécifique
          updateElements(prev => {
            const newElements = [...prev]
            newElements.splice(targetIndex, 0, newElement)
            return newElements
          })
        }
      }
      // Si on drop sur un conteneur (comportement existant)
      else if (overData?.element && canDropInContainer(elementType, overData.element)) {
        const updatedContainer = {
          ...overData.element,
          children: [...(overData.element.children || []), newElement]
        }
        updateElements(prev => updateElementInTree(prev, updatedContainer))
      } 
      // Sinon, ajouter à la fin de la racine
      else {
        updateElements(prev => [...prev, newElement])
      }
      
      setSelectedElement(newElement)
    }
    
    // Déplacer un élément existant
    else if (activeData?.isFromCanvas) {
      const draggedElement = activeData.element
      
      // Si on drop sur une zone de drop spécifique
      if (overData?.type === 'drop-zone') {
        const targetIndex = overData.index
        const parentId = overData.parentId

        // Supprimer de l'ancien emplacement
        const elementsWithoutDragged = removeElementFromTree(elements, draggedElement.id)

        if (parentId) {
          // Déplacer dans un conteneur à une position spécifique
          const parentElement = findElementById(elementsWithoutDragged, parentId)
          if (parentElement && canDropInContainer(draggedElement.type, parentElement)) {
            const newChildren = [...(parentElement.children || [])]
            newChildren.splice(targetIndex, 0, draggedElement)
            
            const updatedContainer = {
              ...parentElement,
              children: newChildren
            }
            updateElements(updateElementInTree(elementsWithoutDragged, updatedContainer))
          }
        } else {
          // Déplacer à la racine à une position spécifique
          const newElements = [...elementsWithoutDragged]
          newElements.splice(targetIndex, 0, draggedElement)
          updateElements(newElements)
        }
      }
      // Comportement existant pour drop sur un conteneur
      else if (overData?.element) {
        // Vérifier si on peut déposer dans le conteneur cible
        if (canDropInContainer(draggedElement.type, overData.element)) {
          // Supprimer de l'ancien emplacement
          const elementsWithoutDragged = removeElementFromTree(elements, draggedElement.id)
          
          // Ajouter au nouveau conteneur
          const targetContainer = findElementById(elementsWithoutDragged, overData.element.id)
          if (targetContainer) {
            const updatedContainer = {
              ...targetContainer,
              children: [...(targetContainer.children || []), draggedElement]
            }
            updateElements(updateElementInTree(elementsWithoutDragged, updatedContainer))
          }
        }
      }
    }
  }

  // Mettre à jour un élément sélectionné
  const handleUpdateElement = (updatedElement: TemplateElement) => {
    updateElements(prev => updateElementInTree(prev, updatedElement))
    setSelectedElement(updatedElement)
  }

  // Supprimer l'élément sélectionné
  const handleDeleteElement = () => {
    if (selectedElement) {
      updateElements(prev => removeElementFromTree(prev, selectedElement.id))
      setSelectedElement(null)
    }
  }

  // Sauvegarder le template
  const handleSave = () => {
    const templateData = {
      ...template,
      name: templateName,
      elements,
      updatedAt: new Date().toISOString(),
    }
    onSave?.(templateData)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Palette d'éléments */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Éléments</h3>
            
            {/* Grouper par catégorie */}
            {['layout', 'content', 'formatting'].map(category => (
              <div key={category} className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                  {category === 'layout' ? 'Mise en page' : 
                   category === 'content' ? 'Contenu' : 'Formatage'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <SortableContext
                    items={paletteItems.filter(item => item.category === category).map(item => `palette-${item.type}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paletteItems.filter(item => item.category === category).map(item => (
                      <PaletteItem
                        key={item.type}
                        type={item.type}
                        icon={item.icon}
                        label={item.label}
                        category={item.category}
                      />
                    ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas de construction */}
        <div className="flex-1 flex flex-col">
          {/* Barre d'outils */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  className="text-lg font-semibold border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={handleNameEdit}
                  title="Cliquer pour modifier le nom"
                >
                  {templateName}
                </h2>
              )}
              <Badge variant="outline">
                {elements?.length || 0} élément{(elements?.length || 0) > 1 ? 's' : ''}
              </Badge>
              {(canUndo || canRedo) && (
                <Badge variant="secondary" className="text-xs">
                  Historique: {canUndo ? '←' : ''}{canRedo ? '→' : ''}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={undo} 
                disabled={!canUndo}
                title="Annuler la dernière action (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={redo} 
                disabled={!canRedo}
                title="Rétablir l'action suivante (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-gray-300 mx-2" />
              <Button variant="outline" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>

          {/* Zone de travail */}
          <div className="flex-1 p-8 overflow-auto">
            <div 
              className="max-w-4xl mx-auto bg-white shadow-lg border border-gray-200 min-h-[800px] p-8"
              onClick={() => setSelectedElement(null)}
            >
              {(elements?.length || 0) === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Canvas vide
                    </h3>
                    <p className="text-gray-500">
                      Glissez des éléments depuis la palette pour commencer à construire votre template
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0 group">
                  {/* Zone de drop avant le premier élément */}
                  <DropZone index={0} />
                  
                  {elements?.map((element, index) => (
                    <div key={element.id}>
                      <TemplateElementComponent
                        element={element}
                        selectedElement={selectedElement}
                        onSelect={setSelectedElement}
                        onUpdate={handleUpdateElement}
                      />
                      {/* Zone de drop après chaque élément */}
                      <DropZone index={index + 1} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de propriétés */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <PropertiesPanel
            selectedElement={selectedElement}
            onUpdate={handleUpdateElement}
            onDelete={handleDeleteElement}
            onMoveElement={moveElementInParent}
          />
        </div>

        {/* Overlay de drag */}
        <DragOverlay>
          {activeId ? (
            <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg opacity-90">
              {paletteItems.find(item => `palette-${item.type}` === activeId) ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const item = paletteItems.find(item => `palette-${item.type}` === activeId)
                    const Icon = item?.icon
                    return Icon ? <Icon className="h-5 w-5" /> : null
                  })()}
                  <span className="font-medium">
                    {paletteItems.find(item => `palette-${item.type}` === activeId)?.label}
                  </span>
                </div>
              ) : (
                <div>Élément en déplacement</div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
} 