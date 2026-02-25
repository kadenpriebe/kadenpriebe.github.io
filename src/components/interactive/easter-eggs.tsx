'use client';

import { useEffect, useState } from 'react';

export function EasterEggs() {
  const [konamiCode, setKonamiCode] = useState<string[]>([]);
  const target = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newCode = [...konamiCode, e.key];
      if (newCode.length > target.length) {
        newCode.shift();
      }
      setKonamiCode(newCode);

      if (JSON.stringify(newCode) === JSON.stringify(target)) {
        console.log("%c 🎮 KONAMI CODE ACTIVATED! ", "background: #f59e0b; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;");
        console.log("Welcome to the secret side of the site. You're awesome.");
        alert("🎮 Konami Code! You're a true gamer.");
        // We can add more effects later (like a secret mini-game or retro mode)
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiCode]);

  useEffect(() => {
    // Console Easter Egg
    console.log("%c 👋 Hello fellow developer! ", "background: #4f46e5; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;");
    console.log("Interested in how this site was built? Check out the GitHub: github.com/kadenpriebe/personal-website");
  }, []);

  return null; // This component has no visual UI
}
