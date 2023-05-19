import { Speechmatics } from "@speechmatics/js-sdk/browser";
import { TranscriptionConfig } from "@speechmatics/js-sdk/dist/browser/types/realtime";
import { useEffect, useState } from "react";

export type UseSpeechmaticsRtParams = {
  setIsConnected?: (val: boolean) => void;
  setTranscript?: (val: string | ((val: string) => string)) => void;
  setPartialTranscript?: (val: string | ((val: string) => string)) => void;
  apiKey?: string;
  jwt?: string;
  config?: TranscriptionConfig;
};

export default function useSpeechmaticsRt({
  apiKey,
  jwt,
  config,
}: UseSpeechmaticsRtParams) {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");

  const [sessionHandlers, setSessionHandlers] =
    useState<Awaited<ReturnType<typeof initialiseSM>>>();

  useEffect(() => {
    initialiseSM(
      setIsConnected,
      setTranscript,
      setPartialTranscript,
      apiKey,
      jwt,
      config,
    ).then(setSessionHandlers);
  }, [apiKey, jwt]);

  return {
    ...sessionHandlers,
    isConnected,
    transcript,
    partialTranscript,
  };
}

async function initialiseSM(
  setIsConnected?: (val: boolean) => void,
  setTranscript?: (val: string | ((val: string) => string)) => void,
  setPartialTranscript?: (val: string | ((val: string) => string)) => void,
  apiKey?: string,
  smJwt?: string,
  jobConfig?: TranscriptionConfig
) {
  const sm = new Speechmatics(apiKey);
  console.log(jobConfig);

  let session = sm.realtime.create(smJwt);

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;

  session.addListener("RecognitionStarted", () => {
    console.log("RecognitionStarted");
    setIsConnected?.(true);
  });

  session.addListener("EndOfTranscript", () => {
    setIsConnected?.(false);
  });

  session.addListener("AddTranscript", (result: any) => {
    console.log("AddTranscript", JSON.stringify(result, null, 2));
    setTranscript?.(
      (transcript) => transcript + " " + result.metadata.transcript
    );
  });

  session.addListener("AddPartialTranscript", (result: any) => {
    console.log("AddPartialTranscript", JSON.stringify(result, null, 2));
    setPartialTranscript?.(result.metadata.transcript + " ");
  });

  const sessionStart = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
      audioBitsPerSecond: 16000,
    });
    session
      ?.start(jobConfig, { type: "file" })
      .then(() => {
        if (!recorder) return Promise.reject("recorder not initialised");

        recorder.start(1000);

        recorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && session?.isConnected()) {
            session?.sendAudio(Buffer.from(await event.data.arrayBuffer()));
          }
        };
      })
      .catch((err: any) => {
        console.error(err);
      });
  };

  const sessionEnd = () => {
    if (recorder) {
      recorder.stop();
      recorder = null;
    }
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    session?.stop();
  };

  return { sessionStart, sessionEnd };
}
