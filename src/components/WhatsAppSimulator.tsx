import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, MoreVertical, Paperclip, Camera, Send, CheckCheck, Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface Message {
  id: string;
  sender: "bot" | "user";
  text?: string;
  isPhoto?: boolean;
  photoUrl?: string;
  isError?: boolean;
}

interface WhatsAppSimulatorProps {
  onRegister: (sareeData: any) => void;
}

const botFlow = [
  { 
    field: "language", 
    en: "Welcome to Asli Taana! Please choose your language:\n1. English\n2. Hindi (हिंदी)", 
    hi: "असली ताना में आपका स्वागत है! कृपया अपनी भाषा चुनें:\n1. English\n2. Hindi (हिंदी)" 
  }, // 0
  { 
    field: "full_name", 
    en: "Great! Let's start with your name. What is your full name?", 
    hi: "बहुत बढ़िया! आइए आपके नाम से शुरू करते हैं। आपका पूरा नाम क्या है?" 
  }, // 1
  { 
    field: "mobile_number", 
    en: "What Is Your Phone Number?", 
    hi: "आपका फ़ोन नंबर क्या है?" 
  }, // 2
  { 
    field: "age", 
    en: "What is your age?", 
    hi: "आपकी उम्र क्या है?" 
  }, // 3
  { 
    field: "headshot_photo", 
    en: "Now, could you send a clear photo of yourself (a simple selfie or headshot works)? This will appear on your weaver profile so buyers can see the person behind the craft.", 
    hi: "अब, क्या आप अपनी एक स्पष्ट फोटो भेज सकते हैं? यह आपकी प्रोफ़ाइल पर दिखाई देगा ताकि खरीदार शिल्प के पीछे के व्यक्ति को देख सकें।" 
  }, // 4
  { 
    field: "village_town", 
    en: "Which village or town are you weaving in?", 
    hi: "आप किस गांव या शहर में बुनाई कर रहे हैं?" 
  }, // 5
  { 
    field: "district", 
    en: "Which district is that in?", 
    hi: "यह किस जिले में है?" 
  }, // 6
  { 
    field: "state", 
    en: "And which state?", 
    hi: "और कौन सा राज्य?" 
  }, // 7
  { 
    field: "pin_code", 
    en: "What's the PIN code of your area?", 
    hi: "आपके क्षेत्र का पिन कोड क्या है?" 
  }, // 8
  { 
    field: "weaving_style", 
    en: "What handloom style or craft do you weave? (e.g. Kanchipuram, Paithani, Banarasi, Chanderi, Jamdani, or your own regional style)", 
    hi: "आप किस हथकरघा शैली या शिल्प की बुनाई करते हैं? (जैसे कांचीपुरम, पैठणी, बनारसी, चंदेरी, जामदानी)" 
  }, // 9
  { 
    field: "years_experience", 
    en: "How many years have you been weaving?", 
    hi: "आप कितने वर्षों से बुनाई कर रहे हैं?" 
  }, // 10
  { 
    field: "material_type", 
    en: "What type of Material did you use?", 
    hi: "आपने किस प्रकार की सामग्री का उपयोग किया?" 
  }, // 11
  { 
    field: "cooperative_society", 
    en: "Are you part of a weaving cooperative or society? If yes, share its name. If not, reply NO.", 
    hi: "क्या आप किसी बुनाई सहकारी समिति या समाज का हिस्सा हैं? यदि हां, तो उसका नाम साझा करें। यदि नहीं, तो 'नहीं' उत्तर दें।" 
  }, // 12
  { 
    field: "product_type", 
    en: "What do you mainly weave? (e.g. saree, dupatta, stole, fabric by the metre)", 
    hi: "आप मुख्य रूप से क्या बुनते हैं? (जैसे साड़ी, दुपट्टा, स्टोल, मीटर के हिसाब से कपड़ा)" 
  }, // 13
  { 
    field: "fabric_sample_photo", 
    en: "Now please send one clear photo of a sample of your fabric/product — this helps us verify your craft and build your Fabric Identity Card.", 
    hi: "अब कृपया अपने कपड़े/उत्पाद के एक नमूने की एक स्पष्ट फोटो भेजें — इससे हमें आपके शिल्प को सत्यापित करने और आपका फैब्रिक पहचान पत्र बनाने में मदद मिलती है।" 
  }, // 14
  { 
    field: "bank_upi_id", 
    en: "To receive payments for orders through Asli Taana, please share your UPI ID or bank account number.", 
    hi: "Asli Taana के माध्यम से ऑर्डर के भुगतान प्राप्त करने के लिए, कृपया अपनी UPI ID या बैंक खाता संख्या साझा करें।" 
  }, // 15
  { 
    field: "id_proof_number", 
    en: "For verification, please share your Aadhaar number or Weaver ID card number. This is kept private and only used to confirm your identity.", 
    hi: "सत्यापन के लिए, कृपया अपना आधार नंबर या बुनकर आईडी कार्ड नंबर साझा करें। इसे निजी रखा जाता है।" 
  }, // 16
  { 
    field: "consent", 
    en: "Last step! Do you agree to let Asli Taana store your details and display your name, photo, craft, and story (not your private ID/payment info) on your product's digital Fabric Identity Card? Reply YES or NO.", 
    hi: "अंतिम चरण! क्या आप Asli Taana को अपना विवरण संग्रहीत करने और प्रदर्शित करने की अनुमति देने के लिए सहमत हैं? हाँ या ना में उत्तर दें।" 
  }, // 17
  { 
    field: "done", 
    en: "🎉 Thank you! Your registration is submitted. Our team will verify your details and assign your unique QR Tag ID.", 
    hi: "🎉 धन्यवाद! आपका पंजीकरण जमा हो गया है। हमारी टीम आपके विवरण को सत्यापित करेगी।" 
  } // 18
];

