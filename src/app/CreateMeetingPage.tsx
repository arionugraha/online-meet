"use client";

import { useUser } from "@clerk/nextjs";
import { Call, MemberRequest, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { getUserIds } from "./actions";
import Button from "@/components/Button";

// Meeting Description
interface DescriptionInputProps {
   value: string;
   onDescriptionChange: (value: string) => void;
}

function DescriptionInput({ value, onDescriptionChange }: DescriptionInputProps) {
   const [active, setActive] = useState(false);

   return (
      <div className="space-y-2">
         <div className="font-medium">Meeting Info:</div>
         <label className="flex items-center gap-1.5">
            <input
               type="checkbox"
               checked={active}
               onChange={(e) => {
                  setActive(e.target.checked);
                  onDescriptionChange("");
               }}
            />
            Add Description
         </label>
         {active && (
            <label className="block space-y-1">
               <span className="font-medium">Description</span>
               <textarea
                  value={value}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-md border border-gray-300 p-2"
               />
            </label>
         )}
      </div>
   );
}

// Meeting Time
interface StartTimeInputProps {
   value: string;
   onStartTimeChange: (value: string) => void;
}

function StartTimeInput({ value, onStartTimeChange }: StartTimeInputProps) {
   const [active, setActive] = useState(false);
   const currentLocalDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

   return (
      <div className="space-y-2">
         <div className="font-medium">Meeting Start:</div>
         <label className="flex items-center gap-1.5">
            <input
               type="radio"
               checked={!active}
               onChange={(e) => {
                  setActive(false);
                  onStartTimeChange("");
               }}
            />
            Start Immediately
         </label>
         <label className="flex items-center gap-1.5">
            <input
               type="radio"
               checked={active}
               onChange={(e) => {
                  setActive(true);
                  onStartTimeChange(currentLocalDateTime);
               }}
            />
            Start at a Specific Time
         </label>
         {active && (
            <label className="block space-y-1">
               <span className="font-medium">Start Time</span>
               <input
                  type="datetime-local"
                  value={value}
                  min={currentLocalDateTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
               />
            </label>
         )}
      </div>
   );
}

// Participants
interface ParticipantsInputProps {
   value: string;
   onParticipantsChange: (value: string) => void;
}

function ParticipansInput({ value, onParticipantsChange }: ParticipantsInputProps) {
   const [active, setActive] = useState(false);

   return (
      <div className="space-y-2">
         <div className="font-medium">Participants:</div>
         <label className="flex items-center gap-1.5">
            <input
               type="radio"
               checked={!active}
               onChange={(e) => {
                  setActive(false);
                  onParticipantsChange("");
               }}
            />
            Public Meeting
         </label>
         <label className="flex items-center gap-1.5">
            <input
               type="radio"
               checked={active}
               onChange={(e) => {
                  setActive(true);
                  onParticipantsChange("");
               }}
            />
            Private Meeting
         </label>
         {active && (
            <label className="block space-y-1">
               <span className="font-medium">Participant Emails</span>
               <textarea
                  value={value}
                  onChange={(e) => onParticipantsChange(e.target.value)}
                  placeholder="Enter participant emails"
                  className="w-full rounded-md border border-gray-300 p-2"
               />
            </label>
         )}
      </div>
   );
}

// Meeting Link
interface MeetingLinkProps {
   call: Call;
}

function MeetingLink({ call }: MeetingLinkProps) {
   const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`;

   return <div className="text-center">{meetingLink}</div>;
}

export default function CreateMeetingPage() {
   const { user } = useUser();
   const client = useStreamVideoClient();
   const [description, setDescription] = useState("");
   const [startTime, setStartTime] = useState("");
   const [participants, setParticipants] = useState("");
   const [call, setCall] = useState<Call>();

   if (!user || !client) {
      return <Loader2 className="mx-auto animate-spin" />;
   }

   async function createMeeting() {
      if (!user || !client) return;

      try {
         const callId = crypto.randomUUID();
         const callType = participants ? "private-meeting" : "default";
         const call = client.call(callType, callId);

         const memberEmails = participants.split(",").map((email) => email.trim());
         const memberIds = await getUserIds(memberEmails);
         const members: MemberRequest[] = memberIds
            .map((id) => ({ user_id: id, role: "call_member" }))
            .concat({ user_id: user.id, role: "call_member" })
            .filter((v, i, a) => a.findIndex((t) => t.user_id === v.user_id) === i);

         const starts_at = new Date(startTime || Date.now()).toISOString();

         await call.getOrCreate({
            data: {
               custom: {
                  description: description,
               },
               members,
               starts_at,
            },
         });

         setCall(call);
      } catch (error) {
         console.error(error);
         alert("Failed to create meeting.");
      }
   }

   return (
      <div className="flex flex-col items-center space-y-6">
         <h1 className="text-center text-2xl font-bold">Welcome {user.username}!</h1>
         <div className="mx-auto w-80 space-y-6 rounded-md bg-slate-100 p-5">
            <h2 className="text-xl font-bold">Create a New Meeting</h2>
            <DescriptionInput value={description} onDescriptionChange={setDescription} />
            <StartTimeInput value={startTime} onStartTimeChange={setStartTime} />
            <ParticipansInput value={participants} onParticipantsChange={setParticipants} />
            <Button onClick={createMeeting} className="w-full">
               Create Meeting
            </Button>
         </div>
         {call && <MeetingLink call={call} />}
      </div>
   );
}
