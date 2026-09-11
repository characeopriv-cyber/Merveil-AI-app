/* CATALOG — sectors, templates, occasions */
const RAW_SECTORS = [
  'Hotel','Boutique Hotel','Riad','Resort','Airbnb Host','Bed & Breakfast','Hostel','Glamping','Villa Rental',
  'Travel Agency','Tour Operator','Safari','Cruise','Adventure Travel','Eco Tourism','City Guide',
  'Restaurant','Café','Coffee Roaster','Bakery','Patisserie','Food Truck','Pizzeria','Sushi Bar','Bistro',
  'Catering','Ghost Kitchen','Juice Bar','Tea House','Wine Bar','Brewery','Food Delivery',
  'Fashion Boutique','Sneaker Store','Jewelry','Watch Store','Eyewear','Cosmetics','Perfume','Furniture',
  'Home Decor','Electronics','Phone Store','Pet Shop','Toy Store','Bookstore','Plant Shop','Florist',
  'Dental Clinic','Physiotherapy','Chiropractor','Dermatology','Pediatrics','Mental Health','Yoga Studio',
  'Pilates','Gym','CrossFit','Spa','Massage','Meditation','Nutritionist','Hair Salon','Barbershop','Nail Salon',
  'Real Estate Agency','Property Developer','Mortgage Broker','Property Management','Vacation Rentals',
  'Commercial Real Estate','Architecture Firm','Interior Design','Landscaping',
  'Law Firm','Notary','Accountant','Tax Advisor','Bookkeeping','Consulting','HR Consulting','Recruitment',
  'Marketing Agency','Branding Studio','PR Agency','SEO Agency','Ad Agency','Design Studio','Web Agency',
  'IT Services','Cybersecurity','Data Analytics','Cloud Consulting','Translation Services',
  'Online Course','University','K-12 School','Language School','Coding Bootcamp','Music School','Tutoring',
  'Car Dealership','Auto Repair','Car Wash','Detailing','EV Charging','Rental Cars','Motorcycle Shop',
  'Bank','Fintech Startup','Investment Firm','Wealth Management','Insurance Agency','Crypto Exchange','Lending',
  'SaaS Startup','AI Company','Dev Tools','Design Tools','Productivity App','Marketplace','Social Network',
  'Booking Platform','Analytics Tool','CRM','Helpdesk Software','Project Management',
  'Photography Studio','Videography','Film Production','Podcast Network','Music Label','Event Planning','Wedding Planner',
  'Sports Club','Football Academy','Tennis Club','Golf Course','Ski Resort','Surf School','Martial Arts','Dance Studio',
  'NGO','Charity','Foundation','Museum','Gallery','Theater','Library','Cultural Center',
  'Manufacturing','Logistics','Construction','Engineering','Solar Energy','Agriculture','Farming',
];

export const SECTORS = RAW_SECTORS.map((label, i) => ({
  id: 'sec_' + i,
  label,
  emoji: pickEmoji(label),
}));

function pickEmoji(label) {
  const s = label.toLowerCase();
  if (/(hotel|riad|resort|hostel|bnb)/.test(s)) return '🏨';
  if (/(restaurant|café|coffee|bakery|food|pizz|sushi|bistro)/.test(s)) return '🍽';
  if (/(fashion|sneaker|jewel|watch|eyewear|boutique)/.test(s)) return '🛍';
  if (/(dental|clinic|physio|derma|health|mental|spa|yoga|gym|massage|hair|barber|nail)/.test(s)) return '💆';
  if (/(real estate|mortgage|property|villa|rental)/.test(s)) return '🏡';
  if (/(law|notary|account|tax|consulting|marketing|agency|seo|design|studio|cyber|data|cloud)/.test(s)) return '💼';
  if (/(course|school|university|tutoring|bootcamp|music|art)/.test(s)) return '🎓';
  if (/(car|auto|moto|bike|ev |tire)/.test(s)) return '🚗';
  if (/(bank|fintech|invest|wealth|insurance|crypto|payment|lending)/.test(s)) return '💳';
  if (/(saas|ai |dev tools|productivity|marketplace|social|booking|analytics|crm)/.test(s)) return '⚡';
  if (/(photo|video|film|podcast|music|artist|event|wedding)/.test(s)) return '🎬';
  if (/(sport|football|tennis|golf|ski|surf|martial|dance)/.test(s)) return '⚽';
  if (/(ngo|charity|foundation|museum|gallery|theater|library)/.test(s)) return '🕊';
  if (/(manufact|logistic|construct|engineering|solar|agri|farm)/.test(s)) return '🏭';
  return '✦';
}

export const TEMPLATES = [
  { id:'t_warm_editorial', name:'Warm Editorial', desc:'Story-first, serif, generous space', tier:'free', art:'a' },
  { id:'t_clean_saas',     name:'Clean SaaS',     desc:'Product-first, confident, minimal', tier:'free', art:'b' },
  { id:'t_bold_market',    name:'Bold Market',    desc:'High-contrast, conversion-tuned', tier:'free', art:'d' },
  { id:'t_soft_boutique',  name:'Soft Boutique',  desc:'Pastel, elegant, lifestyle',       tier:'free', art:'c' },
  { id:'t_editorial_pro',  name:'Editorial Pro',  desc:'Magazine-grade typography',         tier:'pro',  art:'a' },
  { id:'t_dark_luxury',    name:'Dark Luxury',    desc:'Deep tones, gold accents',          tier:'pro',  art:'d' },
  { id:'t_brutalist_pro',  name:'Brutalist Pro',  desc:'Type-driven, raw, striking',        tier:'pro',  art:'b' },
  { id:'t_kinetic_pro',    name:'Kinetic Pro',    desc:'Motion-forward hero, video loops',  tier:'pro',  art:'c' },
  { id:'t_atelier_studio', name:'Atelier Studio', desc:'White-label, customizable tokens',  tier:'studio', art:'a' },
  { id:'t_motion_studio',  name:'Motion Studio',  desc:'Full motion system + 3D hero',      tier:'studio', art:'b' },
  { id:'t_cinema_studio',  name:'Cinema Studio',  desc:'Film-grade transitions',            tier:'studio', art:'c' },
];

export const OCCASIONS = [
  'A booking website for a boutique hotel in Marrakech',
  'An AI agent that qualifies real-estate leads from WhatsApp and books viewings',
  'An online store selling handmade Moroccan lamps',
  'A landing page for a dental clinic in Dubai',
  'A 3D game about a desert fox collecting stars',
  'A music track blending Andalusian and lo-fi',
  'A book of 30 short stories for kids',
  'A SaaS dashboard for freelancers to track invoices',
  'A restaurant website with online reservations',
  'A podcast landing page for a business show',
];
