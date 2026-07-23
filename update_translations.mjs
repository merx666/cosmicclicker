import fs from 'fs';
import path from 'path';

const EN_JSON_PATH = 'messages/en.json';

const messages = JSON.parse(fs.readFileSync(EN_JSON_PATH, 'utf-8'));

// Add missing sections and keys to English base
messages.Navigation = {
  ...messages.Navigation,
  seasonPass: "Season Pass",
  newBadge: "NEW"
};

messages.Toasts = {
  megaLucky: "MEGA LUCKY! +{multiplier}x particles!",
  lucky: "Lucky! +{multiplier}x particles!",
  captchaSuccess: "Calibration successful. Block removed!",
  captchaFailed: "Bot activity detected! Click blocked for 15 seconds.",
  adTimeout: "Time's up! Fast clicking detected. Blocked for 15 seconds.",
  adVerified: "Verified! Block removed, you can continue clicking.",
  adClickLimit: "Click limit exceeded! Time: {time}s",
  adBlocked: "Clicking blocked! Click the ad below to unlock.",
  adWarning: "Fast clicking! Click the ad below within 10 seconds to avoid a block."
};

messages.AntiBot = {
  titleBlocked: "Anti-Bot Block",
  titleVerify: "Click Verification (CPS: {cps})",
  blockedDesc: "Clicking blocked for 15s.",
  blockedAction: "Click the ad below to unlock immediately!",
  verifyDesc: "Click the ad before:",
  verifyAction: "to continue playing."
};

messages.Game = {
  ...messages.Game,
  perClick: "Per Click",
  perSecond: "Per Second",
  voidSurge: "Void Surge",
  infinite: "INFINITE",
  energy: "Energy"
};

fs.writeFileSync(EN_JSON_PATH, JSON.stringify(messages, null, 2));

// Fill other languages
const dir = 'messages';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file === 'en.json' || !file.endsWith('.json')) continue;
  const filePath = path.join(dir, file);
  const langMsgs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Merge EN into langMsgs recursively
  const merge = (target, source) => {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        if (target[key] === undefined) {
          target[key] = source[key];
        }
      }
    }
  };
  
  merge(langMsgs, messages);
  fs.writeFileSync(filePath, JSON.stringify(langMsgs, null, 2));
}

console.log('Translations updated and synced based on English.');