export default function WhatsAppSimulator({ onRegister }: WhatsAppSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Data collected during chat
  const [weaverData, setWeaverData] = useState<any>({});
  const [botLang, setBotLang] = useState<"en" | "hi">("en");

  const scrollToBottom = () => {
    const parent = messagesEndRef.current?.parentElement;
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isValidating]);

  // Initial greeting
  useEffect(() => {
    if (step === 0 && messages.length === 0) {
      addBotMessage(botFlow[0].en);
    }
  }, []);

  const addBotMessage = (text: string, isError = false) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text, isError }]);
    }, 800);
  };

  const validateAnswer = async (question: string, answer: string): Promise<{isValid: boolean, reason: string}> => {
    try {
      const response = await fetch("/api/validate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback if API fails
    return { isValid: answer.trim().length > 1, reason: "Please provide a valid answer." };
  };

  const handleSend = async () => {
    const isPhotoStep = step === 4 || step === 14;
    if (!inputValue.trim() && !isPhotoStep) return;

    const currentField = botFlow[step].field;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    
    // Process Language Step Specially
    if (step === 0) {
      const lower = inputValue.toLowerCase();
      let selectedLang: "en" | "hi" = "en";
      if (lower.includes("2") || lower.includes("hi") || lower.includes("hindi") || lower.includes("हिंदी")) {
        selectedLang = "hi";
        setBotLang("hi");
      } else {
        selectedLang = "en";
        setBotLang("en");
      }
      const nextStep = step + 1;
      setStep(nextStep);
      addBotMessage(botFlow[nextStep][selectedLang]);
      return;
    }

    setIsValidating(true);
    setIsTyping(true);

    const questionText = botFlow[step][botLang];
    const validation = await validateAnswer(questionText, inputValue);

    setIsValidating(false);

    if (validation.isValid) {
      // Save data
      setWeaverData((prev: any) => ({ ...prev, [currentField]: inputValue }));

      // Trigger next step
      const nextStep = step + 1;
      setStep(nextStep);
      
      if (nextStep < botFlow.length) {
        addBotMessage(botFlow[nextStep][botLang]);
      }
    } else {
      setIsTyping(false);
      // Ask again
      const errorMsg = botLang === "hi" 
        ? `क्षमा करें, यह सही नहीं लग रहा है। (${validation.reason || "कृपया सही उत्तर दें"}) कृपया पुनः प्रयास करें।`
        : `Sorry, that doesn't seem right. (${validation.reason || "Please provide a valid answer."}) Please try again.`;
      
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text: errorMsg, isError: true }]);
    }
  };

  const [hasSubmitted, setHasSubmitted] = useState(false);

  // When step reaches the end, trigger API call
  useEffect(() => {
    if (step === 18 && !isTyping && !hasSubmitted) {
      setHasSubmitted(true);
      setTimeout(() => {
        onRegister({
          weaverName: weaverData.full_name || "Remote Weaver",
          weaverAge: Number(weaverData.age) || 40,
          weaverBio: `Registered via WhatsApp. Mobile: ${weaverData.mobile_number}. Age: ${weaverData.age}. Exp: ${weaverData.years_experience} years.`,
          village: weaverData.village_town || "Unknown Village",
          cooperative: weaverData.cooperative_society || "Independent",
          patternType: weaverData.weaving_style || "Handloom",
          material: weaverData.material_type || "Cotton/Silk",
          daysOfLabor: 15,
          price: 8500,
          colors: ["#22c55e", "#ffffff"],
          weaverPhoto: weaverData.headshot_photo || "",
          referencePhoto: weaverData.fabric_sample_photo || "",
          mobile_number: weaverData.mobile_number || "",
          district: weaverData.district || "",
          state: weaverData.state || "",
          pin_code: weaverData.pin_code || "",
          years_experience: weaverData.years_experience || "0",
          product_type: weaverData.product_type || "",
          bank_upi_id: weaverData.bank_upi_id || "",
          id_proof_number: weaverData.id_proof_number || "",
          consent: weaverData.consent || "YES"
        });
      }, 2000);
    }
  }, [step, isTyping, weaverData, onRegister, hasSubmitted]);

  // Handle mock photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
