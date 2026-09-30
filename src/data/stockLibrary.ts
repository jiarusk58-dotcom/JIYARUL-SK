import { StockAsset } from '../types/editor';

export const STOCK_VIDEOS: StockAsset[] = [
  {
    id: 'stock-nature-1',
    name: 'Mountain Sunset Documentary',
    nameBn: 'পাহাড় ও সূর্যাস্ত দৃশ্য',
    type: 'video',
    url: '/src/assets/images/stock_cinematic_nature_1790778182025.jpg',
    thumbnail: '/src/assets/images/stock_cinematic_nature_1790778182025.jpg',
    duration: 6.0,
    category: 'Cinematic'
  },
  {
    id: 'stock-cyber-1',
    name: 'Cyberpunk Neon Street',
    nameBn: 'সাইবারপাঙ্ক নিয়ন শহর',
    type: 'video',
    url: '/src/assets/images/stock_cyber_city_1790778199876.jpg',
    thumbnail: '/src/assets/images/stock_cyber_city_1790778199876.jpg',
    duration: 5.5,
    category: 'Urban & Tech'
  },
  {
    id: 'stock-vlog-1',
    name: 'Cozy Workspace Vlog',
    nameBn: 'ক্লিন স্টুডিও ব্লগ',
    type: 'video',
    url: '/src/assets/images/stock_vlog_lifestyle_1790778214718.jpg',
    thumbnail: '/src/assets/images/stock_vlog_lifestyle_1790778214718.jpg',
    duration: 5.0,
    category: 'Lifestyle'
  },
  {
    id: 'stock-ocean-1',
    name: 'Ocean Wave Action',
    nameBn: 'সমুদ্রের ঢেউ অ্যাকশন',
    type: 'video',
    url: '/src/assets/images/stock_action_ocean_1790778228099.jpg',
    thumbnail: '/src/assets/images/stock_action_ocean_1790778228099.jpg',
    duration: 4.5,
    category: 'Sports & Action'
  },
  // Procedural animated motion clips
  {
    id: 'stock-motion-countdown',
    name: 'Film Countdown 5..1',
    nameBn: 'সিনেমা কাউন্টডাউন ৫..১',
    type: 'video',
    url: 'procedural://countdown',
    thumbnail: '/src/assets/images/stock_cyber_city_1790778199876.jpg',
    duration: 5.0,
    category: 'Motion Graphic'
  },
  {
    id: 'stock-motion-grid',
    name: 'Cyber Horizon 3D Grid',
    nameBn: 'ডিজিটাল হরিজন গ্রিড',
    type: 'video',
    url: 'procedural://cyber-grid',
    thumbnail: '/src/assets/images/stock_cyber_city_1790778199876.jpg',
    duration: 6.0,
    category: 'Motion Graphic'
  },
  {
    id: 'stock-motion-particles',
    name: 'Golden Dust Ambient',
    nameBn: 'গোল্ডেন ডাস্ট পার্টিকেলস',
    type: 'video',
    url: 'procedural://particles',
    thumbnail: '/src/assets/images/stock_cinematic_nature_1790778182025.jpg',
    duration: 5.0,
    category: 'Motion Graphic'
  }
];

