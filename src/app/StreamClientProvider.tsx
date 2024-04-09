"use client";

import { useUser } from "@clerk/nextjs";
import { StreamVideo, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { getToken } from "./actions";

interface StreamClientProviderProps {
   children: React.ReactNode;
}

export default function StreamClientProvider({ children }: StreamClientProviderProps) {
   const videoClient = useInitializeVideoClient();

   if (!videoClient) {
      return (
         <div className="flex h-screen items-center justify-center">
            <Loader2 className="mx-auto animate-spin" size={60} />
         </div>
      );
   }

   return <StreamVideo client={videoClient}>{children}</StreamVideo>;
}

function useInitializeVideoClient() {
   const { user, isLoaded } = useUser();
   const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

   useEffect(() => {
      if (!isLoaded) return;

      let streamUser: User;

      if (user?.id) {
         streamUser = {
            id: user.id,
            name: user.username || user.id,
            image: user.imageUrl,
         };
      } else {
         const id = nanoid();
         streamUser = {
            id,
            type: "guest",
            name: `Guest ${id}`,
         };
      }

      const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;

      if (!apiKey) {
         throw new Error("Stream API key is required.");
      }

      const client = new StreamVideoClient({
         apiKey,
         user: streamUser,
         tokenProvider: user?.id ? getToken : undefined,
      });

      setVideoClient(client);

      return () => {
         client.disconnectUser();
         setVideoClient(null);
      };
   }, [user?.id, user?.username, user?.imageUrl, isLoaded]);

   return videoClient;
}