const isPhotoStep = step === 4 || step === 14;
    
    if (file && isPhotoStep) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          sender: "user",
          isPhoto: true,
          photoUrl: base64,
          text: botLang === "en" ? "[Photo Uploaded]" : "[फोटो अपलोड की गई]"
        }]);
        
        const currentField = botFlow[step].field;
        setWeaverData((prev: any) => ({ ...prev, [currentField]: base64 }));
        
        const nextStep = step + 1;
        setStep(nextStep);
        addBotMessage(botFlow[nextStep][botLang]);
      };
      reader.readAsDataURL(file);
    }
  };

  const isPhotoStep = step === 4 || step === 14;

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
            <h3 className="font-semibold text-[15px]">Asli Taana Assistant</h3>
            <p className="text-xs text-white/80">Online</p>
          </div>
          <div className="flex gap-4 opacity-80">
            <Video className="w-5 h-5" />
            <Phone className="w-5 h-5" />
            <MoreVertical className="w-5 h-5" />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] pb-24" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'contain' }}>
          <div className="bg-[#e1f3fb] text-[#1a1a1a] text-xs py-1 px-3 rounded-md mx-auto w-max mb-4 shadow-sm text-center max-w-[80%]">
            Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
          </div>
          
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className={`p-2 px-3 rounded-lg shadow-sm relative ${msg.sender === "user" ? "bg-[#dcf8c6] rounded-tr-none text-black" : (msg.isError ? "bg-red-50 text-red-800 rounded-tl-none border border-red-200" : "bg-white rounded-tl-none text-black")}`}>
                  {msg.isPhoto ? (
                    <div className="flex flex-col gap-1">
                      <img src={msg.photoUrl} alt="Uploaded" className="w-48 h-48 object-cover rounded-md" />
                      <span className="text-sm opacity-60 italic">{msg.text}</span>
                    </div>
                  ) : (
                    <span className="text-[14px] leading-snug break-words whitespace-pre-wrap">
                      {msg.text}
                    </span>
                  )}
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] opacity-50">
                      {new Date(parseInt(msg.id)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {msg.sender === "user" && <CheckCheck className="w-3 h-3 text-[#34b7f1]" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {(isTyping || isValidating) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm w-max">
              <div className="flex gap-1 items-center">
                {isValidating && <span className="text-xs mr-2 text-stone-500">{botLang === "hi" ? "जांच हो रही है..." : "Validating..."}</span>}
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
            {step === 0 ? <Globe className="text-stone-400 w-5 h-5 mr-2" /> : <span className="text-xl shrink-0 mr-1.5">😊</span>}
            
            <input 
              type="text" 
              placeholder={isPhotoStep ? (botLang === "en" ? "Upload photo ->" : "फोटो अपलोड करें ->") : (botLang === "en" ? "Message" : "संदेश")}
              className="w-full min-w-0 flex-1 outline-none text-[15px] bg-transparent"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isPhotoStep || isTyping || isValidating || step === 17}
            />
            
            {isPhotoStep ? (
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
              <div className="flex items-center gap-3 ml-2 shrink-0 opacity-50">
                <Paperclip className="w-5 h-5 text-gray-300" />
                <Camera className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSend}
            disabled={(!inputValue.trim() && !isPhotoStep) || isTyping || isValidating || step === 17}
            className={`w-[46px] h-[46px] rounded-full flex items-center justify-center shadow-sm shrink-0 transition-colors ${
              (inputValue.trim() && !isPhotoStep && !isTyping && !isValidating && step !== 17) ? "bg-[#075e54] text-white" : "bg-[#075e54]/50 text-white"
            }`}
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
