window.NileTrailsCMS = (() => {
  'use strict';

  const STORAGE_KEY = 'niletrails_atelier_cms_v3';
  const A = 'assets/';
  const V = 'assets/videos/';
  const IMG = {
    sailing: A + 'nile-sailing.webp',
    temple: A + 'egypt-temple.webp',
    cruise: A + 'nile-cruise.webp'
  };

  const VIDEOS = {
    main: V + 'hero-main.mp4',
    cruise1: V + 'hero-cruise-1.mp4',
    cruise2: V + 'hero-cruise-2.mp4',
    cruise3: V + 'hero-cruise-3.mp4',
    dahabiya1: V + 'hero-dahabiya-1.mp4',
    dahabiya2: V + 'hero-dahabiya-2.mp4',
    youtubeUrl: 'https://www.youtube.com/watch?v=otvczRRDdRI'
  };

  const DEFAULT_FACILITIES = [
    'Large panoramic / ultra-violet river-view windows',
    'Private en-suite bath with bathtub, shower & hair dryer',
    'All cabins air-conditioned with individual climate controls',
    'Swimming pool, Jacuzzi & expansive sun deck with lounge bar',
    'Full-board fine dining restaurant (Egyptian & international cuisine)',
    'Certified English & multilingual Egyptologist tour guide onboard',
    'Complimentary high-speed Wi-Fi & internet access in public areas',
    'Panoramic lounge bar, reading library & evening dance floor',
    'Spa, massage treatment suite & fitness gym room',
    'Mini-bar, personal electronic safe box & 24-hour room service',
    'Colored LCD TV with satellite, movie & music channels',
    'Doctor on call 24/7 & express onboard laundry service',
    'Non-smoking cabins & UV-treated water filtration system',
    'Evening Nubian folkloric show & traditional Egyptian Galabeya party'
  ];

  // 15 Main Places to Visit During a Nile Cruise (Sightseeing with Tour Guide & "Beyond the Nile -> Nubian and the Nile")
  const DEFAULT_SIGHTSEEING_PLACES = [
    {
      id: 'sight-karnak-luxor',
      slug: 'karnak-and-luxor-temples',
      location: 'Luxor – East Bank',
      title: 'Karnak Temple and Luxor Temple',
      highlights: 'Monumental temples, giant columns, and ancient Egyptian history.',
      shortDesc: 'Monumental temples, giant columns, and ancient Egyptian history along the sacred Avenue of Sphinxes.',
      fullOverview: 'Walk through 2,000 years of Pharaonic devotion on the East Bank of Luxor (ancient Thebes). Accompanied by your private licensed Egyptologist, explore the vast Temple of Karnak—home to the breathtaking Great Hypostyle Hall of 134 towering sandstone columns, the Sacred Lake, and the obelisks of Queen Hatshepsut—before following the three-kilometer Avenue of Sphinxes to the gracefully proportioned Luxor Temple on the Nile corniche.',
      itinerarySteps: [
        'Private pickup from your Nile cruise dock or hotel in Luxor in an air-conditioned vehicle.',
        'Guided exploration of the Precinct of Amun-Ra at Karnak Temple, the Great Hypostyle Hall, and the Festival Temple of Thutmose III.',
        'Photo stop along the newly restored Avenue of Sphinxes connecting Karnak and Luxor Temples.',
        'Visit to Luxor Temple, including the colossi of Ramesses II, the Court of Amenhotep III, and the Abu Haggag Mosque.',
        'Return transfer to your cruise vessel with bottled mineral water included.'
      ],
      duration: '3.5 – 4 Hours',
      guideIncluded: 'Private Licensed Egyptologist Guide + Entry Tickets + Transfers',
      price: 65,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-dandara-abydos',
      slug: 'dandara-and-abydos-temples',
      location: 'Luxor – North',
      title: 'Dandara & Abydos Temple',
      highlights: 'Sacred Temple of Hathor in Dendera with its vivid astronomical ceiling and the masterpiece reliefs of Seti I at Abydos.',
      shortDesc: 'Discover the vivid turquoise astronomical ceiling of Dendera and the finest carved reliefs in Egypt at Abydos.',
      fullOverview: 'Venture north of Luxor with your private Egyptologist to two of Upper Egypt’s most awe-inspiring and best-preserved sanctuaries. At Abydos, the sacred cult center of the god Osiris, marvel at the Temple of Seti I—famous for its raised relief carvings that retain their original New Kingdom pigments and the renowned Abydos King List. Continue to Dendera to enter the Greco-Roman Temple of Hathor, where cleaned ceilings reveal vibrant turquoise zodiac constellations, sacred crypts, and rooftop shrines.',
      itinerarySteps: [
        'Morning departure from your Luxor cruise dock or hotel in a private modern air-conditioned vehicle.',
        'Guided visit to the Temple of Seti I at Abydos, exploring the Seven Sacred Chapels, the Osireion, and the Hall of the King List.',
        'Scenic drive along the agricultural Nile valley to Qena / Dendera.',
        'Guided tour of the Temple of Hathor at Dendera, including the vibrant astronomical ceiling, crypts, and panoramic temple roof.',
        'Return transfer to your Nile cruise in Luxor.'
      ],
      duration: 'Full Day (7 – 8 Hours)',
      guideIncluded: 'Private Egyptologist Guide + Private Vehicle + All Entry Tickets',
      price: 120,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-valley-of-kings',
      slug: 'valley-of-the-kings',
      location: 'Luxor – West Bank',
      title: 'Valley of the Kings',
      highlights: 'Royal tombs, including the optional tomb of Tutankhamun.',
      shortDesc: 'Royal tombs carved deep into the Theban peaks, including the optional tomb of King Tutankhamun.',
      fullOverview: 'Cross to the West Bank of the Nile to enter the royal necropolis of the New Kingdom pharaohs (18th to 20th Dynasties). Beneath the natural pyramid of Al-Qurn mountain lie over 60 rock-cut tombs adorned with luminous scenes from the Book of the Dead, the Amduat, and the Book of Gates. Your private Egyptologist will explain the royal funerary rituals before you descend into three monumental royal tombs, with the option to enter the famous Tomb of Tutankhamun (KV62) and Seti I (KV17).',
      itinerarySteps: [
        'Morning pickup from your Nile cruise and crossing to Luxor’s West Bank.',
        'Electric Taftaf train ride to the entrance of the Royal Valley.',
        'In-depth explanation by your private Egyptologist at the architectural scale model.',
        'Guided entry to 3 vivid royal tombs + optional entry to the Tomb of King Tutankhamun.',
        'Return transfer to your vessel in time for lunch.'
      ],
      duration: '3 Hours',
      guideIncluded: 'Private Egyptologist Guide + Valley Ticket (3 Tombs) + Transfers',
      price: 75,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1572252821143-035a024857ac?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-hatshepsut',
      slug: 'temple-of-hatshepsut',
      location: 'Luxor – West Bank',
      title: 'Temple of Hatshepsut',
      highlights: 'A spectacular terraced temple built into the cliffs.',
      shortDesc: 'A spectacular terraced mortuary temple built directly into the golden limestone cliffs of Deir el-Bahari.',
      fullOverview: 'Rising in three colonnaded terraces against the sheer limestone cliffs of Deir el-Bahari, the Mortuary Temple of Queen Hatshepsut (Djeser-Djeseru, "Holy of Holies") is a masterpiece of ancient classical architecture designed by royal architect Senenmut. With your private Egyptologist, examine the finely carved reliefs chronicling the Queen’s divine birth, the transportation of twin obelisks from Aswan, and her legendary maritime trading expedition to the Land of Punt.',
      itinerarySteps: [
        'Private transfer to the amphitheater cliffs of Deir el-Bahari on Luxor’s West Bank.',
        'Walk up the monumental ramps and colonnades with your Egyptologist.',
        'Explore the Punt Colonnade, the Birth Colonnade, the Chapel of Hathor (with cow-headed capitals), and the Chapel of Anubis.',
        'Panoramic photography time overlooking the Theban plain and the Nile valley.'
      ],
      duration: '2 Hours',
      guideIncluded: 'Private Egyptologist Guide + Entry Ticket + Private A/C Transfer',
      price: 50,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-valley-of-queens',
      slug: 'valley-of-the-queens',
      location: 'Luxor – West Bank',
      title: 'Valley of Queens',
      highlights: 'Sacred necropolis of royal wives, princesses and princes, known in ancient times as Ta-Set-Neferu ("The Place of Beauty").',
      shortDesc: 'Explore the royal necropolis of New Kingdom queens and princes, including the optional Tomb of Queen Nefertari.',
      fullOverview: 'Known to the ancient Egyptians as Ta-Set-Neferu ("The Place of Beauty"), the Valley of the Queens at the southern tip of the Theban hillside holds over 90 tombs belonging to royal wives, princesses, and young princes of the 19th and 20th Dynasties. Your Egyptologist guides you through the vividly painted tombs of Prince Amun-her-khepeshef, Queen Titi, and Prince Khaemwaset, with optional VIP arrangements for the legendary Tomb of Queen Nefertari (beloved wife of Ramesses II).',
      itinerarySteps: [
        'Private A/C transfer from your Nile cruise to the southern Theban hills.',
        'Guided visit to 3 richly painted royal tombs in the Valley of the Queens.',
        'Detailed explanation of royal iconography, protective deities, and color preservation.',
        'Optional add-on arrangement for the Tomb of Queen Nefertari (subject to antiquities availability).'
      ],
      duration: '2 Hours',
      guideIncluded: 'Private Egyptologist Guide + Entry Tickets + Transfers',
      price: 55,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-medinet-habu',
      slug: 'medinet-habu',
      location: 'Luxor – West Bank',
      title: 'Medinet Habu',
      highlights: 'An impressive temple complex on Luxor\'s West Bank.',
      shortDesc: 'An impressive fortified temple complex of Pharaoh Ramesses III with deeply carved reliefs and original paint.',
      fullOverview: 'Often described by Egyptologists as the hidden gem of Luxor’s West Bank, Medinet Habu is the vast mortuary temple complex of Pharaoh Ramesses III (20th Dynasty). Enclosed within a towering mudbrick fortified gate (the Syrian Migdol), its massive sandstone pylons and peristyle courts boast the deepest relief carvings in Egypt—up to six inches deep—along with remarkably intact original blue, gold, and ochre ceiling paint depicting the defeat of the Sea Peoples.',
      itinerarySteps: [
        'Private transfer to the quiet southern edge of the West Bank necropolis.',
        'Enter through the monumental Royal Fortified Gate (Migdol) of Ramesses III.',
        'Explore the First and Second Courts with your Egyptologist, admiring intact painted ceilings and dramatic naval battle scenes.',
        'Visit the adjacent Royal Palace ruins and Sacred Lake before returning to your cruise.'
      ],
      duration: '2 Hours',
      guideIncluded: 'Private Egyptologist Guide + Entry Ticket + Private Transfer',
      price: 45,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1544945582-3b466d874eac?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-colossi-memnon',
      slug: 'colossi-of-memnon',
      location: 'Luxor – West Bank',
      title: 'Colossi of Memnon',
      highlights: 'Two enormous statues of Pharaoh Amenhotep III.',
      shortDesc: 'Two enormous 18-meter quartzite statues of Pharaoh Amenhotep III guarding the entrance to the West Bank.',
      fullOverview: 'Standing sentinel over the green Theban plains for 3,400 years, the Colossi of Memnon are two twin 720-ton statues of Pharaoh Amenhotep III carved from single blocks of quartzite sandstone quarried near Cairo. In Greco-Roman times, the northern statue became legendary for emitting a musical "singing" sound at dawn, attracting Roman emperors who left Latin and Greek inscriptions on its legs. Your Egyptologist will also show you the ongoing excavations of Amenhotep III’s massive mortuary temple behind them.',
      itinerarySteps: [
        'Private stop at the entrance plain of the Theban Necropolis.',
        'Up-close guided viewing of the 18-meter twin colossi, Queen Tiye and Queen Mutemwiya statues, and Greco-Roman inscriptions.',
        'View the newly raised alabaster and quartzite stelae of Amenhotep III’s Mortuary Temple.'
      ],
      duration: '1 Hour',
      guideIncluded: 'Private Egyptologist Guide + Private Vehicle Stop',
      price: 30,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-esna-khnum',
      slug: 'temple-of-khnum-esna',
      location: 'Esna',
      title: 'Temple of Khnum',
      highlights: 'A temple known for its beautifully decorated ceiling; included on some itineraries.',
      shortDesc: 'A sunken Ptolemaic-Roman temple famous for its newly restored, vibrantly painted astronomical ceiling.',
      fullOverview: 'Situated nine meters below the street level of modern Esna—just steps from the famous Esna River Lock—the Temple of Khnum is dedicated to the ram-headed creator god who fashioned humankind on his potter’s wheel. Following a landmark multi-year conservation project, the 24 lotus-and-palm columns and the ceiling of its grand Hypostyle Hall now blaze with their original 2,000-year-old reds, yellows, and turquoise blues depicting ancient Egyptian zodiac signs and sacred constellations.',
      itinerarySteps: [
        'Walk from your moored cruise vessel or dahabiya at Esna through the traditional market street.',
        'Descend the ceremonial staircase into the sunken courtyard of the Temple of Khnum.',
        'Guided tour with your Egyptologist of the newly restored polychrome ceiling, Roman imperial cartouches, and creation texts.',
        'Optional stroll through the historic Wakalat al-Geddawi caravanserai and weavers’ quarter.'
      ],
      duration: '1.5 Hours',
      guideIncluded: 'Private Egyptologist Guide + Esna Temple Entry Ticket',
      price: 45,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-edfu-horus',
      slug: 'temple-of-horus-edfu',
      location: 'Edfu',
      title: 'Temple of Horus',
      highlights: 'One of Egypt\'s best-preserved ancient temples.',
      shortDesc: 'One of Egypt’s best-preserved ancient temples, dedicated to the falcon god Horus with towering pylons.',
      fullOverview: 'Buried beneath desert sand and river silt for centuries, the Ptolemaic Temple of Horus at Edfu (built between 237 and 57 BC) is the most completely preserved temple in all of Egypt. Passing between its 36-meter-high entrance pylons guarded by black granite falcons of Horus, you step into a world where ancient roofs, corridors, perfume laboratories, and the granite Naos (Sanctuary of the Sacred Bark) remain completely intact.',
      itinerarySteps: [
        'Transfer from the Edfu river corniche to the temple plaza by private vehicle or traditional carriage.',
        'Admire the monumental First Pylon depicting Ptolemy XII smiting his foes before Horus and Hathor.',
        'Walk through the Court of Offerings, the two Hypostyle Halls, the ancient Perfume Laboratory, and the Holy of Holies.',
        'View the famous reliefs of the Sacred Drama—the mythical battle between Horus and Seth—with your Egyptologist.'
      ],
      duration: '2.5 Hours',
      guideIncluded: 'Private Egyptologist Guide + Entry Ticket + Local Transfer',
      price: 55,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1572252821143-035a024857ac?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-kom-ombo',
      slug: 'temple-of-kom-ombo',
      location: 'Kom Ombo',
      title: 'Temple of Kom Ombo',
      highlights: 'A unique double temple dedicated to Sobek and Horus, with a crocodile museum.',
      shortDesc: 'A unique symmetrical double temple overlooking the Nile, dedicated to Sobek and Horus, with a Crocodile Museum.',
      fullOverview: 'Dramatically perched on a promontory overlooking a sweeping bend of the Nile, the Temple of Kom Ombo is unique in Egypt for its perfectly symmetrical double design: the southern half is dedicated to Sobek, the crocodile god of fertility and creator of the world, while the northern half honors Haroeris (Horus the Elder), the falcon-headed sky god. Your guided visit includes the famous carved relief of ancient surgical and medical instruments, the sacred nilometer, and the adjacent Crocodile Museum displaying mummified Nile crocodiles.',
      itinerarySteps: [
        'Walk directly from the Kom Ombo river dock up to the riverside temple terrace.',
        'Explore the twin entrances, double hypostyle halls, and twin sanctuaries of Sobek and Haroeris.',
        'Examine the ancient Egyptian calendar, Cleopatra VII reliefs, and the famous Roman-era medical instruments carving.',
        'Visit the air-conditioned Crocodile Museum at the exit before returning to your ship.'
      ],
      duration: '2 Hours',
      guideIncluded: 'Private Egyptologist Guide + Temple & Crocodile Museum Ticket',
      price: 50,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-philae-temple',
      slug: 'philae-temple-aswan',
      location: 'Aswan',
      title: 'Philae Temple',
      highlights: 'A beautiful island temple dedicated to the goddess Isis.',
      shortDesc: 'A romantic island sanctuary dedicated to the goddess Isis, reached by private motorboat across the Nile.',
      fullOverview: 'Known as the "Pearl of Egypt," the Temple of Philae rises from the granite waters of Agilkia Island between the Old Aswan Dam and the High Dam. Rescued stone by stone in a landmark UNESCO campaign, Philae was the last active bastion of ancient Egyptian religion. Sail across the sapphire waters in a private motorboat with your Egyptologist to explore the Mammisi (Birth House of Horus), the Temple of Isis, and the picturesque Trajan’s Kiosk.',
      itinerarySteps: [
        'Private transfer from your cruise in Aswan to the Marina of Shellal.',
        'Scenic private motorboat ride through the granite boulders to Agilkia Island.',
        'Guided walk through the Outer Colonnades, the First Pylon, the Sanctuary of Isis, and the Kiosk of Emperor Trajan.',
        'Return boat ride and transfer back to your Nile vessel.'
      ],
      duration: '2.5 Hours',
      guideIncluded: 'Private Egyptologist Guide + Private Motorboat + Entry Ticket',
      price: 60,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-unfinished-obelisk',
      slug: 'unfinished-obelisk',
      location: 'Aswan',
      title: 'Unfinished Obelisk',
      highlights: 'An enormous unfinished obelisk in an ancient granite quarry.',
      shortDesc: 'An enormous 1,200-ton unfinished obelisk of Queen Hatshepsut in Aswan’s ancient pink granite quarry.',
      fullOverview: 'Aswan’s northern quarries supplied the prized pink granite (syenite) used for royal statues, sarcophagi, and obelisks across ancient Egypt. Commissioned by Queen Hatshepsut around 1500 BC, the Unfinished Obelisk would have stood 42 meters tall and weighed nearly 1,200 tons—one-third larger than any Egyptian obelisk ever erected—before a natural flaw appeared in the bedrock. Walk along the quarry walkways as your Egyptologist demonstrates how ancient masons shaped solid granite using dolerite pounding balls.',
      itinerarySteps: [
        'Private A/C transfer to the Northern Granite Quarries of Aswan.',
        'Ascend the panoramic viewing walkway overlooking the 42-meter monolith still attached to the living bedrock.',
        'See ancient mason tool marks, ochre guide lines, and dolerite pounders explained by your Egyptologist.'
      ],
      duration: '1.5 Hours',
      guideIncluded: 'Private Egyptologist Guide + Quarry Ticket + Private Transfer',
      price: 40,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1544945582-3b466d874eac?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-high-dam',
      slug: 'aswan-high-dam',
      location: 'Aswan',
      title: 'Aswan High Dam',
      highlights: 'A major engineering project that transformed the Nile.',
      shortDesc: 'A monumental 20th-century engineering project that tamed the Nile floods and created Lake Nasser.',
      fullOverview: 'Constructed between 1960 and 1970 across the Nile south of Aswan, the Aswan High Dam (Al-Sadd Al-Aali) is an engineering marvel measuring 3,830 meters long and 111 meters high. Standing atop the dam crown with your guide, gaze south over the vast blue expanse of Lake Nasser—one of the world’s largest man-made lakes—and north toward the cataracts of the Nile Valley, while visiting the lotus-shaped Friendship Monument.',
      itinerarySteps: [
        'Private drive from Aswan up to the crest of the Aswan High Dam.',
        'Guided explanation of the dam’s hydro-electric turbines, flood control impact, and the UNESCO Nubian salvage campaign.',
        'Panoramic photo stop at the Lotus Tower overlooking Lake Nasser and Kalabsha Temple.'
      ],
      duration: '1.5 Hours',
      guideIncluded: 'Private Egyptologist Guide + Entry Ticket + Private Transfer',
      price: 35,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-abu-simbel',
      slug: 'abu-simbel-temples',
      location: 'Aswan – Abu Simbel',
      title: 'Abu Simbel',
      highlights: 'Abu Simbel Temples: The magnificent temples of Ramses II, usually visited on a separate excursion from Aswan.',
      shortDesc: 'The magnificent rock-cut temples of Pharaoh Ramses II and Queen Nefertari overlooking Lake Nasser.',
      fullOverview: 'Carved directly into a sandstone cliff near Egypt’s southern frontier in the 13th century BC, the Twin Temples of Abu Simbel represent the pinnacle of Pharaonic grandeur. Four 20-meter colossi of Ramesses II guard the Great Temple, engineered so the rising sun illuminates its inner sanctuary twice a year, while the neighboring Temple of Hathor honors his beloved Queen Nefertari. Relocated 65 meters higher in the 1960s to save them from Lake Nasser, Abu Simbel is an unforgettable highlight of any Nile voyage.',
      itinerarySteps: [
        'Early morning departure from Aswan by private air-conditioned vehicle (or optional domestic flight upgrade).',
        'Arrive at the shores of Lake Nasser and walk around the mountain dome to the facade of the Great Temple of Ramesses II.',
        'Explore the Great Hypostyle Hall of Osiride pillars, the Battle of Kadesh reliefs, and the inner Sanctuary.',
        'Visit the Small Temple of Queen Nefertari and Hathor before your comfortable return to Aswan.'
      ],
      duration: 'Half Day (7 – 8 Hours by Road / 4 Hours by Air)',
      guideIncluded: 'Private Egyptologist + Private A/C Vehicle + Abu Simbel Tickets',
      price: 165,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    },
    {
      id: 'sight-nubian-village',
      slug: 'nubian-village-aswan',
      location: 'Aswan Nuba',
      title: 'Nubian Village',
      highlights: 'Experience Nubian culture, traditional architecture, and local life.',
      shortDesc: 'Sail through the First Cataract islands to experience authentic Nubian culture, brightly painted dome homes, and warm hospitality.',
      fullOverview: 'Cruise by private motorboat or felucca past Elephantine Island and the wildlife reserve of the First Cataract to Gharb Soheil, a vibrant Nubian village on the West Bank of Aswan. Known for its indigo, turquoise, and ochre vaulted-dome houses, Nubia preserves one of the Nile Valley’s oldest living cultures and languages. Stroll through the colourful lanes with your guide, visit a welcoming Nubian family home for fresh karkadeh (hibiscus tea) and homemade bread with honey, and learn about Nubian music, handicrafts, and riverside traditions.',
      itinerarySteps: [
        'Board a private motorboat directly from your cruise dock in Aswan.',
        'Scenic boat ride through the granite islands and birds of the First Cataract Reserve.',
        'Guided walk through the colourful streets and traditional bazaars of Gharb Soheil Nubian Village.',
        'Guest welcome inside an authentic Nubian family house with hibiscus tea, local snacks, and cultural conversation.',
        'Sunset return cruise along the Nile back to your ship.'
      ],
      duration: '3 Hours',
      guideIncluded: 'Private Guide + Private River Boat + Nubian Family Hospitality',
      price: 55,
      priceUnit: 'per person',
      image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=80',
      enabled: true,
      canAddToJourney: true
    }
  ];

  // Build programs styled like nilecruisetrips.com/to_book/a-sara-nile-cruise/#itinerary
  function buildDefaultProgramsForVessel(vesselSlug, vesselTitle, tier, nights, route, kind, videoClip) {
    const base3N = tier === 'Luxury' ? 890 : tier === 'Private' ? 1450 : tier === 'Deluxe' ? 635 : 540;
    const base4N = tier === 'Luxury' ? 1050 : tier === 'Private' ? 1680 : tier === 'Deluxe' ? 768 : 650;
    const base7N = tier === 'Luxury' ? 1690 : tier === 'Private' ? 2650 : tier === 'Deluxe' ? 1290 : 1090;

    return [
      {
        id: `${vesselSlug}-prog-3n`,
        slug: '3-nights-aswan-to-luxor',
        tabLabel: '3 Nights',
        tabSub: 'Aswan → Luxor',
        title: `4 Days / 3 Nights — Aswan to Luxor Sailing Program`,
        badge: 'Classic 3-Night Route',
        duration: '4 Days / 3 Nights',
        nights: 3,
        route: 'Aswan → Kom Ombo → Edfu → Luxor',
        departureDays: 'Every Friday & Monday',
        heroVideo: videoClip || VIDEOS.cruise1,
        basePrice: base3N,
        pricingSeasons: {
          summer: { label: 'May – Aug', triple: Math.round(base3N * 0.96), double: base3N, single: Math.round(base3N * 1.65) },
          winter: { label: 'Sep – Apr', triple: Math.round(base3N * 1.16), double: Math.round(base3N * 1.2), single: Math.round(base3N * 1.95) }
        },
        summary: `Sail downstream from Aswan to Luxor aboard ${vesselTitle} on full-board basis with a licensed Egyptologist guide, visiting Philae Temple, High Dam, Unfinished Obelisk, Kom Ombo, Edfu, Valley of the Kings, Hatshepsut & Karnak.`,
        canBeAddonForOthers: false,
        allowedAddonIds: ['ALL'],
        facilities: [...DEFAULT_FACILITIES],
        highlights: [
          'Egyptologist — Licensed guide on board',
          'Full Board — All gourmet meals included',
          'Aswan → Luxor — Scenic 3-night sailing',
          'Free WiFi & Panoramic Sun Deck Pool'
        ],
        included: [
          'Meet & assist on arrival at Aswan Airport / Station with flowers',
          'Complimentary mineral water during all shore tours',
          'Egyptologist English / Multilingual-speaking guide',
          `3 nights accommodation aboard ${vesselTitle} on full-board basis`,
          'Private air-conditioned transfers for all excursions',
          'All taxes & service charges',
          'Entrance fees for all sites mentioned in the programme'
        ],
        excluded: [
          'Any optional sightseeing tours (Abu Simbel, Hot Air Balloon, Nubian Village)',
          'Extra meals & alcoholic / specialty beverages',
          'Personal expenses & spa treatments',
          'Tipping for crew and guide'
        ],
        cabins: [
          { id: 'triple-cabin', name: 'Triple Cabin (3 Persons Sharing)', priceDelta: -20, desc: 'Comfortable panoramic river-view cabin configured for 3 guests sharing.' },
          { id: 'double-cabin', name: 'Double Cabin (Most Chosen by Couples)', priceDelta: 0, desc: 'Standard panoramic window cabin on main/upper deck for 2 guests sharing.' },
          { id: 'single-cabin', name: 'Single Cabin (Private Occupancy)', priceDelta: Math.round(base3N * 0.65), desc: 'Private sole-occupancy river-view cabin.' },
          { id: 'royal-suite', name: 'Royal Panoramic Suite', priceDelta: 420, desc: 'Expansive suite with private balcony, living lounge & VIP amenities.' }
        ],
        routeStops: [
          { stop: 'Aswan', day: 'Day 1' },
          { stop: 'Kom Ombo & Edfu', day: 'Day 2' },
          { stop: 'Luxor', day: 'Day 3' },
          { stop: 'Disembarkation', day: 'Day 4' }
        ],
        itinerary: [
          {
            day: 'Day 1',
            stop: 'Aswan',
            title: 'Arrival at Aswan — Aswan City Tour (High Dam, Philae & Obelisk)',
            meals: 'Lunch · Dinner',
            desc: `Welcome to Aswan! When you arrive at the airport or train station in Aswan, our representative will meet you and transfer you to ${vesselTitle}. Start your guided visits in Aswan with the Aswan High Dam, followed by a motorboat ride to the island Temple of Philae (Temple of Isis), and the Unfinished Obelisk of Queen Hatshepsut. Embark the cruise to enjoy lunch, afternoon tea, dinner and overnight on board in Aswan.`
          },
          {
            day: 'Day 2',
            stop: 'Kom Ombo & Edfu',
            title: 'Nile Cruise Sailing — Kom Ombo Temple, Edfu Temple & Esna Lock',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Enjoy breakfast on board while sailing north to Kom Ombo, where you will visit the unique symmetrical double Temple of Kom Ombo dedicated to Sobek the Crocodile God and Horus the Falcon, plus the Crocodile Museum. Sail onward to Edfu to visit the best-preserved Temple of Horus, then continue sailing across Esna Lock toward Luxor with dinner and overnight onboard.'
          },
          {
            day: 'Day 3',
            stop: 'Luxor',
            title: 'West Bank & East Bank of Luxor (Valley of the Kings, Hatshepsut & Karnak)',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'After breakfast on board, cross to the West Bank of Luxor to explore the royal tombs of the Valley of the Kings, the terraced Temple of Queen Hatshepsut at Deir el-Bahari, and the Colossi of Memnon. After lunch onboard, visit the monumental Karnak Temple and Luxor Temple on the East Bank. Dinner and overnight in Luxor.'
          },
          {
            day: 'Day 4',
            stop: 'Disembarkation',
            title: 'Disembarkation in Luxor / Final Departure or Extension',
            meals: 'Breakfast',
            desc: 'After enjoying your final breakfast and check-out from the cruise at 08:00 AM, our representative will transfer you by private air-conditioned vehicle to Luxor Airport, railway station, or your selected Add-on Program.'
          }
        ]
      },
      {
        id: `${vesselSlug}-prog-4n`,
        slug: '4-nights-luxor-to-aswan',
        tabLabel: '4 Nights',
        tabSub: 'Luxor → Aswan',
        title: `5 Days / 4 Nights — Luxor to Aswan Sailing Program`,
        badge: 'Most Popular',
        duration: '5 Days / 4 Nights',
        nights: 4,
        route: 'Luxor → Esna → Edfu → Kom Ombo → Aswan',
        departureDays: 'Every Monday & Saturday',
        heroVideo: videoClip || VIDEOS.cruise2,
        basePrice: base4N,
        pricingSeasons: {
          summer: { label: 'May – Aug', triple: Math.round(base4N * 0.96), double: base4N, single: Math.round(base4N * 1.65) },
          winter: { label: 'Sep – Apr', triple: Math.round(base4N * 1.15), double: Math.round(base4N * 1.18), single: Math.round(base4N * 1.92) }
        },
        summary: `The classic 4-night Upper Egypt voyage from Luxor to Aswan aboard ${vesselTitle} with private Egyptologist-led excursions to Karnak, Luxor Temple, Valley of the Kings, Hatshepsut, Edfu, Kom Ombo and Aswan.`,
        canBeAddonForOthers: false,
        allowedAddonIds: ['ALL'],
        facilities: [...DEFAULT_FACILITIES],
        highlights: [
          'Egyptologist — Certified guide on board',
          'Full Board — Breakfast, Lunch & Dinner daily',
          'Luxor → Aswan — Classic 4-night itinerary',
          'Free WiFi, Swimming Pool & Cultural Shows'
        ],
        included: [
          'Meet & assist on arrival at Luxor Airport / Station with flowers',
          'Complimentary mineral water on all shore excursions',
          'Licensed Egyptologist guide in your preferred language',
          `4 nights accommodation aboard ${vesselTitle} on full-board basis`,
          'Private air-conditioned transfers throughout the journey',
          'All taxes, port fees & service charges',
          'Entrance tickets to all temples & tombs in the itinerary'
        ],
        excluded: [
          'Optional tours (Sunrise Hot Air Balloon, Abu Simbel, Nubian Village)',
          'Beverages & personal laundry',
          'Gratuities / Tipping'
        ],
        cabins: [
          { id: 'triple-cabin', name: 'Triple Cabin (3 Persons Sharing)', priceDelta: -25, desc: 'Spacious panoramic cabin for 3 guests sharing.' },
          { id: 'double-cabin', name: 'Double Cabin (Most Chosen by Couples)', priceDelta: 0, desc: 'Panoramic river-view cabin with twin or king bed for 2 guests.' },
          { id: 'single-cabin', name: 'Single Cabin (Private Occupancy)', priceDelta: Math.round(base4N * 0.65), desc: 'Sole occupancy river-view cabin.' },
          { id: 'royal-suite', name: 'Royal Presidential Suite', priceDelta: 480, desc: 'Upper deck corner suite with private terrace & VIP dining.' }
        ],
        routeStops: [
          { stop: 'Luxor East', day: 'Day 1' },
          { stop: 'Luxor West', day: 'Day 2' },
          { stop: 'Edfu & Kom Ombo', day: 'Day 3' },
          { stop: 'Aswan', day: 'Day 4' },
          { stop: 'Disembarkation', day: 'Day 5' }
        ],
        itinerary: [
          {
            day: 'Day 1',
            stop: 'Luxor East',
            title: 'Arrival at Luxor — Karnak Temple and Luxor Temple',
            meals: 'Lunch · Dinner',
            desc: `Welcome to Luxor! Our representative meets you at Luxor Airport or railway station and transfers you to ${vesselTitle} for check-in before lunch. In the afternoon, visit the monumental Temple of Karnak and the majestic Temple of Luxor linked by the Avenue of Sphinxes. Dinner and overnight onboard in Luxor.`
          },
          {
            day: 'Day 2',
            stop: 'Luxor West',
            title: 'Luxor West Bank Tour (Valley of the Kings, Hatshepsut & Memnon) & Sail to Edfu',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Optional pre-dawn Sunrise Hot Air Balloon ride. After breakfast onboard, cross to the West Bank to visit the Valley of the Kings, the cliffside Temple of Queen Hatshepsut, and the Colossi of Memnon. Return for lunch as we set sail across Esna Lock toward Edfu. Dinner and overnight in Edfu.'
          },
          {
            day: 'Day 3',
            stop: 'Edfu & Kom Ombo',
            title: 'Temple of Horus in Edfu & Temple of Kom Ombo',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Enjoy breakfast onboard, then visit the remarkably preserved Temple of Horus in Edfu. Sail along the palm-lined Nile to Kom Ombo with lunch on deck, then visit the double Temple of Sobek and Horus and the Crocodile Museum at sunset. Continue sailing to Aswan with an Egyptian Galabeya Party tonight.'
          },
          {
            day: 'Day 4',
            stop: 'Aswan',
            title: 'Aswan City Tour — High Dam, Philae Temple & Unfinished Obelisk',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'After breakfast, discover Aswan’s highlights with your Egyptologist: the Aswan High Dam, the granite quarries of the Unfinished Obelisk, and a motorboat ride to the island Temple of Philae dedicated to Isis. Afternoon free for an optional Nubian Village sail. Evening Nubian folkloric show and overnight in Aswan.'
          },
          {
            day: 'Day 5',
            stop: 'Disembarkation',
            title: 'Disembarkation in Aswan (Optional Abu Simbel Excursion)',
            meals: 'Breakfast',
            desc: 'Breakfast onboard and check-out at 08:00 AM (with optional early excursion to the Great Temples of Abu Simbel by road or flight), followed by private transfer to Aswan Airport or railway station.'
          }
        ]
      },
      {
        id: `${vesselSlug}-prog-7n`,
        slug: '7-nights-round-trip-cruise',
        tabLabel: '7 Nights',
        tabSub: 'Round trip',
        title: `8 Days / 7 Nights — Complete Round-Trip Nile Cruise Program`,
        badge: 'Extended Round Trip',
        duration: '8 Days / 7 Nights',
        nights: 7,
        route: 'Luxor ↔ Edfu ↔ Kom Ombo ↔ Aswan ↔ Abu Simbel',
        departureDays: 'Every Saturday & Monday',
        heroVideo: videoClip || VIDEOS.cruise3,
        basePrice: base7N,
        pricingSeasons: {
          summer: { label: 'May – Aug', triple: Math.round(base7N * 0.95), double: base7N, single: Math.round(base7N * 1.65) },
          winter: { label: 'Sep – Apr', triple: Math.round(base7N * 1.15), double: Math.round(base7N * 1.18), single: Math.round(base7N * 1.9) }
        },
        summary: `An unhurried 8-day / 7-night round-trip voyage aboard ${vesselTitle} giving you double the sailing time on the Nile plus dedicated days for West Bank treasures, Aswan islands and Abu Simbel.`,
        canBeAddonForOthers: true,
        allowedAddonIds: ['ALL'],
        facilities: [...DEFAULT_FACILITIES],
        highlights: [
          '7 Nights Round-Trip — Unhurried pace along the Nile',
          'Full Board — 21 freshly prepared onboard meals',
          'Egyptologist — Dedicated private guided tours',
          'Time for Abu Simbel, Nubian Village & Dendera'
        ],
        included: [
          'Airport meet & assist on arrival and departure',
          `7 nights full-board accommodation aboard ${vesselTitle}`,
          'All guided shore excursions in Luxor, Edfu, Kom Ombo & Aswan',
          'All temple & tomb entry tickets per itinerary',
          'Licensed Egyptologist guide & private A/C vehicles',
          'All service charges and local taxes'
        ],
        excluded: [
          'Optional excursions (Abu Simbel, Hot Air Balloon, Dendera & Abydos)',
          'Personal beverages & tipping'
        ],
        cabins: [
          { id: 'triple-cabin', name: 'Triple Cabin (3 Persons Sharing)', priceDelta: -45, desc: '7 nights full-board for 3 guests sharing.' },
          { id: 'double-cabin', name: 'Double Cabin (Most Chosen)', priceDelta: 0, desc: '7 nights full-board panoramic cabin for 2 guests.' },
          { id: 'single-cabin', name: 'Single Cabin (Private Occupancy)', priceDelta: Math.round(base7N * 0.65), desc: '7 nights sole-use panoramic cabin.' },
          { id: 'royal-suite', name: 'Royal Nile Suite', priceDelta: 780, desc: '7 nights luxury suite with private deck lounge & VIP perks.' }
        ],
        routeStops: [
          { stop: 'Embarkation', day: 'Day 1' },
          { stop: 'West Bank', day: 'Day 2' },
          { stop: 'Edfu', day: 'Day 3' },
          { stop: 'Aswan', day: 'Day 4' },
          { stop: 'Abu Simbel', day: 'Day 5' },
          { stop: 'Kom Ombo', day: 'Day 6' },
          { stop: 'East Bank', day: 'Day 7' },
          { stop: 'Disembarkation', day: 'Day 8' }
        ],
        itinerary: [
          {
            day: 'Day 1',
            stop: 'Embarkation',
            title: 'Embarkation at Nile Cruise',
            meals: 'Lunch · Dinner',
            desc: `Our representative meets and assists you at the airport or train station, then transfers you to ${vesselTitle} for check-in before lunch. Enjoy a welcome cocktail, dinner and overnight onboard.`
          },
          {
            day: 'Day 2',
            stop: 'West Bank',
            title: 'Tour of the West Bank (Valley of the Kings, Hatshepsut & Memnon)',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Breakfast on board, then enjoy a guided tour to the West Bank of Luxor to visit the Valley of the Kings, the Temple of Queen Hatshepsut, and the Colossi of Memnon. Lunch before sailing across Esna Lock to Edfu.'
          },
          {
            day: 'Day 3',
            stop: 'Edfu',
            title: 'Temple of Horus in Edfu & Sail to Aswan',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Visit the wonderfully preserved Temple of Horus in Edfu after breakfast, then enjoy a full scenic day of sailing south to Aswan with afternoon tea on the sun deck and evening Galabeya party.'
          },
          {
            day: 'Day 4',
            stop: 'Aswan',
            title: 'Aswan Visits (High Dam, Unfinished Obelisk & Philae Temple)',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Guided morning visit to the Aswan High Dam, the Unfinished Obelisk, and the island Temple of Philae by motorboat. Afternoon optional felucca sail to the Nubian Village.'
          },
          {
            day: 'Day 5',
            stop: 'Abu Simbel',
            title: 'Free Leisure Day in Aswan / Optional Tour of Abu Simbel Temples',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Enjoy free time in Aswan or join the excursion to the magnificent rock-cut Temples of Ramesses II and Queen Nefertari at Abu Simbel. Evening Nubian folkloric show onboard in Aswan.'
          },
          {
            day: 'Day 6',
            stop: 'Kom Ombo',
            title: 'Sail to Kom Ombo Temple & Return Toward Luxor',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Sail to Kom Ombo during breakfast and visit the double Temple of Sobek and Horus with its Crocodile Museum. Continue sailing north to Edfu and Esna with afternoon tea on deck.'
          },
          {
            day: 'Day 7',
            stop: 'East Bank',
            title: 'East Bank Tour — Karnak Temples & Luxor Temple',
            meals: 'Breakfast · Lunch · Dinner',
            desc: 'Arrive in Luxor and enjoy a guided tour of the monumental Karnak Temple complex and Luxor Temple on the East Bank. Farewell gala dinner and overnight onboard in Luxor.'
          },
          {
            day: 'Day 8',
            stop: 'Disembarkation',
            title: 'Disembarkation & Departure Transfer',
            meals: 'Breakfast',
            desc: 'Breakfast onboard, check-out at 08:00 AM and private transfer to the airport, train station, or your chosen extension program.'
          }
        ]
      }
    ];
  }

  const seedCruises = [
    {
      id: 'cruise-1',
      slug: 'luxury-nile-cruise-4-nights',
      title: 'Luxury Nile Cruise (MS Sara / Oberoi Class)',
      tier: 'Luxury',
      route: 'Luxor → Aswan',
      nights: 4,
      image: IMG.cruise,
      heroVideo: VIDEOS.cruise1,
      tag: '5★ Ultra-Luxury Fleet',
      kind: 'cruise',
      sub: 'Panoramic suites, sun deck pool, fine dining and private Egyptologist shore tours between Luxor and Aswan.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: true
    },
    {
      id: 'cruise-2',
      slug: 'deluxe-nile-cruise-3-nights',
      title: 'Deluxe Nile Cruise',
      tier: 'Deluxe',
      route: 'Aswan → Luxor',
      nights: 3,
      image: IMG.sailing,
      heroVideo: VIDEOS.cruise2,
      tag: 'A classic voyage',
      kind: 'cruise',
      sub: 'A beautifully balanced 5-star introduction to life on the river with 3, 4 & 7-night itineraries.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: true
    },
    {
      id: 'cruise-3',
      slug: 'superior-nile-cruise-7-nights',
      title: 'Superior Nile Cruise',
      tier: 'Superior',
      route: 'Luxor → Aswan',
      nights: 7,
      image: IMG.temple,
      heroVideo: VIDEOS.cruise3,
      tag: 'More time to explore',
      kind: 'cruise',
      sub: 'More time for discovery, with Egypt unfolding day by day along the timeless river.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: true
    },
    {
      id: 'cruise-4',
      slug: 'deluxe-nile-cruise-4-nights',
      title: 'Royal Deluxe Nile Cruise',
      tier: 'Deluxe',
      route: 'Luxor → Aswan',
      nights: 4,
      image: IMG.cruise,
      heroVideo: VIDEOS.cruise1,
      tag: 'The essential Nile',
      kind: 'cruise',
      sub: 'Comfortable 5-star sailing between the Nile’s iconic temples and tombs.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: false
    },
    {
      id: 'cruise-5',
      slug: 'luxury-nile-cruise-7-nights',
      title: 'Grand Sanctuary Luxury Cruise',
      tier: 'Luxury',
      route: 'Aswan → Luxor',
      nights: 7,
      image: IMG.sailing,
      heroVideo: VIDEOS.cruise2,
      tag: 'A longer escape',
      kind: 'cruise',
      sub: 'A rewarding round-trip pace, with room to enjoy every temple along the Nile.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: false
    },
    {
      id: 'cruise-6',
      slug: 'superior-nile-cruise-3-nights',
      title: 'Classic Superior Nile Cruise',
      tier: 'Superior',
      route: 'Aswan → Luxor',
      nights: 3,
      image: IMG.cruise,
      heroVideo: VIDEOS.cruise3,
      tag: 'Short and memorable',
      kind: 'cruise',
      sub: 'A rewarding Nile introduction for a shorter stay in Upper Egypt.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: false
    }
  ].map((c, idx) => ({
    ...c,
    programs: buildDefaultProgramsForVessel(c.slug, c.title, c.tier, c.nights, c.route, c.kind, [VIDEOS.cruise1, VIDEOS.cruise2, VIDEOS.cruise3][idx % 3])
  }));

  const seedDahabiyas = [
    {
      id: 'dahabiya-1',
      slug: 'luxury-dahabiya-sailing',
      title: 'Luxury Dahabiya Sailing',
      tier: 'Luxury',
      route: 'Luxor → Aswan',
      nights: 4,
      image: IMG.sailing,
      heroVideo: VIDEOS.dahabiya1,
      tag: 'The art of slowing down',
      kind: 'dahabiya',
      sub: 'Intimate wind-powered sailing, quiet river islands and private temple access.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: true
    },
    {
      id: 'dahabiya-2',
      slug: 'deluxe-traditional-dahabiya',
      title: 'Deluxe Traditional Dahabiya',
      tier: 'Deluxe',
      route: 'Aswan → Luxor',
      nights: 3,
      image: IMG.temple,
      heroVideo: VIDEOS.dahabiya2,
      tag: 'Authentic by nature',
      kind: 'dahabiya',
      sub: 'A timeless wooden sailing vessel connecting you with the river and its Nubian shores.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: true
    },
    {
      id: 'dahabiya-3',
      slug: 'private-dahabiya-charter',
      title: 'Private Dahabiya Charter',
      tier: 'Private',
      route: 'Tailor-made',
      nights: 7,
      image: IMG.sailing,
      heroVideo: VIDEOS.dahabiya1,
      tag: 'Entirely your own',
      kind: 'dahabiya',
      sub: 'A private vessel, private chef and a custom Egyptologist itinerary designed around your group.',
      facilities: [...DEFAULT_FACILITIES],
      enabled: true,
      showOnHome: true
    }
  ].map((d, idx) => ({
    ...d,
    programs: buildDefaultProgramsForVessel(d.slug, d.title, d.tier, d.nights, d.route, d.kind, idx % 2 === 0 ? VIDEOS.dahabiya1 : VIDEOS.dahabiya2)
  }));

  const DEFAULT_DATA = {
    version: 3,
    settings: {
      brandName: 'NileTrails',
      tagline: 'SAILING THE NILE · DISCOVERING EGYPT',
      currency: 'USD',
      currencySymbol: '$',
      contactEmail: 'concierge@niletrails.com',
      contactPhone: '+20 100 555 8899',
      whatsapp: '+201005558899',
      youtubeHeroUrl: VIDEOS.youtubeUrl,
      showAdminBar: true
    },
    homeConfig: {
      heroEyebrow: 'TRAVEL DEEPER. SAIL SLOWER.',
      heroTitle: 'Find your <em>Egypt</em><br>along the Nile.',
      heroSub: 'From timeless river cruises to intimate dahabiyas, guided temple sightseeing and journeys shaped entirely around you.',
      heroImage: IMG.sailing,
      heroVideo: VIDEOS.main,
      primaryBtnText: 'Explore the Nile',
      primaryBtnUrl: 'nile-cruises',
      secondaryBtnText: 'Nubian & the Nile Sightseeing',
      secondaryBtnUrl: 'beyond-the-nile/nubian-and-the-nile',
      sections: [
        { id: 'search', label: 'Quick Search Bar (شريط البحث السريع)', enabled: true },
        { id: 'intro', label: 'Philosophy Intro (مقدمة فلسفة الموقع)', enabled: true },
        { id: 'experiences', label: 'Experience Categories Grid (شبكة التجارب الـ 4)', enabled: true },
        { id: 'featuredCruises', label: 'Featured Nile Cruises & Programs (الكروز والبرامج المختارة)', enabled: true },
        { id: 'sightseeingHome', label: 'Main Places to Visit & Sightseeing with Tour Guide (المزارات وأسعارها)', enabled: true },
        { id: 'customPagesHome', label: 'Custom Pages Pinned to Home (الصفحات المضافة للرئيسية)', enabled: true },
        { id: 'signature', label: 'Dahabiya Slow Travel Section (قسم الدهبية)', enabled: true },
        { id: 'featuredAddons', label: 'Program Add-ons & Extensions Showcase (الإضافات والبرامج الملحقة)', enabled: true },
        { id: 'journeysFeature', label: 'Journeys Highlight Banner (قسم الرحلات المتكاملة)', enabled: true },
        { id: 'storiesSection', label: 'Nile Stories Journal (مقالات وقصص النيل)', enabled: true },
        { id: 'closingBanner', label: 'Closing Call-to-Action Banner (البانر الختامي)', enabled: true }
      ]
    },
    cruises: seedCruises,
    dahabiyas: seedDahabiyas,
    sightseeingPlaces: DEFAULT_SIGHTSEEING_PLACES,
    addons: [
      {
        id: 'addon-cairo-pyramids-3d',
        title: 'Cairo, Great Pyramids & Grand Egyptian Museum Program',
        type: 'program-extension',
        category: 'Other Program Extension',
        duration: '+3 Days / 2 Nights',
        price: 480,
        priceUnit: 'per person',
        image: IMG.temple,
        summary: 'Add our 3-day Cairo & Giza program before or after your cruise: private Egyptologist tour of the Pyramids, Sphinx, Grand Egyptian Museum (GEM), 5★ hotel & domestic flights.',
        enabled: true,
        showOnHome: true
      },
      {
        id: 'addon-abu-simbel-flight',
        title: 'Abu Simbel Temples Excursion by Domestic Flight',
        type: 'excursion',
        category: 'Iconic Excursion',
        duration: '+Half Day (Morning)',
        price: 240,
        priceUnit: 'per person',
        image: IMG.temple,
        summary: 'Roundtrip domestic flight from Aswan to the UNESCO World Heritage temples of Ramesses II and Queen Nefertari at Abu Simbel with private Egyptologist.',
        enabled: true,
        showOnHome: true
      },
      {
        id: 'addon-luxor-balloon',
        title: 'Sunrise Hot Air Balloon Over Luxor West Bank',
        type: 'excursion',
        category: 'Signature Experience',
        duration: 'Sunrise (3 Hours)',
        price: 135,
        priceUnit: 'per person',
        image: IMG.sailing,
        summary: 'Float peacefully over the Valley of the Kings, Hatshepsut Temple and the Nile Valley at dawn with transfers and flight certificate.',
        enabled: true,
        showOnHome: true
      },
      {
        id: 'addon-red-sea-4d',
        title: 'Red Sea Coastal Retreat (Hurghada / El Gouna Program)',
        type: 'program-extension',
        category: 'Other Program Extension',
        duration: '+4 Days / 3 Nights',
        price: 420,
        priceUnit: 'per person',
        image: IMG.sailing,
        summary: 'Extend your Nile cruise with 4 relaxing days on the Red Sea coast: private transfer from Luxor/Aswan, 5★ beachfront resort & Red Sea coral reef boat trip.',
        enabled: true,
        showOnHome: false
      },
      {
        id: 'addon-white-desert-3d',
        title: 'Bahariya Oasis & White Desert Luxury Camping Program',
        type: 'program-extension',
        category: 'Other Program Extension',
        duration: '+3 Days / 2 Nights',
        price: 510,
        priceUnit: 'per person',
        image: IMG.temple,
        summary: 'Private 4x4 desert expedition to the Black & White Deserts, Crystal Mountain and starlight Bedouin camp.',
        enabled: true,
        showOnHome: false
      },
      {
        id: 'addon-dahabiya-extension-2n',
        title: 'Private 2-Night Traditional Dahabiya Sanctuary Add-on',
        type: 'program-extension',
        category: 'Other Program Extension',
        duration: '+2 Nights Sailing',
        price: 560,
        priceUnit: 'per person',
        image: IMG.sailing,
        summary: 'Combine your classic tour with 2 intimate nights under sail aboard a traditional wooden Dahabiya between Esna and Aswan.',
        enabled: true,
        showOnHome: false
      },
      {
        id: 'addon-philae-sound-light-dinner',
        title: 'Philae Sound & Light Show + Private Nubian Island Dinner',
        type: 'excursion',
        category: 'Cultural Evening',
        duration: 'Evening (4 Hours)',
        price: 85,
        priceUnit: 'per person',
        image: IMG.cruise,
        summary: 'Evening river boat to the illuminated Temple of Isis on Philae Island followed by a private dinner overlooking the Nile cataracts.',
        enabled: true,
        showOnHome: false
      },
      {
        id: 'addon-vip-fast-track-visa',
        title: 'VIP Airport Fast-Track, Entry Visa & Private Limousine',
        type: 'vip',
        category: 'VIP Service',
        duration: 'Arrival & Departure',
        price: 95,
        priceUnit: 'per person',
        image: IMG.cruise,
        summary: 'Personal concierge greets you at the aircraft gate, handles your Egypt entry visa stamp, fast-tracks customs and escorts you to a private luxury vehicle.',
        enabled: true,
        showOnHome: false
      }
    ],
    journeys: [
      { slug: 'classic-nile-journey', name: 'Classic Nile Journey', route: 'Cairo · Luxor · Nile · Aswan', image: IMG.temple, tag: 'An essential introduction', summary: 'A considered introduction to Egypt, weaving the capital, timeless temples and Nile sailing into one meaningful experience.', enabled: true, showOnHome: true, price: 1450 },
      { slug: 'the-complete-nile', name: 'The Complete Nile', route: 'Cairo · Luxor · Nile · Aswan · Abu Simbel', image: IMG.cruise, tag: 'The full story', summary: 'A deeper experience of the river and its monumental history, designed around the places that make Egypt unforgettable.', enabled: true, showOnHome: true, price: 1890 },
      { slug: 'nile-and-desert', name: 'Nile & Desert', route: 'The Nile · Bahariya · White Desert', image: IMG.temple, tag: 'Two extraordinary worlds', summary: 'Combine the living rhythm of the Nile with the silence, space and sculptural beauty of the desert.', enabled: true, showOnHome: true, price: 1680 },
      { slug: 'nile-and-red-sea', name: 'Nile & Red Sea', route: 'The Nile · Hurghada or Marsa Alam', image: IMG.sailing, tag: 'Culture meets the coast', summary: 'Balance ancient wonders and river days with time to relax beside the Red Sea.', enabled: true, showOnHome: true, price: 1590 },
      { slug: 'nile-and-nubia', name: 'Nile & Nubia', route: 'The Nile · Aswan · Nubian culture', image: IMG.sailing, tag: 'Life along the river', summary: 'Discover a more personal side of southern Egypt through its landscapes, traditions and vibrant communities.', enabled: true, showOnHome: true, price: 1420 },
      { slug: 'grand-egypt-journey', name: 'Grand Egypt Journey', route: 'Cairo · Nile · Abu Simbel · Red Sea', image: IMG.cruise, tag: 'An expansive discovery', summary: 'An inspiring journey connecting ancient Egypt, life on the Nile and the beauty of the coast.', enabled: true, showOnHome: true, price: 2250 }
    ],
    destinations: [
      { slug: 'nubian-and-the-nile', name: 'Nubian and the Nile', subtitle: 'Main places to visit, guided sightseeing & Nubian heritage', image: IMG.sailing, desc: 'Explore the 15 iconic temples, royal tombs and Nubian villages along the Nile between Luxor, Esna, Edfu, Kom Ombo, Aswan and Abu Simbel — each available with a private Egyptologist tour guide.', enabled: true, isNubianHub: true },
      { slug: 'cairo-and-giza', name: 'Cairo & Giza', subtitle: 'Where past and present meet', image: IMG.temple, desc: 'Explore the ancient and contemporary layers of Egypt’s extraordinary capital.', enabled: true },
      { slug: 'alexandria', name: 'Alexandria', subtitle: 'The Mediterranean perspective', image: IMG.cruise, desc: 'A coastal city shaped by centuries of culture, literature and exchange.', enabled: true },
      { slug: 'red-sea', name: 'Red Sea', subtitle: 'Space to slow down', image: IMG.sailing, desc: 'Discover a different side of Egypt, with coastal landscapes and time to unwind.', enabled: true },
      { slug: 'western-desert', name: 'Western Desert', subtitle: 'A landscape of quiet wonder', image: IMG.temple, desc: 'Escape into vast landscapes, open horizons and a remarkable sense of place.', enabled: true },
      { slug: 'bahariya-and-white-desert', name: 'Bahariya & White Desert', subtitle: 'Beyond the familiar', image: IMG.temple, desc: 'Journey into Egypt’s remarkable oasis and chalk-white desert formations.', enabled: true },
      { slug: 'alexandria-and-siwa', name: 'Alexandria & Siwa Oasis', subtitle: 'Coast, culture and oasis life', image: IMG.temple, desc: 'Connect the Mediterranean with the distinctive landscapes of Siwa.', enabled: true },
      { slug: 'fayoum-oasis', name: 'Fayoum Oasis', subtitle: 'Nature close to Cairo', image: IMG.sailing, desc: 'Uncover lakes, traditional villages and quiet landscapes within easy reach of Cairo.', enabled: true }
    ],
    stories: [
      { slug: 'choosing-your-nile-cruise', title: 'How to Choose Your Nile Cruise', category: 'Nile Cruise Guide', image: IMG.cruise, date: 'Travel guide', summary: 'A practical guide to duration, style and direction so you can find the experience that suits you.', enabled: true },
      { slug: 'the-art-of-slow-sailing', title: 'The Art of Slow Sailing by Dahabiya', category: 'Dahabiya Life', image: IMG.sailing, date: 'River stories', summary: 'Why a traditional sailing boat offers a remarkably intimate way to experience the Nile.', enabled: true },
      { slug: 'a-first-time-guide-to-egypt', title: 'A First-Time Guide to Egypt', category: 'Egypt Travel Guide', image: IMG.temple, date: 'Travel guide', summary: 'Helpful ideas for shaping a rewarding first visit, from the cities to the river.', enabled: true },
      { slug: 'temples-along-the-nile', title: 'Temples Along the Nile', category: 'Temples & Tombs', image: IMG.temple, date: 'Ancient Egypt', summary: 'A closer look at the monuments and landscapes that give the Nile its sense of wonder.', enabled: true }
    ],
    customPages: [
      {
        id: 'page-private-celebrations',
        slug: 'private-celebrations-and-honeymoons',
        title: 'Honeymoons & Private Nile Celebrations',
        eyebrow: 'BESPOKE OCCASIONS',
        subtitle: 'Celebrate life’s milestone moments on the timeless waters of the Nile — tailored with private deck dining, floral suites and curated excursions.',
        heroImage: IMG.sailing,
        enabled: true,
        showOnHome: false,
        homeCardTag: 'Bespoke Occasions',
        showInNavbar: true,
        navParent: 'about',
        showInFooter: true,
        blocks: [
          {
            id: 'blk-1',
            type: 'editorial',
            eyebrow: 'CELEBRATE ON THE RIVER',
            heading: 'Unforgettable moments, <em>crafted around you.</em>',
            body: 'Whether you are planning a romantic honeymoon suite aboard a luxury cruise, an anniversary voyage under the sails of a traditional dahabiya, or a private family charter, our travel designers curate every detail from private temple dinners to sunrise balloon flights.',
            ctaText: 'Explore Luxury Cruises',
            ctaUrl: 'nile-cruises?category=luxury'
          },
          {
            id: 'blk-2',
            type: 'highlights',
            eyebrow: 'SIGNATURE TOUCHES',
            heading: 'How we elevate <em>your celebration.</em>',
            items: [
              { num: '01', title: 'Private Candlelit Deck Dining', text: 'Enjoy a curated multi-course dinner under the Egyptian stars on a private terrace overlooking the Nile.' },
              { num: '02', title: 'Suite Upgrades & VIP Welcome', text: 'Complimentary floral arrangements, Egyptian delicacies, and priority panoramic suite selection.' },
              { num: '03', title: 'Tailored Add-on Experiences', text: 'Seamlessly add private sunrise hot air balloons, Abu Simbel flights or Red Sea coastal retreats.' }
            ]
          },
          {
            id: 'blk-3',
            type: 'programs-showcase',
            eyebrow: 'RECOMMENDED CRUISES & PROGRAMS',
            heading: 'Vessels suited for <em>special occasions.</em>',
            sub: 'Each cruise includes selectable programs and customizable add-ons.',
            cruiseSlugs: ['luxury-nile-cruise-4-nights', 'luxury-dahabiya-sailing', 'private-dahabiya-charter']
          },
          {
            id: 'blk-4',
            type: 'booking-form',
            heading: 'Reserve Your Celebration Program',
            sub: 'Complete your details below and select any add-ons or extension programs you wish to include.'
          }
        ]
      }
    ],
    enquiries: [
      {
        id: 'NT-2026-8419',
        createdAt: '2026-11-08 14:30',
        status: 'Confirmed',
        vesselTitle: 'Luxury Nile Cruise (MS Sara / Oberoi Class)',
        vesselSlug: 'luxury-nile-cruise-4-nights',
        programTitle: '5 Days / 4 Nights — Luxor to Aswan Sailing Program',
        programSlug: '4-nights-luxor-to-aswan',
        cabinName: 'Double Cabin (Most Chosen by Couples)',
        checkInDate: '2026-12-14',
        dateFlexibility: 'Flexible (±3 days)',
        adults: 2,
        children: 0,
        selectedAddons: [
          { id: 'sight-abu-simbel', title: 'Sightseeing: Abu Simbel Temples (with Tour Guide)', price: 165 },
          { id: 'sight-nubian-village', title: 'Sightseeing: Nubian Village (with Tour Guide)', price: 55 },
          { id: 'addon-cairo-pyramids-3d', title: 'Cairo, Great Pyramids & Grand Egyptian Museum Program', price: 480 }
        ],
        estimatedTotal: 3500,
        clientName: 'Charlotte & Oliver Vance',
        clientEmail: 'charlotte.vance@example.co.uk',
        clientPhone: '+44 7700 900412',
        nationality: 'United Kingdom',
        passportReady: 'Valid (>6 months)',
        dietary: 'Gluten-Free (1 guest)',
        occasion: 'Anniversary',
        flightTransfer: 'Yes — Airport pickup & VIP Visa Assist requested',
        notes: 'We would love an upper-deck double cabin and private Egyptologist for Abu Simbel and Nubian Village.'
      },
      {
        id: 'NT-2026-8425',
        createdAt: '2026-11-09 09:15',
        status: 'New',
        vesselTitle: 'Luxury Dahabiya Sailing',
        vesselSlug: 'luxury-dahabiya-sailing',
        programTitle: '4 Days / 3 Nights — Aswan to Luxor Sailing Program',
        programSlug: '3-nights-aswan-to-luxor',
        cabinName: 'Royal Panoramic Suite',
        checkInDate: '2027-01-18',
        dateFlexibility: 'Exact dates',
        adults: 2,
        children: 1,
        selectedAddons: [
          { id: 'sight-dandara-abydos', title: 'Sightseeing: Dandara & Abydos Temple (with Tour Guide)', price: 120 },
          { id: 'addon-red-sea-4d', title: 'Red Sea Coastal Retreat (Hurghada / El Gouna Program)', price: 420 }
        ],
        estimatedTotal: 4965,
        clientName: 'Dr. Lukas Weber',
        clientEmail: 'l.weber@example.de',
        clientPhone: '+49 151 23456789',
        nationality: 'Germany',
        passportReady: 'Valid (>6 months)',
        dietary: 'No restrictions',
        occasion: 'Family Holiday (German Guide)',
        flightTransfer: 'Yes — Arriving via Lufthansa into Cairo / Luxor',
        notes: 'Travelling with our 11-year-old son who is fascinated by ancient Egyptian hieroglyphs.'
      }
    ]
  };

  let state = JSON.parse(JSON.stringify(DEFAULT_DATA));

  function loadLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === DEFAULT_DATA.version) {
          state = { ...JSON.parse(JSON.stringify(DEFAULT_DATA)), ...parsed };
          if (!Array.isArray(state.sightseeingPlaces) || !state.sightseeingPlaces.length) {
            state.sightseeingPlaces = JSON.parse(JSON.stringify(DEFAULT_SIGHTSEEING_PLACES));
          }
        }
      }
    } catch (e) {
      console.warn('Could not load local CMS state:', e);
    }
  }

  async function syncFromServer() {
    loadLocal();
    try {
      const res = await fetch('/api/cms');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && serverData.version === DEFAULT_DATA.version) {
          state = { ...JSON.parse(JSON.stringify(DEFAULT_DATA)), ...serverData };
          if (!Array.isArray(state.sightseeingPlaces) || !state.sightseeingPlaces.length) {
            state.sightseeingPlaces = JSON.parse(JSON.stringify(DEFAULT_SIGHTSEEING_PLACES));
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          return state;
        } else {
          // Upgrade server to v3 schema
          await saveToServer();
        }
      } else if (res.status === 404) {
        await saveToServer();
      }
    } catch (e) {
      // Offline / localStorage fallback
    }
    return state;
  }

  async function saveToServer() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (e) {
      console.warn('Saved to localStorage (server sync skipped):', e);
    }
  }

  async function submitEnquiry(enquiryObj) {
    if (!Array.isArray(state.enquiries)) state.enquiries = [];
    state.enquiries.unshift(enquiryObj);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    try {
      await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiryObj)
      });
    } catch (e) {
      console.warn('Saved enquiry locally:', e);
    }
    return enquiryObj;
  }

  async function resetToDefaults() {
    state = JSON.parse(JSON.stringify(DEFAULT_DATA));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    try {
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (e) {}
    return state;
  }

  function getAvailableAddonsForProgram(currentProgramId, allowedIds = ['ALL']) {
    const allowAll = !allowedIds || allowedIds.includes('ALL');
    const list = [];

    // 1. Global Add-ons & Program Extensions
    (state.addons || []).forEach(a => {
      if (!a.enabled) return;
      if (allowAll || allowedIds.includes(a.id)) {
        list.push({
          id: a.id,
          title: a.title,
          type: a.type || 'excursion',
          category: a.category || 'Add-on',
          duration: a.duration || '',
          price: Number(a.price) || 0,
          priceUnit: a.priceUnit || 'per person',
          summary: a.summary || '',
          image: a.image || IMG.temple
        });
      }
    });

    // 2. Other Cruise/Dahabiya Programs marked as `canBeAddonForOthers`
    const allVessels = [...(state.cruises || []), ...(state.dahabiyas || [])];
    allVessels.forEach(v => {
      if (!v.enabled) return;
      (v.programs || []).forEach(prog => {
        if (prog.id === currentProgramId) return;
        if (prog.canBeAddonForOthers && (allowAll || allowedIds.includes(prog.id))) {
          list.push({
            id: prog.id,
            title: `${prog.title} (${v.title})`,
            type: 'program-extension',
            category: 'Linked Cruise Program',
            duration: prog.duration || `${prog.nights} Nights`,
            price: Number(prog.basePrice) || 650,
            priceUnit: 'per person',
            summary: prog.summary || v.sub,
            image: v.image || IMG.cruise
          });
        }
      });
    });

    return list;
  }

  loadLocal();

  return {
    getState: () => state,
    setState: (newState) => { state = newState; return saveToServer(); },
    save: saveToServer,
    sync: syncFromServer,
    submitEnquiry,
    resetToDefaults,
    getAvailableAddonsForProgram,
    DEFAULT_DATA,
    DEFAULT_FACILITIES,
    DEFAULT_SIGHTSEEING_PLACES,
    VIDEOS
  };
})();