export const STOCK_AUDIO: StockAsset[] = [
  // BACKGROUND MUSIC
  {
    id: 'audio-lofi',
    name: 'Lo-Fi Chill Beats',
    nameBn: 'লো-ফাই চিল বিটস',
    type: 'audio',
    url: 'synth://lofi-beat',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-drone',
    name: 'Cinematic Ambient Bass',
    nameBn: 'সিনেমাটিক ড্রোন অ্যাম্বিয়েন্স',
    type: 'audio',
    url: 'synth://cinematic-drone',
    thumbnail: '',
    duration: 10.0,
    category: 'Background Music'
  },
  {
    id: 'audio-cyber',
    name: 'Cyber Synthwave 80s',
    nameBn: 'সাইবার সিন্থওয়েভ মিউজিক',
    type: 'audio',
    url: 'synth://cyber-synth',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-acoustic',
    name: 'Warm Acoustic Guitar',
    nameBn: 'ওয়ার্ম অ্যাকোস্টিক গিটার',
    type: 'audio',
    url: 'synth://acoustic-warm',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-upbeat',
    name: 'Upbeat Vlog Pop Beat',
    nameBn: 'আপবিট ভ্লগ পপ বিট',
    type: 'audio',
    url: 'synth://upbeat-vlog',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-piano',
    name: 'Emotional Piano Ambient',
    nameBn: 'ইমোশনাল পিয়ানো অ্যাম্বিয়েন্ট',
    type: 'audio',
    url: 'synth://ambient-piano',
    thumbnail: '',
    duration: 10.0,
    category: 'Background Music'
  },
  {
    id: 'audio-edm',
    name: 'Gaming EDM Festival Drop',
    nameBn: 'গেমিং ইডিএম ড্রপ',
    type: 'audio',
    url: 'synth://edm-drop',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-dramatic',
    name: 'Dramatic Trailer Sting & Horns',
    nameBn: 'ড্রামাটিক ট্রেলার ব্রাশিং হর্ন',
    type: 'audio',
    url: 'synth://dramatic-sting',
    thumbnail: '',
    duration: 6.0,
    category: 'Background Music'
  },
  {
    id: 'audio-trap',
    name: 'Punchy 808 Trap Beat',
    nameBn: 'পাঞ্চি ৮০৮ ট্র্যাপ বিট',
    type: 'audio',
    url: 'synth://hiphop-trap',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-fanfare',
    name: 'Celebration Fanfare Brass',
    nameBn: 'সেলিব্রেশন ফ্যানফেয়ার ব্রাস',
    type: 'audio',
    url: 'synth://celebration-fanfare',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-chillhop',
    name: 'Chillhop Vinyl Rhodes',
    nameBn: 'চিলহপ ভিনাইল রোডস',
    type: 'audio',
    url: 'synth://chillhop',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-epic',
    name: 'Cinematic Epic Taiko & Brass',
    nameBn: 'সিনেমাটিক এপিক টাইকো ড্রাম',
    type: 'audio',
    url: 'synth://cinematic-epic',
    thumbnail: '',
    duration: 10.0,
    category: 'Background Music'
  },
  {
    id: 'audio-corporate',
    name: 'Corporate Uplifting Marimba',
    nameBn: 'কর্পোরেট ম্যারিম্বা টিউন',
    type: 'audio',
    url: 'synth://corporate-uplifting',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-retro',
    name: 'Retro 80s Neon Wave',
    nameBn: 'রেট্রো আশির দশকের নিয়ন ওয়েভ',
    type: 'audio',
    url: 'synth://retro-synthwave',
    thumbnail: '',
    duration: 8.0,
    category: 'Background Music'
  },
  {
    id: 'audio-bengali-flute',
    name: 'Bengali Bamboo Flute & Tanpura',
    nameBn: 'বাংলার সুর বাঁশি ও তানপুরা',
    type: 'audio',
    url: 'synth://bengali-flute',
    thumbnail: '',
    duration: 10.0,
    category: 'Background Music'
  },
  {
    id: 'audio-rain',
    name: 'Gentle Rain & Calm Ambient',
    nameBn: 'শান্ত বৃষ্টির আবহ সাউন্ড',
    type: 'audio',
    url: 'synth://rain-ambient',
    thumbnail: '',
    duration: 12.0,
    category: 'Background Music'
  },

  // SOUND EFFECTS (SFX)
  {
    id: 'sfx-whoosh',
    name: 'Fast Whoosh Transition',
    nameBn: 'উশ ট্রানজিশন সাউন্ড',
    type: 'audio',
    url: 'synth://whoosh',
    thumbnail: '',
    duration: 1.2,
    category: 'Sound FX'
  },
  {
    id: 'sfx-pop',
    name: 'Clean Bubble Pop',
    nameBn: 'বাবল পপ সাউন্ড',
    type: 'audio',
    url: 'synth://pop',
    thumbnail: '',
    duration: 0.6,
    category: 'Sound FX'
  },
  {
    id: 'sfx-bell',
    name: 'Notification Chime Bell',
    nameBn: 'নোটিফিকেশন বেল',
    type: 'audio',
    url: 'synth://bell',
    thumbnail: '',
    duration: 1.5,
    category: 'Sound FX'
  },
  {
    id: 'sfx-camera',
    name: 'Vintage Camera Click',
    nameBn: 'ক্যামেরা শাটার ক্লিক',
    type: 'audio',
    url: 'synth://camera',
    thumbnail: '',
    duration: 0.8,
    category: 'Sound FX'
  },
  {
    id: 'sfx-glitch',
    name: 'Digital Glitch Zap',
    nameBn: 'ডিজিটাল গ্লিচ সাউন্ড',
    type: 'audio',
    url: 'synth://glitch',
    thumbnail: '',
    duration: 1.0,
    category: 'Sound FX'
  },
  {
    id: 'sfx-laser',
    name: 'Sci-Fi Laser Pew',
    nameBn: 'লেজার বিম শুট',
    type: 'audio',
    url: 'synth://laser',
    thumbnail: '',
    duration: 0.7,
    category: 'Sound FX'
  },
  {
    id: 'sfx-explosion',
    name: 'Cinematic Sub Explosion',
    nameBn: 'সিনেমাটিক এক্সপ্লোশন ধামাকা',
    type: 'audio',
    url: 'synth://explosion',
    thumbnail: '',
    duration: 2.5,
    category: 'Sound FX'
  },
  {
    id: 'sfx-applause',
    name: 'Audience Cheering & Applause',
    nameBn: 'হাততালি ও উল্লাস',
    type: 'audio',
    url: 'synth://applause',
    thumbnail: '',
    duration: 3.5,
    category: 'Sound FX'
  },
  {
    id: 'sfx-keyboard',
    name: 'Mechanical Keyboard Typing',
    nameBn: 'কীবোর্ড টাইপিং সাউন্ড',
    type: 'audio',
    url: 'synth://keyboard',
    thumbnail: '',
    duration: 1.8,
    category: 'Sound FX'
  },
  {
    id: 'sfx-heartbeat',
    name: 'Deep Heartbeat Thump',
    nameBn: 'হার্টবিট স্পন্দন',
    type: 'audio',
    url: 'synth://heartbeat',
    thumbnail: '',
    duration: 2.0,
    category: 'Sound FX'
  },
  {
    id: 'sfx-success',
    name: 'Success Achievement Ding',
    nameBn: 'সফলতা কমপ্লিট ডিং',
    type: 'audio',
    url: 'synth://success-ding',
    thumbnail: '',
    duration: 1.2,
    category: 'Sound FX'
  },
  {
    id: 'sfx-error',
    name: 'Error Alert Buzzer',
    nameBn: 'ভুল অ্যালার্ম বাজার',
    type: 'audio',
    url: 'synth://error-buzz',
    thumbnail: '',
    duration: 0.8,
    category: 'Sound FX'
  },
  {
    id: 'sfx-coin',
    name: 'Retro 8-Bit Game Coin',
    nameBn: 'রেট্রো গেম কয়েন জাম্প',
    type: 'audio',
    url: 'synth://game-coin',
    thumbnail: '',
    duration: 0.8,
    category: 'Sound FX'
  },
  {
    id: 'sfx-riser',
    name: 'Tension Pitch Riser',
    nameBn: 'টেনশন রাইজার সাউন্ড',
    type: 'audio',
    url: 'synth://riser',
    thumbnail: '',
    duration: 3.0,
    category: 'Sound FX'
  }
];

