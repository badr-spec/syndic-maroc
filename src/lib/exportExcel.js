import * as XLSX from 'xlsx'

export function exportToExcel(data, filename = 'export', sheetName = 'Données') {
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    // Auto-fit column widths
    const colWidths = Object.keys(data[0] || {}).map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) }
    })
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `${filename}.xlsx`)
  } catch (err) {
    console.error('Export Excel failed:', err)
  }
}
