import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction pour convertir les couleurs oklch en RGB pour la compatibilité PDF
export function convertOklchToRgb(oklchValue: string): string {
  // Table de conversion pour les couleurs oklch courantes
  const oklchToRgb: Record<string, string> = {
    'oklch(1 0 0)': '#ffffff',
    'oklch(0.147 0.004 49.25)': '#1f2937',
    'oklch(0.216 0.006 56.043)': '#374151',
    'oklch(0.985 0.001 106.423)': '#f9fafb',
    'oklch(0.97 0.001 106.424)': '#f3f4f6',
    'oklch(0.923 0.003 48.717)': '#e5e7eb',
    'oklch(0.709 0.01 56.259)': '#9ca3af',
    'oklch(0.577 0.245 27.325)': '#ef4444',
    'oklch(0.646 0.222 41.116)': '#3b82f6',
    'oklch(0.6 0.118 184.704)': '#10b981',
    'oklch(0.398 0.07 227.392)': '#6366f1',
    'oklch(0.828 0.189 84.429)': '#f59e0b',
    'oklch(0.769 0.188 70.08)': '#84cc16'
  }
  
  return oklchToRgb[oklchValue] || oklchValue
}

// Fonction pour nettoyer les styles CSS problématiques pour la génération PDF
export function sanitizeElementForPdf(element: HTMLElement): HTMLElement {
  // Nettoyer récursivement tous les éléments enfants
  const allElements = element.querySelectorAll('*')
  
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const computedStyle = getComputedStyle(htmlEl)
    
    // Remplacer les couleurs oklch par des équivalents RGB
    if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
      htmlEl.style.backgroundColor = convertOklchToRgb(computedStyle.backgroundColor)
    }
    
    if (computedStyle.color && computedStyle.color.includes('oklch')) {
      htmlEl.style.color = convertOklchToRgb(computedStyle.color)
    }
    
    if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
      htmlEl.style.borderColor = convertOklchToRgb(computedStyle.borderColor)
    }
    
    // Supprimer les gradients et autres propriétés problématiques
    if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
      htmlEl.style.backgroundImage = 'none'
    }
    
    // Simplifier les transformations complexes
    if (computedStyle.transform && computedStyle.transform !== 'none') {
      htmlEl.style.transform = 'none'
    }
    
    // Supprimer les filtres
    if (computedStyle.filter && computedStyle.filter !== 'none') {
      htmlEl.style.filter = 'none'
    }
  })
  
  return element
}