export const TEXT_PRESETS = [
  {
    id: 'preset-headline',
    name: 'Bold Headline',
    nameBn: 'বোল্ড হেডলাইন',
    text: 'CRAFT YOUR STORY',
    textBn: 'আপনার গল্প তৈরি করুন',
    fontSize: 52,
    fontFamily: '"Plus Jakarta Sans", "Hind Siliguri", sans-serif',
    color: '#ffffff',
    backgroundColor: 'transparent',
    borderColor: '#000000',
    borderWidth: 2,
    shadow: true,
    animation: 'pop' as const
  },
  {
    id: 'preset-lower-third',
    name: 'Modern Lower Third',
    nameBn: 'লোয়ার থার্ড বার',
    text: 'SUBSCRIBE FOR MORE',
    textBn: 'লাইক ও সাবস্ক্রাইব করুন',
    fontSize: 32,
    fontFamily: '"Plus Jakarta Sans", "Hind Siliguri", sans-serif',
    color: '#ffffff',
    backgroundColor: '#dc2626',
    borderColor: 'transparent',
    borderWidth: 0,
    shadow: true,
    animation: 'slide' as const
  },
  {
    id: 'preset-subtitle',
    name: 'Clean Subtitle',
    nameBn: 'সাবটাইটেল টেক্সট',
    text: 'Cinematic video editor right in your browser',
    textBn: 'ব্রাউজারেই প্রফেশনাল ভিডিও এডিটিং',
    fontSize: 26,
    fontFamily: '"Plus Jakarta Sans", "Hind Siliguri", sans-serif',
    color: '#fbbf24',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderColor: 'transparent',
    borderWidth: 0,
    shadow: false,
    animation: 'fade' as const
  },
  {
    id: 'preset-cinematic-title',
    name: 'Cinematic Movie Title',
    nameBn: 'মুভি টাইটেল ফ্রন্ট',
    text: 'THE JOURNEY BEGINS',
    textBn: 'রোমাঞ্চকর যাত্রা শুরু',
    fontSize: 48,
    fontFamily: '"Plus Jakarta Sans", "Hind Siliguri", sans-serif',
    color: '#e2e8f0',
    backgroundColor: 'transparent',
    borderColor: '#0f172a',
    borderWidth: 1,
    shadow: true,
    animation: 'fade' as const
  }
];

export const STICKER_PRESETS = [
  { emoji: '🔥', label: 'Fire', category: 'emoji' as const },
  { emoji: '⚡', label: 'Lightning', category: 'emoji' as const },
  { emoji: '✨', label: 'Sparkles', category: 'emoji' as const },
  { emoji: '🎬', label: 'Clapperboard', category: 'emoji' as const },
  { emoji: '🎯', label: 'Target', category: 'emoji' as const },
  { emoji: '🚀', label: 'Rocket', category: 'emoji' as const },
  { emoji: '💖', label: 'Heart', category: 'emoji' as const },
  { emoji: '👍', label: 'Thumbs Up', category: 'emoji' as const },
  { emoji: '🔴', label: 'REC Live', category: 'badge' as const },
  { emoji: '⭐', label: 'Star Top', category: 'badge' as const },
  { emoji: '➡️', label: 'Arrow Right', category: 'arrow' as const },
  { emoji: '⬇️', label: 'Arrow Down', category: 'arrow' as const },
  { emoji: '💥', label: 'Boom', category: 'badge' as const },
  { emoji: '💯', label: '100 Score', category: 'badge' as const }
];
