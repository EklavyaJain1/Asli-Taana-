import twilio from 'twilio';

const QUESTIONS = [
  { key: 'full_name', question: "Great! Let's start with your name. What is your full name?", type: 'text' },
  { key: 'mobile_number', question: "What is your phone number?", type: 'text' },
  { key: 'headshot_photo', question: "Now, could you send a clear photo of yourself (a simple selfie or headshot works)? This will appear on your weaver profile.", type: 'photo' },
  { key: 'village_town', question: "Which village or town are you weaving in?", type: 'text' },
  { key: 'district', question: "Which district is that in?", type: 'text' },
  { key: 'state', question: "And which state?", type: 'text' },
  { key: 'pin_code', question: "What's the PIN code of your area?", type: 'text' },
  { key: 'weaving_style', question: "What handloom style or craft do you weave? (e.g. Kanchipuram, Paithani, Banarasi, Chanderi, Jamdani, or your own regional style)", type: 'text' },
  { key: 'years_experience', question: "How many years have you been weaving?", type: 'text' },
  { key: 'Material_Type', question: "What type of material did you use?", type: 'text' },
  { key: 'cooperative_society', question: "Are you part of a weaving cooperative or society? If yes, share its name. If not, type SKIP.", type: 'text' },
  { key: 'product_type', question: "What do you mainly weave? (e.g. saree, dupatta, stole, fabric by the metre)", type: 'text' },
  { key: 'fabric_sample_photo', question: "Now please send one clear photo of a sample of your fabric/product.", type: 'photo' },
  { key: 'bank_upi_id', question: "To receive payments for orders through Asli Taana, please share your UPI ID or bank account number. Type SKIP to add later.", type: 'text' },
  { key: 'id_proof_number', question: "For verification, please share your Aadhaar number or Weaver ID card number, or type SKIP.", type: 'text' },
  { key: 'consent', question: "Last step! Do you agree to let Asli Taana store your details and display your name, photo, craft, and story on your Fabric Identity Card? Reply YES or NO.", type: 'text' },
];

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwKzongGNbk9Y6KHQlQkL71uSEIlTASHSXG_Yirr4ptBFPVskEbyBgeYxq7sVFSJiiOuA/exec';

const sessions = new Map();

function getSession(from) {
  if (!sessions.has(from)) {
    sessions.set(from, { step: 0, data: {} });
  }
  return sessions.get(from);
}

function createTwiML(message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  return twiml.toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { From, Body, MediaUrl0, NumMedia } = req.body;
  const from = From;

  if (!from) {
    return res.status(400).send('Missing From parameter');
  }

  const session = getSession(from);
  const currentQuestion = QUESTIONS[session.step];

  if (!currentQuestion) {
    const twiml = createTwiML('Registration already complete. Thank you!');
    res.set('Content-Type', 'text/xml');
    return res.send(twiml);
  }

  let answer;
  if (currentQuestion.type === 'photo') {
    if (NumMedia && parseInt(NumMedia) > 0 && MediaUrl0) {
      answer = MediaUrl0;
    } else {
      const twiml = createTwiML('Please send a photo to continue.');
      res.set('Content-Type', 'text/xml');
      return res.send(twiml);
    }
  } else {
    answer = Body ? Body.trim() : '';
  }

  session.data[currentQuestion.key] = answer;
  session.step++;

  if (session.step >= QUESTIONS.length) {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session.data),
      });

      let weaverId = 'unknown';
      if (response.ok) {
        const result = await response.json();
        weaverId = result.weaverId || result.id || 'unknown';
      }

      sessions.delete(from);

      const finalMsg = `🎉 Thank you! Your registration is submitted (ID: ${weaverId}). Our team will verify your details soon. Namaste!`;
      const twiml = createTwiML(finalMsg);
      res.set('Content-Type', 'text/xml');
      return res.send(twiml);
    } catch (err) {
      console.error('Google Script submission failed:', err);
      const twiml = createTwiML('Registration completed but submission failed. Please contact support.');
      res.set('Content-Type', 'text/xml');
      return res.send(twiml);
    }
  }

  const nextQuestion = QUESTIONS[session.step];
  const twiml = createTwiML(nextQuestion.question);
  res.set('Content-Type', 'text/xml');
  res.send(twiml);
}