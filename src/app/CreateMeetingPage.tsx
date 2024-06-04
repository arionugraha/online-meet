"use client";

import { useUser } from "@clerk/nextjs";
import { Call, MemberRequest, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { getUserIds } from "./actions";
import Button from "@/components/Button";
import Link from "next/link";

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

interface ParticipantsInputProps {
   value: string;
   onParticipantsChange: (value: string) => void;
}

function ParticipantsInput({ value, onParticipantsChange }: ParticipantsInputProps) {
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

function getMailToLink(meetingLink: string, startsAt?: Date, description?: string) {
   const startDateFormatted = startsAt
      ? startsAt.toLocaleString("en-US", {
           dateStyle: "full",
           timeStyle: "short",
        })
      : undefined;

   const subject = "Join meeting" + (startDateFormatted ? ` at ${startDateFormatted}` : "");
   const body =
      `Join meeting at ${meetingLink}.` +
      (startDateFormatted ? `\n\nThe meeting starts at ${startDateFormatted}.` : "") +
      (description ? `\n\nDescription: ${description}` : "");

   return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

interface MeetingLinkProps {
   call: Call;
}

function MeetingLink({ call }: MeetingLinkProps) {
   const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`;

   return (
      <div className="flex flex-col items-center gap-3 text-center">
         <div className="flex items-center gap-3">
            <span>
               Invitation Link:{" "}
               <Link href={meetingLink} target="_blank" className="font-medium">
                  {meetingLink}
               </Link>
            </span>
            <button
               title="Copy invitation link"
               onClick={() => {
                  navigator.clipboard.writeText(meetingLink);
                  alert("Copied link to clipboard!");
               }}
            >
               <Copy />
            </button>
         </div>
         <a
            href={getMailToLink(meetingLink, call.state.startsAt, call.state.custom.description)}
            target="_blank"
            className="text-blue-500 hover:underline"
         >
            Send email invitation
         </a>
      </div>
   );
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

         const startsAt = new Date(startTime || Date.now()).toISOString();

         await call.getOrCreate({
            data: {
               custom: {
                  description: description,
               },
               members,
               starts_at: startsAt,
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
            <ParticipantsInput value={participants} onParticipantsChange={setParticipants} />
            <Button onClick={createMeeting} className="w-full">
               Create Meeting
            </Button>
         </div>
         {call && <MeetingLink call={call} />}
      </div>
   );
}
