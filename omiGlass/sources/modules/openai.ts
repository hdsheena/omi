import axios from "axios";
import * as RNFS from "react-native-fs";
import Sound = require("react-native-sound");

import { keys } from "../keys";

/**
 * Transcribe audio file
 */
export async function transcribeAudio(audioPath: string) {
  try {
    const audioBase64 = await RNFS.readFile(audioPath, "base64");

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
  const image = await RNFS.readFile(path, "base64");
  return `data:image/jpeg;base64,${image}`;
}

/**
 * Describe an image using OpenAI
 */
export async function describeImage(imagePath: string) {
  try {
    const imageBase64 = await imageToBase64(imagePath);

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

    // Save audio file to temp path
    const path = `${RNFS.CachesDirectoryPath}/tts_output.mp3`;
    // Convert arraybuffer -> base64 string
    const base64Audio = Buffer.from(response.data, "binary").toString("base64");

    // Save audio file as base64
    await RNFS.writeFile(path, base64Audio, "base64");

    // Play with react-native-sound
    return new Promise((resolve, reject) => {
      const sound = new Sound(path, "", (err) => {
        if (err) {
          console.error("Error loading TTS audio:", err);
          reject(err);
          return;
        }
        sound.play((success) => {
          if (!success) {
            console.error("Playback failed due to audio decoding errors");
            reject(new Error("Playback failed"));
          } else {
            resolve(path);
          }
          sound.release();
        });
      });
    });
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
