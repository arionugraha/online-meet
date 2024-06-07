"use client";

import AudioVolumeIndicator from "@/components/AudioVolumeIndicator";
import Button from "@/components/Button";
import PermissionPrompt from "@/components/PermissionPrompt";
import useLoadCall from "@/hooks/useLoadCall";
import useStreamCall from "@/hooks/useStreamCall";
import { useUser } from "@clerk/nextjs";
import {
   Call,
   CallControls,
   DeviceSettings,
   SpeakerLayout,
   StreamCall,
   StreamTheme,
   useCall,
   useCallStateHooks,
   useStreamVideoClient,
   VideoPreview,
} from "@stream-io/video-react-sdk";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SetupUIProps {
   onSetupComplete: () => void;
}

function SetupUI({ onSetupComplete }: SetupUIProps) {
   const call = useStreamCall();
   const { useMicrophoneState, useCameraState } = useCallStateHooks();
   const micState = useMicrophoneState();
   const cameraState = useCameraState();
   const [micCamDisabled, setMicCamDisabled] = useState(false);

   useEffect(() => {
      if (micCamDisabled) {
         call.camera.disable();
         call.microphone.disable();
      } else {
         call.camera.enable();
         call.microphone.enable();
      }
   }, [micCamDisabled, call]);

   if (!micState.hasBrowserPermission || !cameraState.hasBrowserPermission) {
      return <PermissionPrompt />;
   }

   return (
      <div className="flex flex-col items-center gap-3">
         <h1 className="text-center text-2xl font-bold">Setup</h1>
         <VideoPreview />
         <div className="flex h-16 items-center gap-3">
            <AudioVolumeIndicator />
            <DeviceSettings />
         </div>
         <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" checked={micCamDisabled} onChange={(e) => setMicCamDisabled(e.target.checked)} />
            Disable microphone and camera
         </label>
         <Button onClick={onSetupComplete}>Join meeting</Button>
      </div>
   );
}

function UpcomingMeetingScreen() {
   const call = useStreamCall();

   return (
      <div className="flex flex-col items-center gap-6">
         <p>
            This meeting has not started yet. It will start at{" "}
            <span className="font-bold">{call.state.startsAt?.toLocaleString()}</span>
         </p>
         {call.state.custom.description && (
            <p>
               Description: <span className="font-bold">{call.state.custom.description}</span>
            </p>
         )}
         <Link
            href={"/"}
            className="flex items-center justify-center gap-2 rounded-full bg-blue-500 px-3 py-2 font-semibold text-white transition-colors hover:bg-blue-600 active:bg-blue-600 disabled:bg-gray-200"
         >
            Home
         </Link>
      </div>
   );
}

function EndedMeetingScreen() {
   return (
      <div className="flex flex-col items-center gap-6">
         <p className="font-bold">This meeting has ended</p>
         <Link
            href={"/"}
            className="flex items-center justify-center gap-2 rounded-full bg-blue-500 px-3 py-2 font-semibold text-white transition-colors hover:bg-blue-600 active:bg-blue-600 disabled:bg-gray-200"
         >
            Home
         </Link>
      </div>
   );
}

function MeetingScreen() {
   const call = useStreamCall();
   const { useCallStartsAt, useCallEndedAt } = useCallStateHooks();
   const callStartsAt = useCallStartsAt();
   const callEndedAt = useCallEndedAt();
   const [setupComplete, setSetupComplete] = useState(false);

   async function handleSetupComplete() {
      call.join();
      setSetupComplete(true);
   }

   const upcomingCall = callStartsAt && new Date(callStartsAt) > new Date();
   const endedCall = !!callEndedAt;

   if (upcomingCall) {
      return <UpcomingMeetingScreen />;
   }

   if (endedCall) {
      return <EndedMeetingScreen />;
   }

   const description = call.state.custom.description;
   return (
      <div className="space-y-4">
         {description && (
            <p className="text-center">
               Meeting description: <span className="font-bold">{description}</span>
            </p>
         )}
         {setupComplete ? <SpeakerLayout /> : <SetupUI onSetupComplete={handleSetupComplete} />}
      </div>
   );
}

interface MeetingPageProps {
   id: string;
}

export default function MeetingPage({ id }: MeetingPageProps) {
   const { user, isLoaded: userLoaded } = useUser();
   const { call, callLoading } = useLoadCall(id);

   if (!userLoaded || callLoading) {
      return <Loader2 className="mx-auto animate-spin" />;
   }

   if (!call) {
      return <p className="text-center font-bold">Call not found</p>;
   }

   const notAllowedToJoin =
      call.type === "private-meeting" && (!user || !call.state.members.find((m) => m.user.id === user.id));

   if (notAllowedToJoin) {
      return <p className="text-center font-bold">You are not allowed to join this meeting.</p>;
   }

   return (
      <StreamTheme>
         <StreamCall call={call}>
            <MeetingScreen />
         </StreamCall>
      </StreamTheme>
   );
}
