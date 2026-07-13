/**
 * الشركة الوطنية للأسمدة المتطورة وإضافات الأعلاف
 * Alwataneya Advanced Fertilizers & Feed Additives
 */

export const COMPANY = {
  name: {
    ar: 'الشركة الوطنية للأسمدة المتطورة وإضافات الأعلاف',
    en: 'Alwataneya Advanced Fertilizers & Feed Additives',
  },
  
  website: 'https://react-9bf3zw.onspace.build/',
  
  phone: '01158864195',
  
  social: {
    facebook: 'https://www.facebook.com/share/17rSfnp1aj/',
    instagram: 'https://www.instagram.com/lwtnyllsmdhlmttwr/',
  },
  
  // Core messaging principle
  tagline: {
    ar: 'اختيارك حسب الحالة… مش حسب الإعلان',
    en: 'Your choice based on the condition... not the advertisement',
  },
  
  // Content guidelines
  guidelines: {
    forbidden: ['أفضل', 'أقوى', 'يضاعف', 'نتائج مضمونة'],
    allowed: ['تشخيص', 'حالة', 'دور المنتج', 'توقيت الاستخدام'],
  },
};

// Helper function to get company footer for content
export function getCompanyFooter() {
  return `
📞 للاستفسار والطلب: ${COMPANY.phone}
🌐 موقعنا: ${COMPANY.website}
📘 فيسبوك: ${COMPANY.social.facebook}
📸 إنستجرام: ${COMPANY.social.instagram}

${COMPANY.tagline.ar}
`.trim();
}

// Helper function to validate content against guidelines
export function validateContent(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  COMPANY.guidelines.forbidden.forEach(word => {
    if (content.includes(word)) {
      issues.push(`يحتوي على كلمة ممنوعة: "${word}"`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
