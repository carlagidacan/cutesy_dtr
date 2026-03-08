import attendanceTemplateImage from '../assets/ACO-CI-F-017 ATTENDANCE REPORT_page-0001.jpg'

export const ATTENDANCE_TEMPLATE_BASE64 = ''

const TEMPLATE_CONFIG = {
	template: {
		src: ATTENDANCE_TEMPLATE_BASE64 || attendanceTemplateImage,
		imageType: 'JPEG',
		fileNamePrefix: 'Daily_Attendance_Report',
		originalWidth: 1241,
		originalHeight: 1755
	},

	page: {
		format: 'a4',
		orientation: 'portrait',
		unit: 'mm',
		width: 210,
		height: 297
	},

	coordinates: {
		name: {
			x: 295,
			y: 283,
			align: 'left',
			maxWidth: 520
		},
		company: {
			x: 295,
			y: 320,
			align: 'left',
			maxWidth: 520
		},

		previousTotal: {
			x: 290,
			y: 1423,
			align: 'center',
			maxWidth: 120
		},
		totalThisPeriod: {
			x: 570,
			y: 1423,
			align: 'center',
			maxWidth: 120
		},
		totalHoursServed: {
			x: 1050,
			y: 1423,
			align: 'center',
			maxWidth: 140
		},

		table: {
			startY: 453,
			rowHeight: 42,
			rowGap: 4,
			maxRows: 21,
			columns: {
				date: { x: 198, align: 'center', maxWidth: 120 },
				timeIn: { x: 406, align: 'center', maxWidth: 120 },
				timeOut: { x: 614, align: 'center', maxWidth: 120 },
				totalHours: { x: 822, align: 'center', maxWidth: 140 }
			}
		}
	},

	fonts: {
		normal: { family: 'helvetica', style: 'normal', size: 10 },
		table: { family: 'helvetica', style: 'normal', size: 10 }
	},

	textColor: [22, 28, 45],
	placeholders: {
		empty: '-'
	}
}

export default TEMPLATE_CONFIG
