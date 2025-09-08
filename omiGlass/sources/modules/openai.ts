// openaiClient.ts
import axios, { AxiosRequestConfig } from "axios";
import * as FileSystem from "expo-file-system";
import { createAudioPlayer } from "expo-audio"; // ✅ expo-audio (SDK 53+)
import { keys } from "../keys";

/* =========================================
   0) Small utilities
========================================= */

/** Exponential backoff for transient (429/5xx) errors */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseMs = 600
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      const retriable = status === 429 || (status >= 500 && status < 600);
      if (!retriable || i === attempts - 1) break;
      const jitter = Math.floor(Math.random() * 100);
      const delay = Math.round(baseMs * Math.pow(2, i)) + jitter;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Uint8Array → base64 (no Buffer/btoa needed) */
function uint8ToBase64(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const triple = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out +=
      alphabet[(triple >> 18) & 0x3f] +
      alphabet[(triple >> 12) & 0x3f] +
      alphabet[(triple >> 6) & 0x3f] +
      alphabet[triple & 0x3f];
  }
  if (i < bytes.length) {
    let triple = bytes[i] << 16;
    out += alphabet[(triple >> 18) & 0x3f];
    if (i + 1 < bytes.length) {
      triple |= bytes[i + 1] << 8;
      out += alphabet[(triple >> 12) & 0x3f];
      out += alphabet[(triple >> 6) & 0x3f];
      out += "=";
    } else {
      out += alphabet[(triple >> 12) & 0x3f];
      out += "==";
    }
  }
  return out;
}

/* =========================================
   1) Audio Transcription (multipart)
   - Uses expo-file-system uploadAsync to avoid FormData type issues
========================================= */

export async function transcribeAudio(audioUri: string) {
  try {
    const result = await withRetry(() =>
      FileSystem.uploadAsync(
        "https://api.openai.com/v1/audio/transcriptions",
        audioUri,
        {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file", // form field for the file
          // Extra fields in multipart form:
          parameters: {
            model: "gpt-4o-transcribe", // or "gpt-4o-mini-transcribe"
          },
          headers: {
            Authorization: `Bearer ${keys.openai}`,
          },
        }
      )
    );
    // uploadAsync returns body as string
    return JSON.parse(result.body);
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    return null;
  }
}

/* =========================================
   2) Image → Description (Vision via Chat Completions)
========================================= */

async function imageToBase64(path: string) {
  return await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function describeImage(imagePath: string) {
  try {
    const b64 = await imageToBase64(imagePath);
    const dataUrl = `data:image/jpeg;base64,${b64}`;

    const res = await withRetry(() =>
      axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Describe this image in one concise paragraph.",
                },
                {
                  type: "image_url",
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${keys.openai}`,
            "Content-Type": "application/json",
          },
        }
      )
    );

    return res.data?.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    console.error("Error in describeImage:", error);
    return null;
  }
}

/* =========================================
   3) Text-to-Speech (TTS) + Playback with expo-audio
========================================= */

export async function textToSpeech(text: string) {
  try {
    const res = await withRetry(() =>
      axios.post(
        "https://api.openai.com/v1/audio/speech",
        {
          model: "tts-1", // or "gpt-4o-mini-tts"
          voice: "nova",
          input: text,
          format: "mp3",
        },
        {
          headers: {
            Authorization: `Bearer ${keys.openai}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      )
    );

    const bytes = new Uint8Array(res.data as ArrayBuffer);
    const base64Audio = uint8ToBase64(bytes);
    const path = `${FileSystem.cacheDirectory}tts_output.mp3`;

    await FileSystem.writeAsStringAsync(path, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Play with expo-audio
    const player = createAudioPlayer({ uri: path });
    await player.play();

    return path;
  } catch (error) {
    console.error("Error in textToSpeech:", error);
    return null;
  }
}

/* =========================================
   4) Generic Chat request
========================================= */

export async function gptRequest(systemPrompt: string, userPrompt: string) {
  try {
    const res = await withRetry(() =>
      axios.post(
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
      )
    );

    return res.data;
  } catch (error) {
    console.error("Error in gptRequest:", error);
    return null;
  }
}

/* =========================================
   5) Example usage (toggle on if you want)
========================================= */

// Call this from somewhere in your app to test.
// Keep it opt-in — comment/uncomment as needed.
export async function runDemo() {
  try {
    await textToSpeech("Hello, I am an agent.");

    const answer = await gptRequest(
      "You are a smart AI. Answer concisely.",
      "Where is the person?"
    );
    console.info("Chat response:", answer);

    // Example transcribe call (pass a real file:// URI):
    // const transcript = await transcribeAudio("file:///path/to/audio.m4a");
    // console.info("Transcript:", transcript);

    // Example describe image (pass a real URI from ImagePicker or camera):
    // const desc = await describeImage("file:///path/to/photo.jpg");
    // console.info("Image description:", desc);
  } catch (e) {
    console.error("Demo error:", e);
  }
}
