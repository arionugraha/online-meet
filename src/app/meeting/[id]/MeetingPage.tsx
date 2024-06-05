"use client";

import useLoadCall from "@/hooks/useLoadCall";
import useStreamCall from "@/hooks/useStreamCall";
import { useUser } from "@clerk/nextjs";
import {
   Call,
   CallControls,
   SpeakerLayout,
   StreamCall,
   StreamTheme,
   useCall,
   useCallStateHooks,
   useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function MeetingScreen() {
   const { useCallStartsAt, useCallEndedAt } = useCallStateHooks();
   const callStartsAt = useCallStartsAt();
   const callEndedAt = useCallEndedAt();
   const upcomingCall = callStartsAt && new Date(callStartsAt) > new Date();
   const endedCall = !!callEndedAt;

   if (upcomingCall) {
      return <UpcomingMeetingScreen />;
   }

   if (endedCall) {
      return <EndedMeetingScreen />;
   }

   return <div>Current Call</div>;
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
      // return (
      //    <button
      //       onClick={async () => {
      //          const call = client!.call("private-meeting", id);
      //          await call.join();
      //          setCall(call);
      //       }}
      //    >
      //       Join Meeting
      //    </button>
      // );

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
