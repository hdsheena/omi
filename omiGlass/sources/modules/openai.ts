import axios from "axios";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { keys } from "../keys";

/**
 * Transcribe audio file
 */
export async function transcribeAudio(audioPath: string) {
  try {
    const audioBase64 = await FileSystem.readAsStringAsync(audioPath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      { audio: audioBase64 },
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    return null;
  }
}

/**
 * Convert image to Base64
 */
async function imageToBase64(path: string) {
  return await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Describe an image using OpenAI
 */
export async function describeImage(imagePath: string) {
  try {
    const base64Data = await imageToBase64(imagePath);
    const imageBase64 = `data:image/jpeg;base64,${base64Data}`;

    const response = await axios.post(
      "https://api.openai.com/v1/images/descriptions",
      { image: imageBase64 },
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error in describeImage:", error);
    return null;
  }
}

/**
 * Text-to-Speech: generate audio + play it
 */
export async function textToSpeech(text: string) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        input: text,
        voice: "nova",
        model: "tts-1",
      },
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    // Convert arraybuffer -> base64 string
    const base64Audio = Buffer.from(response.data).toString("base64");

    // Save audio file
    const path = `${FileSystem.cacheDirectory}tts_output.mp3`;
    await FileSystem.writeAsStringAsync(path, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Load & play audio
    const { sound } = await Audio.Sound.createAsync({ uri: path });
    await sound.playAsync();

    return path;
  } catch (error) {
    console.error("Error in textToSpeech:", error);
    return null;
  }
}

/**
 * GPT chat request
 */
export async function gptRequest(systemPrompt: string, userPrompt: string) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${keys.openai}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error in gptRequest:", error);
    return null;
  }
}

/**
 * Example usage
 */
(async () => {
  await textToSpeech("Hello I am an agent");

  console.info(
    await gptRequest(
      `
      You are a smart AI that needs to read through image descriptions 
      and answer the user's questions.

      These are the provided images:
      The image features a woman standing in an open space with a metal roof, 
      possibly at a train station or another large building. 
      She is wearing a hat and appears to be looking up towards the sky. 
      The scene captures her attention as she gazes upwards.

      DO NOT mention the images, scenes, or descriptions in your answer. 
      ONLY use the information in the description of the images. 
      BE concise and specific.
      `,
      "where is the person?"
    )
  );
})();
