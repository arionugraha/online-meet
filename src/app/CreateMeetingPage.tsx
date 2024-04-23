"use client";

import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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

export default function CreateMeetingPage() {
   const { user } = useUser();
   const client = useStreamVideoClient();
   const [description, setDescription] = useState("");
   const [startTime, setStartTime] = useState("");

   if (!user || !client) {
      return <Loader2 className="mx-auto animate-spin" />;
   }

   return (
      <div className="flex flex-col items-center space-y-6">
         <h1 className="text-center text-2xl font-bold">Welcome {user.username}!</h1>
         <div className="mx-auto w-80 space-y-6 rounded-md bg-slate-100 p-5">
            <h2 className="text-xl font-bold">Create a New Meeting</h2>
            <DescriptionInput value={description} onDescriptionChange={setDescription} />
            <StartTimeInput value={startTime} onStartTimeChange={setStartTime} />
         </div>
      </div>
   );
}
