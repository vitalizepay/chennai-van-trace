import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SOSButton = () => {
  const [isPressed, setIsPressed] = useState(false);

  const handleSOSPress = () => {
    setIsPressed(true);
    
    // Simulate SOS alert
    toast({
      title: "🚨 SOS ALERT SENT",
      description: "Emergency services and school admin have been notified",
      className: "bg-emergency text-emergency-foreground border-emergency",
      duration: 5000,
    });

    // Reset after animation
    setTimeout(() => {
      setIsPressed(false);
    }, 2000);
  };

  return (
    <Button
      onClick={handleSOSPress}
      className={`
        bg-emergency hover:bg-emergency/90 text-emergency-foreground
        h-12 w-12 rounded-full p-0 flex-shrink-0
        transition-all duration-200
        ${isPressed ? 'animate-pulse scale-110' : 'hover:scale-105'}
        shadow-lg border-2 border-emergency-light
      `}
      disabled={isPressed}
    >
      <AlertTriangle className={`h-6 w-6 ${isPressed ? 'animate-bounce' : ''}`} />
    </Button>
  );
};

export default SOSButton;