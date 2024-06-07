import { Mic, Webcam } from "lucide-react";

export default function PermissionPrompt() {
   return (
      <div className="flex-cols flex items-center gap-3">
         <div className="flex items-center gap-3">
            <Webcam size={40} />
            <Mic size={40} />
         </div>
         <p className="text-center">Allow access your microphone and camera to join the meeting.</p>
      </div>
   );
}
