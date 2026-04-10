import { jsPDF } from 'jspdf'
import WEEKLY_TEMPLATE_CONFIG from '../config/weeklyTemplateConfig'

const cfg = WEEKLY_TEMPLATE_CONFIG

/**
 * Converts a pixel coordinate (relative to the original template image size)
 * to millimetres on the PDF page.
 */
const pxToMm = (px, axis) => {
  if (axis === 'x') {
    return (px / cfg.template.originalWidth) * cfg.page.width
  }
  return (px / cfg.template.originalHeight) * cfg.page.height
}

const pxWidthToMm = (px) => (px / cfg.template.originalWidth) * cfg.page.width

/**
 * Formats the week covered field based on actual record dates (first → last).
 * Output example: "March 17 - March 20, 2026 (Tue - Fri)"
 */
const formatWeekLabel = (weekRecords, isoWeek) => {
  if (weekRecords && weekRecords.length > 0) {
    const sorted = [...weekRecords].sort((a, b) => new Date(a.date) - new Date(b.date))
    const first = new Date(sorted[0].date)
    const last = new Date(sorted[sorted.length - 1].date)

    const monthDay = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' })
    const yearFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric' })
    const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

    const isSameDate = first.toDateString() === last.toDateString()
    const startLabel = monthDay.format(first)
    const endLabel = monthDay.format(last)
    const endYear = yearFmt.format(last)
    const startDay = dayFmt.format(first)
    const endDay = dayFmt.format(last)

    if (isSameDate) {
      return `${startLabel}, ${endYear} (${startDay})`
    }
    return `${startLabel} - ${endLabel}, ${endYear} (${startDay} - ${endDay})`
  }

  // Fallback: use raw ISO week string if no records provided
  return isoWeek || ''
}

export const generateWeeklyAccomplishmentReport = ({
  user,
  internshipConfig,
  selectedWeek,
  weekRecords,
  tasksAccomplishments,
  learningsDifficulties
}) => {
  const doc = new jsPDF({
    orientation: cfg.page.orientation,
    unit: cfg.page.unit,
    format: cfg.page.format
  })

  // Draw the template image as the full-page background
  doc.addImage(
    cfg.template.src,
    cfg.template.imageType,
    0, 0,
    cfg.page.width,
    cfg.page.height
  )

  // Font setup
  doc.setFont(cfg.fonts.normal.family, cfg.fonts.normal.style)
  doc.setFontSize(cfg.fonts.normal.size)
  doc.setTextColor(...cfg.textColor)

  const studentName = user?.name || ''
  const company = user?.company || ''
  const weekLabel = formatWeekLabel(weekRecords, selectedWeek)

  // ── Name ──
  const nc = cfg.coordinates.name
  doc.text(studentName, pxToMm(nc.x, 'x'), pxToMm(nc.y, 'y'), { align: nc.align })

  // ── Company ──
  const cc = cfg.coordinates.company
  doc.text(company, pxToMm(cc.x, 'x'), pxToMm(cc.y, 'y'), { align: cc.align })

  // ── Week Covered ──
  const wc = cfg.coordinates.weekCovered
  doc.text(weekLabel, pxToMm(wc.x, 'x'), pxToMm(wc.y, 'y'), { align: wc.align })

  // ── Tasks / Activities / Accomplishments ──
  const tc = cfg.coordinates.tasks
  const taskMaxWidthMm = pxWidthToMm(tc.maxWidth)
  const taskLines = doc.splitTextToSize(tasksAccomplishments || '', taskMaxWidthMm)
  const taskLineHeightMm = pxToMm(tc.lineHeight, 'y')
  let taskY = pxToMm(tc.y, 'y')

  // Max lines to avoid overflow into the reflection section
  const reflectionStartMm = pxToMm(cfg.coordinates.reflection.y, 'y')
  taskLines.forEach(line => {
    if (taskY + taskLineHeightMm >= reflectionStartMm - 4) return // stop before overflowing
    doc.text(line, pxToMm(tc.x, 'x'), taskY)
    taskY += taskLineHeightMm
  })

  // ── Reflection / Internship Experience ──
  const rc = cfg.coordinates.reflection
  const reflMaxWidthMm = pxWidthToMm(rc.maxWidth)
  const reflLines = doc.splitTextToSize(learningsDifficulties || '', reflMaxWidthMm)
  const reflLineHeightMm = pxToMm(rc.lineHeight, 'y')
  let reflY = pxToMm(rc.y, 'y')

  // Approximate bottom margin just above signatures
  const bottomLimitMm = cfg.page.height - 45
  reflLines.forEach(line => {
    if (reflY >= bottomLimitMm) return
    doc.text(line, pxToMm(rc.x, 'x'), reflY)
    reflY += reflLineHeightMm
  })

  // Save
  doc.save(`${cfg.template.fileNamePrefix}_${weekLabel}.pdf`)
}
