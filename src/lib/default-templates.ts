export const defaultTemplates = [
  {
    name: "Template Business Classique",
    description: "Un template professionnel et épuré, parfait pour les entreprises traditionnelles",
    category: "BUSINESS" as const,
    isDefault: true,
    isPublic: true,
    layout: {
      width: "210mm",
      height: "297mm", // A4
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm"
      },
      columns: 1,
      orientation: "portrait"
    },
    elements: [
      {
        id: "header",
        type: "header",
        position: { x: 0, y: 0 },
        size: { width: "100%", height: "80px" },
        content: {
          logo: {
            position: "left",
            maxWidth: "100px",
            maxHeight: "60px"
          },
          companyInfo: {
            position: "right",
            fields: ["{{company.name}}", "{{company.address}}", "{{company.phone}}", "{{company.email}}"]
          }
        },
        style: {
          backgroundColor: "#ffffff",
          borderBottom: "2px solid #e5e7eb",
          padding: "20px"
        }
      },
      {
        id: "invoice-info",
        type: "section",
        position: { x: 0, y: 80 },
        size: { width: "100%", height: "120px" },
        content: {
          title: "FACTURE",
          fields: [
            { label: "Numéro", value: "{{invoice.number}}" },
            { label: "Date", value: "{{invoice.date}}" },
            { label: "Échéance", value: "{{invoice.dueDate}}" }
          ]
        },
        style: {
          fontSize: "14px",
          padding: "20px"
        }
      },
      {
        id: "client-info",
        type: "section",
        position: { x: 0, y: 200 },
        size: { width: "50%", height: "100px" },
        content: {
          title: "Facturé à :",
          fields: [
            "{{client.name}}",
            "{{client.company}}",
            "{{client.address}}",
            "{{client.email}}"
          ]
        },
        style: {
          fontSize: "12px",
          padding: "20px"
        }
      },
      {
        id: "items-table",
        type: "table",
        position: { x: 0, y: 320 },
        size: { width: "100%", height: "auto" },
        content: {
          headers: ["Description", "Quantité", "Prix unitaire", "Total"],
          rows: "{{invoice.items}}",
          footers: [
            { label: "Sous-total", value: "{{invoice.subtotal}}" },
            { label: "TVA ({{invoice.taxRate}}%)", value: "{{invoice.taxAmount}}" },
            { label: "Total", value: "{{invoice.total}}", highlight: true }
          ]
        },
        style: {
          borderCollapse: "collapse",
          width: "100%",
          fontSize: "12px"
        }
      },
      {
        id: "footer",
        type: "footer",
        position: { x: 0, y: -80 },
        size: { width: "100%", height: "60px" },
        content: {
          text: "Merci pour votre confiance. {{company.paymentTerms}}",
          centerAlign: true
        },
        style: {
          fontSize: "10px",
          color: "#6b7280",
          borderTop: "1px solid #e5e7eb",
          padding: "20px"
        }
      }
    ],
    styles: {
      colors: {
        primary: "#1f2937",
        secondary: "#6b7280",
        accent: "#3b82f6",
        background: "#ffffff"
      },
      fonts: {
        primary: "Arial, sans-serif",
        secondary: "Arial, sans-serif"
      },
      spacing: {
        small: "8px",
        medium: "16px",
        large: "24px"
      }
    },
    variables: {
      company: {
        name: "Nom de l'entreprise",
        address: "Adresse complète",
        phone: "Téléphone",
        email: "Email",
        paymentTerms: "Conditions de paiement"
      },
      invoice: {
        number: "Numéro de facture",
        date: "Date d'émission",
        dueDate: "Date d'échéance",
        subtotal: "Sous-total HT",
        taxRate: "Taux de TVA",
        taxAmount: "Montant TVA",
        total: "Total TTC",
        items: "Liste des articles"
      },
      client: {
        name: "Nom du client",
        company: "Entreprise",
        address: "Adresse",
        email: "Email"
      }
    }
  },
  {
    name: "Template Moderne Coloré",
    description: "Un design moderne avec des couleurs vives pour les entreprises créatives",
    category: "MODERN" as const,
    isDefault: true,
    isPublic: true,
    layout: {
      width: "210mm",
      height: "297mm",
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm"
      },
      columns: 1,
      orientation: "portrait"
    },
    elements: [
      {
        id: "header",
        type: "header",
        position: { x: 0, y: 0 },
        size: { width: "100%", height: "100px" },
        content: {
          logo: {
            position: "left",
            maxWidth: "80px",
            maxHeight: "80px"
          },
          companyInfo: {
            position: "right",
            fields: ["{{company.name}}", "{{company.address}}", "{{company.phone}}", "{{company.email}}"]
          }
        },
        style: {
          background: "#667eea", // Couleur unie au lieu du dégradé pour compatibilité PDF
          color: "#ffffff",
          borderRadius: "12px",
          padding: "24px"
        }
      },
      {
        id: "invoice-banner",
        type: "section",
        position: { x: 0, y: 120 },
        size: { width: "100%", height: "60px" },
        content: {
          title: "FACTURE #{{invoice.number}}",
          subtitle: "Émise le {{invoice.date}}"
        },
        style: {
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          textAlign: "center",
          fontSize: "18px",
          fontWeight: "bold"
        }
      },
      {
        id: "client-card",
        type: "section",
        position: { x: 0, y: 200 },
        size: { width: "100%", height: "120px" },
        content: {
          title: "Facturé à",
          fields: [
            "{{client.name}}",
            "{{client.company}}",
            "{{client.address}}",
            "{{client.email}}"
          ]
        },
        style: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }
      },
      {
        id: "items-table",
        type: "table",
        position: { x: 0, y: 340 },
        size: { width: "100%", height: "auto" },
        content: {
          headers: ["Description", "Qté", "Prix unitaire", "Total"],
          rows: "{{invoice.items}}",
          footers: [
            { label: "Sous-total", value: "{{invoice.subtotal}}" },
            { label: "TVA", value: "{{invoice.taxAmount}}" },
            { label: "TOTAL", value: "{{invoice.total}}", highlight: true }
          ]
        },
        style: {
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }
      }
    ],
    styles: {
      colors: {
        primary: "#667eea",
        secondary: "#764ba2",
        accent: "#4ade80",
        background: "#f8fafc"
      },
      fonts: {
        primary: "Inter, sans-serif",
        secondary: "Inter, sans-serif"
      },
      spacing: {
        small: "8px",
        medium: "16px",
        large: "24px"
      }
    },
    variables: {
      company: {
        name: "Nom de l'entreprise",
        address: "Adresse complète",
        phone: "Téléphone",
        email: "Email"
      },
      invoice: {
        number: "Numéro de facture",
        date: "Date d'émission",
        dueDate: "Date d'échéance",
        subtotal: "Sous-total HT",
        taxAmount: "Montant TVA",
        total: "Total TTC",
        items: "Liste des articles"
      },
      client: {
        name: "Nom du client",
        company: "Entreprise",
        address: "Adresse",
        email: "Email"
      }
    }
  },
  {
    name: "Template Minimaliste",
    description: "Design épuré et minimaliste pour un style professionnel sobre",
    category: "MINIMAL" as const,
    isDefault: true,
    isPublic: true,
    layout: {
      width: "210mm",
      height: "297mm",
      margin: {
        top: "25mm",
        right: "25mm",
        bottom: "25mm",
        left: "25mm"
      },
      columns: 1,
      orientation: "portrait"
    },
    elements: [
      {
        id: "header",
        type: "header",
        position: { x: 0, y: 0 },
        size: { width: "100%", height: "60px" },
        content: {
          logo: {
            position: "left",
            maxWidth: "120px",
            maxHeight: "40px"
          },
          title: {
            position: "right",
            text: "FACTURE",
            style: {
              fontSize: "24px",
              fontWeight: "300",
              letterSpacing: "2px"
            }
          }
        },
        style: {
          borderBottom: "1px solid #000000",
          paddingBottom: "20px"
        }
      },
      {
        id: "info-grid",
        type: "grid",
        position: { x: 0, y: 80 },
        size: { width: "100%", height: "120px" },
        content: {
          columns: 2,
          left: {
            title: "De :",
            fields: [
              "{{company.name}}",
              "{{company.address}}",
              "{{company.email}}"
            ]
          },
          right: {
            title: "À :",
            fields: [
              "{{client.name}}",
              "{{client.company}}",
              "{{client.address}}"
            ]
          }
        },
        style: {
          fontSize: "12px",
          lineHeight: "1.6"
        }
      },
      {
        id: "invoice-details",
        type: "section",
        position: { x: 0, y: 220 },
        size: { width: "100%", height: "40px" },
        content: {
          inline: [
            { label: "Numéro:", value: "{{invoice.number}}" },
            { label: "Date:", value: "{{invoice.date}}" },
            { label: "Échéance:", value: "{{invoice.dueDate}}" }
          ]
        },
        style: {
          fontSize: "11px",
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "10px"
        }
      },
      {
        id: "items-table",
        type: "table",
        position: { x: 0, y: 280 },
        size: { width: "100%", height: "auto" },
        content: {
          headers: ["Description", "Quantité", "Prix unitaire", "Total"],
          rows: "{{invoice.items}}",
          footers: [
            { label: "Sous-total", value: "{{invoice.subtotal}}" },
            { label: "TVA", value: "{{invoice.taxAmount}}" },
            { label: "Total", value: "{{invoice.total}}", highlight: true }
          ]
        },
        style: {
          border: "none",
          fontSize: "11px",
          minimalistTable: true
        }
      }
    ],
    styles: {
      colors: {
        primary: "#000000",
        secondary: "#666666",
        accent: "#000000",
        background: "#ffffff"
      },
      fonts: {
        primary: "Helvetica, Arial, sans-serif",
        secondary: "Helvetica, Arial, sans-serif"
      },
      spacing: {
        small: "6px",
        medium: "12px",
        large: "20px"
      }
    },
    variables: {
      company: {
        name: "Nom de l'entreprise",
        address: "Adresse",
        email: "Email"
      },
      invoice: {
        number: "Numéro",
        date: "Date",
        dueDate: "Échéance",
        subtotal: "Sous-total",
        taxAmount: "TVA",
        total: "Total",
        items: "Articles"
      },
      client: {
        name: "Client",
        company: "Société",
        address: "Adresse"
      }
    }
  }
] 