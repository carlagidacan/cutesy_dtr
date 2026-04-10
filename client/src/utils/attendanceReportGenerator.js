import jsPDF from 'jspdf'
import ATTENDANCE_TEMPLATE_CONFIG from '../config/attendanceTemplateConfig'
import { loadAttendanceTemplate } from './templateLoader'

const formatReportDate = (value) => {
  if (!value) {
    return ATTENDANCE_TEMPLATE_CONFIG.placeholders.empty
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
}

const formatReportTime = (value) => {
  if (!value) {
    return ATTENDANCE_TEMPLATE_CONFIG.placeholders.empty
  }

  return new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const formatReportHours = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return ATTENDANCE_TEMPLATE_CONFIG.placeholders.empty
  }

  const hours = Math.floor(numericValue)
  const minutes = Math.round((numericValue - hours) * 60)

  if (hours === 0) {
    return `${minutes}m`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

const sanitizeFileName = (value) => value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '')

const applyFont = (doc, font) => {
  doc.setFont(font.family, font.style)
  doc.setFontSize(font.size)
}

const toPdfX = (x, layoutMetrics) => layoutMetrics.offsetX + ((x / ATTENDANCE_TEMPLATE_CONFIG.template.originalWidth) * layoutMetrics.renderWidth)

const toPdfY = (y, layoutMetrics) => layoutMetrics.offsetY + ((y / ATTENDANCE_TEMPLATE_CONFIG.template.originalHeight) * layoutMetrics.renderHeight)

const toPdfWidth = (width, layoutMetrics) => (width / ATTENDANCE_TEMPLATE_CONFIG.template.originalWidth) * layoutMetrics.renderWidth

const drawText = (doc, text, field, layoutMetrics) => {
  doc.text(String(text ?? ''), toPdfX(field.x, layoutMetrics), toPdfY(field.y, layoutMetrics), {
    align: field.align || 'left',
    baseline: 'middle',
    maxWidth: field.maxWidth ? toPdfWidth(field.maxWidth, layoutMetrics) : undefined
  })
}

const chunkRecords = (records, chunkSize) => {
  const chunks = []

  for (let index = 0; index < records.length; index += chunkSize) {
    chunks.push(records.slice(index, index + chunkSize))
  }

  return chunks
}

const addTemplateBackground = (doc, templateImage) => {
  const imageProperties = doc.getImageProperties(templateImage)
  const pageWidth = ATTENDANCE_TEMPLATE_CONFIG.page.width
  const pageHeight = ATTENDANCE_TEMPLATE_CONFIG.page.height
  const imageRatio = imageProperties.width / imageProperties.height
  const pageRatio = pageWidth / pageHeight

  let renderWidth = pageWidth
  let renderHeight = pageHeight
  let offsetX = 0
  let offsetY = 0

  if (imageRatio > pageRatio) {
    renderHeight = pageWidth / imageRatio
    offsetY = (pageHeight - renderHeight) / 2
  } else {
    renderWidth = pageHeight * imageRatio
    offsetX = (pageWidth - renderWidth) / 2
  }

  doc.addImage(
    templateImage,
    ATTENDANCE_TEMPLATE_CONFIG.template.imageType,
    offsetX,
    offsetY,
    renderWidth,
    renderHeight,
    undefined,
    'SLOW'
  )

  return {
    offsetX,
    offsetY,
    renderWidth,
    renderHeight
  }
}

const getRecordsForReport = (timeRecords) => {
  const sortedRecords = [...timeRecords].sort((left, right) => new Date(left.date) - new Date(right.date))
  return sortedRecords
}

const renderReportPage = (doc, layoutMetrics, user, records, previousTotal = 0) => {
  applyFont(doc, ATTENDANCE_TEMPLATE_CONFIG.fonts.normal)
  drawText(doc, user?.name || ATTENDANCE_TEMPLATE_CONFIG.placeholders.empty, ATTENDANCE_TEMPLATE_CONFIG.coordinates.name, layoutMetrics)
  drawText(doc, user?.company || ATTENDANCE_TEMPLATE_CONFIG.placeholders.empty, ATTENDANCE_TEMPLATE_CONFIG.coordinates.company, layoutMetrics)

  // Calculate total for this page's records only
  const totalThisPeriod = records.reduce((total, record) => {
    return total + (parseFloat(record.hours) || 0)
  }, 0)
  
  const totalHoursServed = previousTotal + totalThisPeriod
  
  // Render total hours fields
  drawText(doc, formatReportHours(previousTotal), ATTENDANCE_TEMPLATE_CONFIG.coordinates.previousTotal, layoutMetrics)
  drawText(doc, formatReportHours(totalThisPeriod), ATTENDANCE_TEMPLATE_CONFIG.coordinates.totalThisPeriod, layoutMetrics)
  drawText(doc, formatReportHours(totalHoursServed), ATTENDANCE_TEMPLATE_CONFIG.coordinates.totalHoursServed, layoutMetrics)

  applyFont(doc, ATTENDANCE_TEMPLATE_CONFIG.fonts.table)
  const rowStep = ATTENDANCE_TEMPLATE_CONFIG.coordinates.table.rowHeight + (ATTENDANCE_TEMPLATE_CONFIG.coordinates.table.rowGap || 0)
  const rowPositions = ATTENDANCE_TEMPLATE_CONFIG.coordinates.table.rowPositions || []

  records.forEach((record, index) => {
    const rowY = rowPositions[index] ?? (ATTENDANCE_TEMPLATE_CONFIG.coordinates.table.startY + (index * rowStep))
    const rowFields = ATTENDANCE_TEMPLATE_CONFIG.coordinates.table.columns

    drawText(doc, formatReportDate(record.date), { ...rowFields.date, y: rowY }, layoutMetrics)
    drawText(doc, formatReportTime(record.clockInTime), { ...rowFields.timeIn, y: rowY }, layoutMetrics)
    drawText(doc, formatReportTime(record.clockOutTime), { ...rowFields.timeOut, y: rowY }, layoutMetrics)
    drawText(doc, formatReportHours(record.hours), { ...rowFields.totalHours, y: rowY }, layoutMetrics)
  })
}

export const generateAttendanceReport = async ({ user, timeRecords, totalHoursWorked, previousTotal = 0 }) => {
  const doc = new jsPDF(
    ATTENDANCE_TEMPLATE_CONFIG.page.orientation,
    ATTENDANCE_TEMPLATE_CONFIG.page.unit,
    ATTENDANCE_TEMPLATE_CONFIG.page.format,
    true
  )

  doc.setProperties({
    title: 'Attendance Report',
    subject: 'Generated attendance report',
    author: user?.name || 'DTR App',
    creator: 'DTR App'
  })
  doc.setTextColor(...ATTENDANCE_TEMPLATE_CONFIG.textColor)

  const templateImage = await loadAttendanceTemplate(ATTENDANCE_TEMPLATE_CONFIG.template.src)
  const recordsForReport = getRecordsForReport(timeRecords)
  const pageChunks = chunkRecords(recordsForReport, ATTENDANCE_TEMPLATE_CONFIG.coordinates.table.maxRows)
  const pages = pageChunks.length > 0 ? pageChunks : [[]]

  let cumulativePreviousTotal = previousTotal // Start with external previous total

  pages.forEach((pageRecords, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage(
        ATTENDANCE_TEMPLATE_CONFIG.page.format,
        ATTENDANCE_TEMPLATE_CONFIG.page.orientation
      )
      doc.setTextColor(...ATTENDANCE_TEMPLATE_CONFIG.textColor)
    }

    const layoutMetrics = addTemplateBackground(doc, templateImage)
    renderReportPage(doc, layoutMetrics, user, pageRecords, cumulativePreviousTotal)
    
    // Update cumulative total for next page: add current page's hours to previous total
    const currentPageTotal = pageRecords.reduce((total, record) => {
      return total + (parseFloat(record.hours) || 0)
    }, 0)
    cumulativePreviousTotal += currentPageTotal
  })

  const currentDate = new Date().toISOString().split('T')[0]
  const safeName = sanitizeFileName(user?.name || 'Student')

  doc.save(`${ATTENDANCE_TEMPLATE_CONFIG.template.fileNamePrefix}_${safeName}_${currentDate}.pdf`)
}