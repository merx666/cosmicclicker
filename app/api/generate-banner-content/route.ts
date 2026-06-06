import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, vibe, type } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set on the server." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        let systemPrompt = "";

        if (type === "background") {
            systemPrompt = `You are a Canvas 2D Code Generator.
      Write strictly valid JavaScript code for a function body that draws a pattern on a HTML5 Canvas context 'ctx'.
      The canvas size is 960x100.
      Variables available: 'ctx' (Context2D), 'width' (960), 'height' (100), 'frame' (animation counter).
      
      User Prompt: "${prompt || vibe}"
      Style: "${vibe || "Cyberpunk"}"

      Rules:
      1. Do NOT wrap in markdown code blocks.
      2. Do NOT use functions like 'requestAnimationFrame'. Just draw ONE frame based on the 'frame' variable.
      3. Use simple, high-contrast colors (Neon Green, Black, Orange).
      4. Example Output:
         ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,height); ctx.lineWidth=2; ctx.strokeStyle='#0f0'; ctx.beginPath(); ctx.moveTo((frame*5)%width, 0); ctx.lineTo((frame*5)%width, height); ctx.stroke();
      `;
        } else {
            systemPrompt = `You are a creative copywriter for a darknet vendor marketplace called PureOnly. 
      Your style is: ${vibe || "Cyberpunk, dark, edgy, minimal, high-contrast"}.
      
      Generate 3 short, punchy, catchy slogans/headlines for a banner advertisement.
      They should be 2-5 words max.
      Examples: "PURE QUALITY", "NO LOGS", "ESCROW SECURED", "FAST DISPATCH".
      
      Also suggest a color palette (Hex codes) matching the vibe: 2 colors (Background, Foreground).
      
      Output JSON format:
      {
        "slogans": ["Slogan 1", "Slogan 2", "Slogan 3"],
        "colors": {
          "background": "#000000",
          "foreground": "#CCFF00"
        }
      }`;
        }

        const generateWithRetry = async (prompt: string, retries = 3, delay = 2000): Promise<string> => {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                if (retries > 0 && error.status === 429) {
                    console.log(`Quota exceeded. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(prompt, retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const text = await generateWithRetry(systemPrompt);

        // Clean up potential markdown formatting in JSON response
        const cleanText = text.replace(/```json/g, "").replace(/```javascript/g, "").replace(/```/g, "").trim();

        if (type === "background") {
            return NextResponse.json({ code: cleanText });
        }

        const data = JSON.parse(cleanText);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate content." },
            { status: 500 }
        );
    }
}
