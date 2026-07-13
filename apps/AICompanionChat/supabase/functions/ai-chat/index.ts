import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('🚀 AI Chat Edge Function started');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Incoming request');

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
    const { messages, characterId, systemPrompt } = await req.json();
    console.log('📝 Request data:', { messageCount: messages?.length, characterId });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is an image generation request
    const lastMessage = messages[messages.length - 1];
    const imageKeywords = ['draw', 'generate image', 'create image', 'make image', 'picture of', 'show me'];
    const isImageRequest = imageKeywords.some(keyword => 
      lastMessage.content.toLowerCase().includes(keyword)
    );

    console.log('🎨 Is image request:', isImageRequest);

    // Prepare AI request
    const aiModel = isImageRequest ? 'google/gemini-2.5-flash-image' : 'google/gemini-3-flash-preview';
    const aiMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ];

    const aiRequestBody: any = {
      model: aiModel,
      messages: aiMessages,
      stream: true,
      temperature: 0.8,
      max_tokens: 2000
    };

    // Add modalities for image generation
    if (isImageRequest) {
      aiRequestBody.modalities = ['image', 'text'];
      aiRequestBody.image_config = { aspect_ratio: '1:1' };
    }

    console.log('🤖 Calling OnSpace AI with model:', aiModel);

    // Call OnSpace AI
    const aiResponse = await fetch(`${Deno.env.get('ONSPACE_AI_BASE_URL')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ONSPACE_AI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OnSpace AI error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `OnSpace AI error: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ OnSpace AI response received, streaming to client');

    // Create service role client for Storage operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process streaming response
    const reader = aiResponse.body?.getReader();
    const decoder = new TextDecoder();
    
    // Create a readable stream to send to client
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let imageData = '';

        try {
          while (reader) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('✅ Stream complete');
              
              // If image was generated, upload to Storage
              if (imageData) {
                console.log('📤 Uploading image to Storage...');
                
                try {
                  // Extract base64 data
                  const base64Match = imageData.match(/data:image\/[^;]+;base64,(.+)/);
                  if (base64Match) {
                    const base64Data = base64Match[1];
                    
                    // Convert base64 to Uint8Array
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    // Upload to Storage
                    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
                    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                      .from('chat-images')
                      .upload(fileName, bytes, {
                        contentType: 'image/png',
                        upsert: false
                      });

                    if (uploadError) {
                      console.error('❌ Storage upload error:', uploadError);
                    } else {
                      console.log('✅ Image uploaded:', uploadData.path);
                      
                      // Get public URL
                      const { data: urlData } = supabaseAdmin.storage
                        .from('chat-images')
                        .getPublicUrl(fileName);
                      
                      console.log('🔗 Public URL:', urlData.publicUrl);
                      
                      // Send image URL to client
                      controller.enqueue(
                        new TextEncoder().encode(`data: ${JSON.stringify({ image_url: urlData.publicUrl })}\n\n`)
                      );
                    }
                  }
                } catch (uploadErr) {
                  console.error('❌ Image processing error:', uploadErr);
                }
              }
              
              // Send final [DONE]
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log('📦 Chunk received:', chunk.substring(0, 100));

            // Parse SSE data
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;

                  // Handle text content
                  if (delta?.content) {
                    console.log('📝 Content chunk:', delta.content);
                    fullContent += delta.content;
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`)
                    );
                  }

                  // Handle image data
                  if (delta?.images?.[0]?.image_url?.url) {
                    console.log('🖼️ Image data received');
                    imageData = delta.images[0].image_url.url;
                  }
                } catch (parseErr) {
                  console.error('⚠️ Parse error:', parseErr);
                }
              }
            }
          }
        } catch (err) {
          console.error('❌ Stream error:', err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
