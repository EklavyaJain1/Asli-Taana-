import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, MoreVertical, Paperclip, Camera, Send, CheckCheck } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface Message {
  id: string;
  sender: "bot" | "user";
  textKey?: string;
  text?: string;
  isPhoto?: boolean;
  photoUrl?: string;
}

interface WhatsAppSimulatorProps {
  onRegister: (sareeData: any) => void;
}

export default function WhatsAppSimulator({ onRegister }: WhatsAppSimulatorProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Data collected during chat
  const [weaverData, setWeaverData] = useState<any>({});

  const scrollToBottom = () => {
    const parent = messagesEndRef.current?.parentElement;
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const botQuestions = [
    { key: "whatsapp.bot.msg1", field: "weaverName" }, // 0
    { key: "whatsapp.bot.msg2", field: "village" },    // 1
    { key: "whatsapp.bot.msg3", field: "cooperative" },// 2
    { key: "whatsapp.bot.msg4", field: "patternType" },// 3
    { key: "whatsapp.bot.msg5", field: "material" },   // 4
    { key: "whatsapp.bot.msg6", field: "price" },      // 5
    { key: "whatsapp.bot.msg7", field: "photo" },      // 6
    { key: "whatsapp.bot.msg8", field: "done" },       // 7
  ];

  // Initial greeting
  useEffect(() => {
    if (step === 0 && messages.length === 0) {
      addBotMessage(botQuestions[0].key);
    }
  }, []);

  const addBotMessage = (textKey: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", textKey }]);
    }, 1000); // Simulate typing delay
  };

  const handleSend = () => {
    if (!inputValue.trim() && step !== 6) return;

    // Add user message
    const currentField = botQuestions[step].field;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    
    // Save data
    setWeaverData((prev: any) => ({ ...prev, [currentField]: inputValue }));

    // Trigger next step
    const nextStep = step + 1;
    setStep(nextStep);
    
    if (nextStep < botQuestions.length) {
      addBotMessage(botQuestions[nextStep].key);
    }
  };
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // When step reaches the end, trigger API call
  useEffect(() => {
    if (step === 7 && !isTyping && !hasSubmitted) {
      setHasSubmitted(true);
      // Chat is finished, submit data
      setTimeout(() => {
        onRegister({
          weaverName: weaverData.weaverName || "Remote Weaver",
          weaverAge: 40,
          weaverBio: "Registered via WhatsApp Bot",
          village: weaverData.village || "Unknown Village",
          cooperative: weaverData.cooperative || "Independent",
          patternType: weaverData.patternType || "Handloom",
          material: weaverData.material || "Cotton/Silk",
          daysOfLabor: 15,
          price: Number(weaverData.price) || 8500,
          colors: ["#22c55e", "#ffffff"],
          referencePhoto: weaverData.photo || "" // Usually a base64
        });
      }, 2000);
    }
  }, [step, isTyping, weaverData, onRegister, hasSubmitted]);
  // Handle mock photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && step === 6) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          sender: "user",
          isPhoto: true,
          photoUrl: base64,
          textKey: "whatsapp.user.reply.photo"
        }]);
        setWeaverData((prev: any) => ({ ...prev, photo: base64 }));
        setStep(7);
        addBotMessage(botQuestions[7].key);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex justify-center my-6">
      <div className="w-full max-w-sm border-[6px] border-black rounded-[3rem] overflow-hidden bg-[#efeae2] shadow-2xl relative h-[650px] flex flex-col font-sans">
        
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>

        {/* WhatsApp Header */}
        <div className="bg-[#075e54] text-white p-4 pt-10 flex items-center gap-3 z-10 shadow-md">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-xl">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[15px]">{t("whatsapp.header.name")}</h3>
            <p className="text-xs text-white/80">{t("whatsapp.header.status")}</p>
          </div>
          <div className="flex gap-4 opacity-80">
            <Video className="w-5 h-5" />
            <Phone className="w-5 h-5" />
            <MoreVertical className="w-5 h-5" />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] pb-24" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'contain' }}>
          <div className="bg-[#e1f3fb] text-[#1a1a1a] text-xs py-1 px-3 rounded-md mx-auto w-max mb-4 shadow-sm">
            Messages and calls are end-to-end encrypted.
          </div>
          
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col max-w-[80%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className={`p-2 px-3 rounded-lg shadow-sm relative ${msg.sender === "user" ? "bg-[#dcf8c6] rounded-tr-none text-black" : "bg-white rounded-tl-none text-black"}`}>
                  {msg.isPhoto ? (
                    <div className="flex flex-col gap-1">
                      <img src={msg.photoUrl} alt="Uploaded" className="w-48 h-48 object-cover rounded-md" />
                      <span className="text-sm">{msg.textKey ? t(msg.textKey) : msg.text}</span>
                    </div>
                  ) : (
                    <span className="text-[14px] leading-snug break-words">
                      {msg.textKey ? t(msg.textKey) : msg.text}
                    </span>
                  )}
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-500">
                      {new Date(parseInt(msg.id)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {msg.sender === "user" && <CheckCheck className="w-3 h-3 text-[#34b7f1]" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm w-max">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-4 left-2 right-2 flex gap-1.5 items-end">
          <div className="flex-1 bg-white rounded-3xl flex items-center px-3 py-2.5 shadow-sm min-w-0">
            <span className="text-xl shrink-0 mr-1.5">😊</span>
            <input 
              type="text" 
              placeholder={t("whatsapp.placeholder")}
              className="w-full min-w-0 flex-1 outline-none text-[15px] bg-transparent"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={step === 6} // Disabled during photo upload step
            />
            
            {step === 6 ? (
              <div className="flex items-center gap-3 ml-2 shrink-0 relative z-50">
                <label htmlFor="bot-attach-file" className="cursor-pointer text-gray-500 hover:text-gray-700 p-1" title="Attach file">
                  <input id="bot-attach-file" type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} />
                  <Paperclip className="w-5 h-5 pointer-events-none" />
                </label>
                <label htmlFor="bot-attach-camera" className="cursor-pointer text-gray-500 hover:text-gray-700 p-1" title="Take photo">
                  <input id="bot-attach-camera" type="file" accept="image/*" capture="environment" className="sr-only" onChange={handlePhotoUpload} />
                  <Camera className="w-5 h-5 pointer-events-none" />
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-2 shrink-0">
                <Paperclip className="w-5 h-5 text-gray-300" />
                <Camera className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() && step !== 6}
            className={`w-[46px] h-[46px] rounded-full flex items-center justify-center shadow-sm shrink-0 transition-colors ${
              (inputValue.trim() || step === 6) ? "bg-[#075e54] text-white" : "bg-[#075e54]/50 text-white"
            }`}
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
