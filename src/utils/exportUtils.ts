import * as XLSX from 'xlsx'

export interface ExportHeader {
  label: string
  key: string
}

/**
 * Clean string formatting for CSV export handling commas, quotes, linebreaks
 */
function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Downloads data as a CSV file with UTF-8 BOM so Excel opens special characters correctly.
 */
export function exportToCSV(filename: string, headers: ExportHeader[], data: Record<string, any>[]) {
  const headerRow = headers.map(h => escapeCSVValue(h.label)).join(',')
  const dataRows = data.map(row => {
    return headers.map(h => escapeCSVValue(row[h.key] ?? '')).join(',')
  })

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Downloads data as an Excel (.xlsx) file using SheetJS (xlsx).
 */
export function exportToExcel(filename: string, sheetName: string, headers: ExportHeader[], data: Record<string, any>[]) {
  // Format rows with labeled headers
  const formattedData = data.map(row => {
    const obj: Record<string, any> = {}
    headers.forEach(h => {
      obj[h.label] = row[h.key] ?? ''
    })
    return obj
  })

  const worksheet = XLSX.utils.json_to_sheet(formattedData)

  // Calculate column widths automatically
  const colWidths = headers.map(h => {
    let maxLen = h.label.length
    formattedData.forEach(row => {
      const valStr = String(row[h.label] ?? '')
      if (valStr.length > maxLen) maxLen = Math.min(valStr.length, 50)
    })
    return { wch: Math.max(maxLen + 4, 12) }
  })
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31) || 'Data')

  const excelFileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(workbook, excelFileName)
}
