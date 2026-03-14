import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateAssets() {
  const generateWithRetry = async (params: any, retries = 5, delay = 3000): Promise<any> => {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      const isRateLimited = errMsg.includes("429") || err.status === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
      
      if (isRateLimited && retries > 0) {
        console.log(`Rate limited or quota hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateWithRetry(params, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  console.log("Generating Background...");
  const bgResponse = await generateWithRetry({
    model: "gemini-2.5-flash-image",
    contents: [{
      text: "A professional, ultra-high-resolution digital illustration in a high-fantasy, Studio Ghibli-inspired art style, depicting a traditional Japanese open-air hot spring (rotenburo) nestled in a lush, ancient cedar forest. The entire background is dominated by breathtaking panoramic views of a winding river valley and rolling, forested mountains under a soft, golden sunrise. Traditional wooden railing posts and heavy cedar beams define the covered deck area in the foreground. Natural, sun-baked gray boulders of various sizes form the rugged edge of the onsen. In the exact visual center of the boulder-edged bath, the crystal-clear, deep turquoise-blue water shimmers with complex, realistic light refractions and gentle, complex ripples. To the far right, on a section of clean, dark cedar decking, sits a low, traditional, simple light-oak wooden bench. The wood grain on the bench is distinct. The dark wood floor decking is clearly visible and clean directly beneath the bench seat. A cast iron tetsubin (iron kettle) is set upon a stone-carved, traditional heating stove on the left, emitting a soft, detailed plume of white steam. Sunbeams filter through complex tree branches and a delicate shoji screen partition on the far right, casting intricate dappled light and shadow patterns across the scene. Slightly elevated perspective. ZERO TEXT."
    }],
    config: {
        imageConfig: {
            aspectRatio: "16:9"
        }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("Generating Eevee...");
  const eeveeResponse = await generateWithRetry({
    model: "gemini-2.5-flash-image",
    contents: [{
      text: "A high-resolution, full-body digital painting of Eevee, rendered in a Studio Ghibli-inspired art style. Eevee is standing, facing forward with a bright, engaged expression. The model has clean outlines and detailed fur texture. Plain white background."
    }]
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("Generating Snorlax...");
  const snorlaxResponse = await generateWithRetry({
    model: "gemini-2.5-flash-image",
    contents: [{
      text: "A high-resolution, full-body digital painting of Snorlax, rendered in a Studio Ghibli-inspired art style. Snorlax is wide, massive, and happy. Plain white background."
    }]
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("Generating Ash...");
  const ashResponse = await generateWithRetry({
    model: "gemini-2.5-flash-image",
    contents: [{
      text: "A high-resolution head-and-shoulders portrait of Ash Ketchum in a Studio Ghibli-inspired art style, with a reassuring, expert expression, set on a plain white background."
    }]
  });

  const extractImage = (response) => {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  };

  return {
    bg: extractImage(bgResponse),
    eevee: extractImage(eeveeResponse),
    snorlax: extractImage(snorlaxResponse),
    ash: extractImage(ashResponse)
  };
}

generateAssets().then(assets => {
    console.log(JSON.stringify(assets));
}).catch(err => {
    console.error(err);
    process.exit(1);
});
