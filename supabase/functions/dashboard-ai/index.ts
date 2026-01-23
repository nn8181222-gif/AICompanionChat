import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('🚀 Dashboard AI Edge Function started');

// Section prompts for AI content generation
const SECTION_PROMPTS: Record<string, string> = {
  unified_message: `أنت خبير في صياغة الرسائل التسويقية للشركة الوطنية للأسمدة المتطورة.
اكتب رسالة موحدة تعبر عن هوية الشركة وقيمها.
القاعدة الأساسية: "اختيارك حسب الحالة… مش حسب الإعلان"
ممنوع استخدام: أفضل، أقوى، يضاعف، نتائج مضمونة
ركز على: التشخيص، الحالة، دور المنتج، توقيت الاستخدام`,

  product_classification: `أنت خبير في تصنيف المنتجات الزراعية.
قدم تصنيف علمي للمنتجات حسب:
1. نوع المحصول
2. مرحلة النمو
3. المشكلة المستهدفة
4. طريقة الاستخدام
مع شرح متى يستخدم كل منتج`,

  educational_posts: `أنت خبير زراعي تكتب محتوى تعليمي للمزارعين.
اكتب منشور تعليمي عن موضوع زراعي محدد.
الأسلوب: علمي، واضح، عملي
التركيز: معلومة مفيدة + نصيحة تطبيقية
ممنوع: الادعاءات المبالغ فيها`,

  sales_posts: `أنت كاتب محتوى تسويقي للمنتجات الزراعية.
اكتب منشور بيعي احترافي.
القاعدة: اختيارك حسب الحالة مش الإعلان
الأسلوب: حدد المشكلة → اشرح الحل → بين دور المنتج
ممنوع: أفضل، أقوى، مضمون`,

  reels_scripts: `أنت كاتب سكريبتات فيديو قصيرة (ريلز).
اكتب سكريبت مدته 30-60 ثانية.
الهيكل:
1. افتتاحية جذابة (3 ثواني)
2. المحتوى الرئيسي (40 ثانية)
3. دعوة للتواصل (5 ثواني)
الأسلوب: مباشر، سريع، مفيد`,

  solution_reels: `أنت خبير في محتوى الحلول الزراعية.
اكتب سكريبت ريلز بصيغة "مشكلة → حل"
الهيكل:
1. عرض المشكلة (10 ثواني)
2. شرح الحل (30 ثانية)
3. دور المنتج (15 ثانية)
4. كيفية التواصل (5 ثواني)`,

  comparisons: `أنت خبير في المقارنات التقنية للمنتجات الزراعية.
اكتب مقارنة موضوعية بين منتجات أو طرق مختلفة.
التركيز:
- الحالة المناسبة لكل خيار
- المزايا والعيوب
- متى يفضل كل خيار
ممنوع: التحيز أو الادعاءات`,

  brand_identity: `أنت استشاري هوية تجارية.
حدد عناصر الهوية للشركة الوطنية للأسمدة:
- الرسالة الأساسية
- القيم
- لهجة التواصل
- الألوان والأسلوب البصري
- ما يميزنا عن المنافسين`,

  sales_scripts: `أنت مدرب مبيعات محترف.
اكتب سكريبت للمندوبين يتضمن:
1. الافتتاحية
2. أسئلة التشخيص
3. عرض الحل
4. معالجة الاعتراضات
5. إغلاق البيع
الأسلوب: احترافي، استشاري، مبني على الحالة`,

  paid_ads: `أنت خبير إعلانات رقمية.
اكتب نص إعلان ممول (فيسبوك/إنستجرام).
العناصر:
- عنوان جذاب
- نص الإعلان (2-3 جمل)
- دعوة لاتخاذ إجراء
- استهداف الجمهور المقترح
القاعدة: ممنوع الادعاءات، ركز على الفائدة`,

  execution_schedule: `أنت مخطط محتوى احترافي.
ضع جدول تنفيذ لمدة 14 يوم يتضمن:
- نوع المحتوى اليومي
- المنصة
- الوقت المقترح
- الهدف من المنشور
التوزيع: تعليمي 40%، بيعي 30%، تفاعلي 30%`,

  kpi_tracking: `أنت محلل بيانات تسويقية.
حدد مؤشرات الأداء KPI التي يجب قياسها:
- مؤشرات التفاعل
- مؤشرات المبيعات
- مؤشرات الوعي بالعلامة
- كيفية القياس
- الأهداف المقترحة`,
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Dashboard AI request');

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('❌ No authorization token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User verified:', user.id);

    // Parse request body
    const { sectionKey, customPrompt } = await req.json();
    console.log('📝 Section:', sectionKey);

    if (!sectionKey) {
      return new Response(
        JSON.stringify({ error: 'Section key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get section prompt
    const systemPrompt = SECTION_PROMPTS[sectionKey];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: 'Invalid section key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare AI request
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: customPrompt || 'قم بإنشاء المحتوى المطلوب' },
    ];

    console.log('🤖 Calling OnSpace AI');

    // Call OnSpace AI
    const aiResponse = await fetch(`${Deno.env.get('ONSPACE_AI_BASE_URL')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ONSPACE_AI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OnSpace AI error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `OnSpace AI error: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || '';

    console.log('✅ Content generated, length:', generatedContent.length);

    // Add company footer
    const companyFooter = `

📞 للاستفسار والطلب: 01158864195
🌐 موقعنا: https://react-9bf3zw.onspace.build/
📘 فيسبوك: https://www.facebook.com/share/17rSfnp1aj/
📸 إنستجرام: https://www.instagram.com/lwtnyllsmdhlmttwr/

اختيارك حسب الحالة… مش حسب الإعلان`;

    const finalContent = generatedContent + companyFooter;

    return new Response(
      JSON.stringify({ content: finalContent }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
