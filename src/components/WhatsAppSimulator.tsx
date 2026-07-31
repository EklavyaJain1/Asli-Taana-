import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, MoreVertical, Paperclip, Camera, Send, CheckCheck, Globe, Mic } from "lucide-react";
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

/**
 * Registration fields the bot collects, in order.
 * Photo fields (headshot_photo, fabric_sample_photo) are handled separately 
 * because they require file upload, not text/voice.
 */
const TEXT_FIELDS = [
  "full_name", "mobile_number", "age", "village_town", "district",
  "state", "pin_code", "weaving_style", "years_experience",
  "material_type", "cooperative_society", "product_type",
  "bank_upi_id", "id_proof_number"
] as const;

/**
 * All bot flow steps including photo and consent steps.
 * The `field` key is used to map answers into weaverData.
 */
const botFlow = [
  { 
    field: "language", 
    en: "Hello! Welcome to Asli Taana, Please chose your language .\nनमस्ते! 'असली ताना' में आपका स्वागत है, कृपया अपनी भाषा चुनें।\n1. English , 2. हिंदी \nOr you can speak in the mic with all the details \nया फिर आप माइक पर सारी जानकारी बोल सकते हैं।", 
    hi: "Hello! Welcome to Asli Taana, Please chose your language .\nनमस्ते! 'असली ताना' में आपका स्वागत है, कृपया अपनी भाषा चुनें।\n1. English , 2. हिंदी \nOr you can speak in the mic with all the details \nया फिर आप माइक पर सारी जानकारी बोल सकते हैं।" 
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
  const [isListening, setIsListening] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [interimText, setInterimText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const accumulatedTranscript = useRef("");

  // Data collected during chat
  const [weaverData, setWeaverData] = useState<any>({});
  const [botLang, setBotLang] = useState<"en" | "hi">("en");

  /**
   * Detect the dominant language of a text string by analysing script
   * (Devanagari vs Latin) and common Hindi keywords.
   * Returns "hi" or "en".
   */
  const detectLanguage = (text: string): "en" | "hi" => {
    const devanagariChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = devanagariChars + latinChars;
    if (totalChars === 0) return botLang; // fallback to current

    // If >30% Devanagari, it's Hindi
    if (devanagariChars / totalChars > 0.3) return "hi";

    // Check for romanised Hindi keywords (Hinglish)
    const hindiKeywords = /\b(mera|naam|hai|hoon|gaon|saal|se|banta|banata|bunai|karta|nahi|haan|ji|aur|ka|ki|ke|kya|yeh|woh|main|meri|humara|kaise|kahan|nahi|accha)\b/i;
    if (hindiKeywords.test(text)) return "hi";

    return "en";
  };

  /**
   * Single-pass Speech Recognition — replaces the old broken dual-pass system.
   *
   * Uses the CURRENT botLang (or en-IN at step 0) so Chrome's recognizer
   * transcribes in the language the user is most likely speaking.
   * After getting the transcript, detectLanguage() checks if they switched
   * languages mid-conversation and auto-updates botLang.
   *
   * continuous = true so the browser keeps listening until the user clicks
   * stop — this fixes the desktop "can't close mic" bug.
   */
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(botLang === "hi" ? "आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता है।" : "Your browser does not support voice input.");
      return;
    }

    // Determine recognition language based on context
    const recLang = step === 0 ? "en-IN" : (botLang === "hi" ? "hi-IN" : "en-IN");

    const recognition = new SpeechRecognition();
    recognition.lang = recLang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // keeps listening until manual stop

    accumulatedTranscript.current = "";

    recognition.onresult = (event: any) => {
      // event.resultIndex is the index of the first CHANGED result in this
      // event. Only results from resultIndex onwards are new — iterating the
      // whole event.results array every time caused final + interim copies of
      // the same phrase to be concatenated ("...eklavya ...eklavya").
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Append only genuinely new final text to the running transcript.
          const chunk = (result[0].transcript || "").trim();
          if (chunk) {
            accumulatedTranscript.current = (accumulatedTranscript.current + " " + chunk).trim();
          }
        }
      }

      // The interim result is the LAST (still-changing) entry, if any.
      let currentInterim = "";
      const last = event.results[event.results.length - 1];
      if (last && !last.isFinal) {
        currentInterim = (last[0].transcript || "").trim();
      }
      setInterimText(currentInterim);
      setInputValue((accumulatedTranscript.current + (currentInterim ? " " + currentInterim : "")).trim());
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.error("Speech recognition error:", e.error);
    };

    recognition.onend = () => {
      // When recognition ends (manual stop or auto-stop), process results
      setIsListening(false);
      setInterimText("");
      const finalText = accumulatedTranscript.current.trim();
      recRef.current = null;

      if (!finalText) {
        setInputValue("");
        return;
      }

      // Detect language from the transcript and auto-switch if needed
      const detectedLang = detectLanguage(finalText);

      if (step === 0) {
        // At step 0, use detection to set initial language
        setBotLang(detectedLang);
      } else if (detectedLang !== botLang) {
        // Mid-conversation language switch detected
        setBotLang(detectedLang);
      }

      setInputValue(finalText);

      if (step === 0 && finalText.split(" ").filter(Boolean).length >= 5) {
        // Long greeting speech → extract all fields at once
        handleVoiceBulkInput(finalText);
      } else {
        // Auto-send the transcript
        setTimeout(() => handleSend(finalText), 350);
      }
    };

    recRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopMic();
      return;
    }
    startListening();
  };

  /**
   * Stop the mic — just stops the single recognition instance.
   * The onend handler will process whatever was captured.
   */
  const stopMic = () => {
    const rec = recRef.current;
    if (rec) {
      try { rec.stop(); } catch { /* noop */ }
    }
    // Don't set isListening false here — onend will do it after processing
  };

  /**
   * Processes a long voice transcript from step 0.
   * Sends it to /api/extract-voice-data, gets back structured fields,
   * auto-detects language, and jumps to the first missing question.
   */
  const handleVoiceBulkInput = async (transcript: string) => {
    // Show the user's speech as a message
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      sender: "user",
      text: transcript
    }]);
    setInputValue("");
    setIsExtracting(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/extract-voice-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript })
      });

      if (!response.ok) throw new Error("Extraction failed");

      const { extracted, detectedLang, fieldsFound } = await response.json();

      // Auto-set language based on what the weaver spoke
      const lang = detectedLang === "hi" ? "hi" : "en";
      setBotLang(lang);

      // Merge extracted data into weaverData
      const newData = { ...weaverData, ...extracted };
      setWeaverData(newData);

      setIsExtracting(false);

      // Build a confirmation message listing what we understood
      const fieldLabels: Record<string, { en: string; hi: string }> = {
        full_name: { en: "Name", hi: "नाम" },
        mobile_number: { en: "Phone", hi: "फ़ोन" },
        age: { en: "Age", hi: "उम्र" },
        village_town: { en: "Village", hi: "गांव" },
        district: { en: "District", hi: "जिला" },
        state: { en: "State", hi: "राज्य" },
        pin_code: { en: "PIN Code", hi: "पिन कोड" },
        weaving_style: { en: "Weaving Style", hi: "बुनाई शैली" },
        years_experience: { en: "Experience", hi: "अनुभव" },
        material_type: { en: "Material", hi: "सामग्री" },
        cooperative_society: { en: "Cooperative", hi: "सहकारी समिति" },
        product_type: { en: "Product", hi: "उत्पाद" },
        bank_upi_id: { en: "UPI/Bank", hi: "UPI/बैंक" },
        id_proof_number: { en: "ID Proof", hi: "पहचान प्रमाण" },
      };

      if (fieldsFound.length > 0) {
        const foundList = fieldsFound
          .map((f: string) => `✅ ${fieldLabels[f]?.[lang] || f}: ${extracted[f]}`)
          .join("\n");

        const confirmMsg = lang === "hi"
          ? `🎙️ मैंने यह समझा:\n\n${foundList}\n\nअब मैं बाकी सवाल पूछता/पूछती हूँ...`
          : `🎙️ I understood the following:\n\n${foundList}\n\nNow I'll ask you the remaining questions...`;
        
        addBotMessage(confirmMsg);

        // Find the first unanswered step and jump to it
        setTimeout(() => {
          jumpToNextMissing(newData, lang);
        }, 1200);
      } else {
        // Couldn't extract anything — fall back to normal flow
        const fallbackMsg = lang === "hi"
          ? "मैं आपकी बात पूरी तरह समझ नहीं पाया। चलिए एक-एक सवाल से शुरू करते हैं।"
          : "I couldn't fully understand. Let's go through the questions one by one.";
        addBotMessage(fallbackMsg);
        setTimeout(() => {
          setStep(1);
          addBotMessage(botFlow[1][lang]);
        }, 1200);
      }
    } catch (err) {
      console.error("Voice extraction error:", err);
      setIsExtracting(false);
      setIsTyping(false);
      // Fallback to normal step-by-step flow
      setBotLang("en");
      setStep(1);
      addBotMessage(botFlow[1].en);
    }
  };

  /**
   * Finds the next bot flow step whose field has NOT yet been filled
   * in weaverData, and jumps directly to it. Skips photo steps that
   * haven't been answered (photos always need manual upload).
   */
  const jumpToNextMissing = (data: any, lang: "en" | "hi") => {
    // Steps 1-16 are data collection, step 17 is consent, step 18 is done
    for (let i = 1; i <= 16; i++) {
      const field = botFlow[i].field;
      if (!data[field]) {
        setStep(i);
        addBotMessage(botFlow[i][lang]);
        return;
      }
    }
    // If all fields are filled, go to consent
    setStep(17);
    addBotMessage(botFlow[17][lang]);
  };

  const scrollToBottom = () => {
    const parent = messagesEndRef.current?.parentElement;
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isValidating]);

  const hasGreeted = useRef(false);

  // Initial greeting — only once
  useEffect(() => {
    if (step === 0 && messages.length === 0 && !hasGreeted.current) {
      hasGreeted.current = true;
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

  const handleSend = async (overrideValue?: string) => {
    const isPhotoStep = step === 4 || step === 14;
    // Accept an explicit value so callers (e.g. voice onend) can send
    // immediately without waiting for React state to flush.
    const value = (overrideValue ?? inputValue).trim();
    if (!value && !isPhotoStep) return;

    const currentField = botFlow[step].field;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: value
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // ── Step 0: Language selection or short text input ──
    if (step === 0) {
      const lower = value.toLowerCase();
      let selectedLang: "en" | "hi" = "en";

      // Detect language from the typed/spoken input
      const hindiChars = (value.match(/[\u0900-\u097F]/g) || []).length;
      const hindiKeywords = /mera|naam|hai|hoon|gaon|saal|hindi|हिंदी/i.test(lower);

      if (lower.includes("2") || lower.includes("hindi") || lower.includes("हिंदी") || hindiChars > 3 || hindiKeywords) {
        selectedLang = "hi";
      }
      setBotLang(selectedLang);

      // Check if the input contains substantial info (more than just "1" or "English")
      if (value.split(" ").length >= 5) {
        // They typed/spoke a lot — treat as bulk voice input
        handleVoiceBulkInput(value);
        return;
      }

      const nextStep = step + 1;
      setStep(nextStep);
      addBotMessage(botFlow[nextStep][selectedLang]);
      return;
    }

    setIsValidating(true);
    setIsTyping(true);

    // Detect language of typed/spoken input for mid-conversation switching
    const detectedLang = detectLanguage(value);
    let activeLang = botLang;
    if (detectedLang !== botLang) {
      setBotLang(detectedLang);
      activeLang = detectedLang;
    }

    const questionText = botFlow[step][activeLang];
    const validation = await validateAnswer(questionText, value);

    setIsValidating(false);

    if (validation.isValid) {
      // Save data
      const newData = { ...weaverData, [currentField]: value };
      setWeaverData(newData);

      // ── Smart skip: find next UNANSWERED step ──
      let nextStep = step + 1;
      while (nextStep < botFlow.length - 1 && newData[botFlow[nextStep].field]) {
        // Skip steps that are already filled (from voice bulk input)
        nextStep++;
      }
      setStep(nextStep);

      if (nextStep < botFlow.length) {
        addBotMessage(botFlow[nextStep][activeLang]);
      }
    } else {
      setIsTyping(false);
      // Ask again
      const errorMsg = activeLang === "hi"
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

  // Handle photo upload
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
        const newData = { ...weaverData, [currentField]: base64 };
        setWeaverData(newData);

        // Smart skip after photo too
        let nextStep = step + 1;
        while (nextStep < botFlow.length - 1 && newData[botFlow[nextStep].field]) {
          nextStep++;
        }
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

          {(isTyping || isValidating || isExtracting) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm w-max">
              <div className="flex gap-1 items-center">
                {isExtracting && <span className="text-xs mr-2 text-stone-500">{botLang === "hi" ? "🎙️ समझ रहा हूँ..." : "🎙️ Understanding..."}</span>}
                {isValidating && !isExtracting && <span className="text-xs mr-2 text-stone-500">{botLang === "hi" ? "जांच हो रही है..." : "Validating..."}</span>}
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
              placeholder={isListening ? (botLang === "hi" ? "🎙️ सुन रहा हूँ..." : "🎙️ Listening...") : isPhotoStep ? (botLang === "en" ? "Upload photo ->" : "फोटो अपलोड करें ->") : (botLang === "en" ? "Message" : "संदेश")}
              className={`w-full min-w-0 flex-1 outline-none text-[15px] bg-transparent ${isListening ? "text-red-600" : ""}`}
              value={inputValue}
              onChange={(e) => !isListening && setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isListening && handleSend()}
              disabled={isPhotoStep || isTyping || isValidating || step === 17 || isExtracting}
              readOnly={isListening}
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
            onClick={isListening ? stopMic : ((!inputValue.trim() && !isPhotoStep) ? handleMicClick : () => handleSend())}
            disabled={isTyping || isValidating || step === 17 || isExtracting}
            className={`w-[46px] h-[46px] rounded-full flex items-center justify-center shadow-sm shrink-0 transition-colors ${
              isListening ? "bg-red-500 text-white animate-pulse" : "bg-[#075e54] text-white"
            }`}
            title={isListening ? "Stop & send" : ((!inputValue.trim() && !isPhotoStep) ? "Voice Input" : "Send")}
          >
            {isListening ? (
              <div className="w-4 h-4 bg-white rounded-sm" /> 
            ) : (!inputValue.trim() && !isPhotoStep) ? (
              <Mic className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5 ml-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
