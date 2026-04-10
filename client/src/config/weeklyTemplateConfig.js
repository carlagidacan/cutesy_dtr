import weeklyActivityTemplateImage from '../assets/ACO-CI-F-016 WEEKLY ACTIVITY REPORT_page-0001.jpg'

const WEEKLY_TEMPLATE_CONFIG = {
  template: {
    src: weeklyActivityTemplateImage,
    imageType: 'JPEG',
    fileNamePrefix: 'Weekly_Activity_Report',
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

  // All pixel coordinates are relative to the template image (1241 x 1755)
  coordinates: {
    // Name field: row right of "Name:" label (~row 1)
    name: {
			x: 295,
			y: 284,
			align: 'left',
			maxWidth: 520
		},
		company: {
			x: 295,
			y: 315,
			align: 'left',
			maxWidth: 520
		},

    // Week Covered field: right of "Week Covered:" label
    weekCovered: {
      x: 295,
      y: 345,
      align: 'left',
      maxWidth: 900
    },

    // Tasks/Activities paragraph start
    tasks: {
      x: 116,
      y: 430,
      maxWidth: 994,
      lineHeight: 38
    },

    // Reflection/Experience paragraph start
    reflection: {
      x: 116,
      y: 1035,
      maxWidth: 994,
      lineHeight: 38
    }
  },

  fonts: {
    normal: { family: 'helvetica', style: 'normal', size: 10 }
  },

  textColor: [22, 28, 45]
}

export default WEEKLY_TEMPLATE_CONFIG
