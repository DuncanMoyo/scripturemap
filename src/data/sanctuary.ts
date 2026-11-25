import { SanctuaryArticle, SanctuaryCompartment } from '../types/scripture';

export const SANCTUARY_COMPARTMENT_META: Record<
  SanctuaryCompartment,
  {
    label: string;
    hebrewName: string;
    dimensions: string;
    primaryMetal: string;
    accentColor: string;
    summary: string;
  }
> = {
  'Outer Court': {
    label: 'Outer Court',
    hebrewName: 'Chatser (חָצֵר)',
    dimensions: '100 × 50 cubits · 5 cubits high',
    primaryMetal: 'Bronze & Fine Twined Linen',
    accentColor: '#C86D32',
    summary:
      'Open-air sacred enclosure entered from the East, housing the Altar of Burnt Offering and the Bronze Laver.',
  },
  'Holy Place': {
    label: 'Holy Place',
    hebrewName: 'Qodesh (קֹדֶשׁ)',
    dimensions: '20 × 10 × 10 cubits',
    primaryMetal: 'Pure Gold & Acacia Wood',
    accentColor: '#D4894A',
    summary:
      'First interior apartment of the tent where priests ministered daily with the Golden Candlestick, Table of Showbread, and Altar of Incense.',
  },
  'Most Holy Place': {
    label: 'Most Holy Place',
    hebrewName: 'Qodesh Haqqodashim (קֹדֶשׁ הַקֳּדָשִׁים)',
    dimensions: '10 × 10 × 10 cubits (cube)',
    primaryMetal: 'Pure Gold',
    accentColor: '#4EC498',
    summary:
      'Innermost cube behind the second veil containing the Ark of the Covenant and Mercy Seat, entered by the high priest once a year on the Day of Atonement.',
  },
};

export const SANCTUARY_ARTICLES: SanctuaryArticle[] = [
  {
    id: 'sanc-courtyard',
    order: 1,
    name: 'The Courtyard',
    hebrewTerm: 'Chatser ha-Mishkan (Court of the Tabernacle)',
    kind: 'compartment',
    compartment: 'Outer Court',
    dimensions: '100 cubits long (E–W) × 50 cubits wide (N–S) × 5 cubits high',
    material: 'Fine twined white linen hangings, 60 pillars with silver hooks/fillets, bronze sockets, and a 20-cubit embroidered East Gate',
    biblicalDescription:
      'Exodus 27:9–19 specifies a rectangular open-air enclosure surrounding the tabernacle tent. Its perimeter consisted of fine twined linen curtains suspended five cubits high on sixty pillars set in bronze sockets—twenty pillars along the north and south sides, ten on the west, and ten on the east flanking a single twenty-cubit gate of blue, purple, and scarlet.',
    construction:
      'Pillars spaced five cubits apart rested in heavy cast bronze sockets (bases) anchored by bronze tent pins and cords. The pillar capitals and connecting rods (fillets) and hooks were overlaid or wrought in silver. Only one wide entrance stood on the east side, framed by four pillars holding an embroidered linen screen.',
    purpose:
      'Defined the consecrated boundary separating Israel\'s twelve-tribe encampment from the sacred precinct. Israelites brought sacrificial animals through the East Gate to the Altar of Burnt Offering, while priests washed at the Laver before entering the covered tent.',
    otTextualBasis: ['Exodus 27:9–19', 'Exodus 38:9–20', 'Psalm 84:2', 'Psalm 100:4'],
    symbolism:
      'In sanctuary theology, the white linen perimeter signifies the righteousness surrounding God\'s dwelling, while the single wide eastern gate represents exclusive yet welcoming access into reconciliation with God.',
    ntFulfillment:
      'The earthly court corresponds to the sphere of Christ\'s public redemptive work on earth (Calvary and gospel invitation) prior to His ascension into the heavenly sanctuary; Psalm 100:4 and John 10:9 frame thanksgiving and Christ Himself as the sole door of entry.',
    canonicalConnections: [
      {
        label: 'Psalmist Longing & Entry Through the Gates',
        otRef: 'Psalm 84:2; 100:4',
        epistemicNature: 'explicit_biblical',
        note: 'Biblical worship poetry directly adopts the tabernacle courtyard and gates as the setting of thanksgiving, praise, and communion with the living God.',
        verseIds: ['PSA.84.2', 'PSA.100.4'],
      },
      {
        label: 'Access Through Christ Alone',
        otRef: 'Exodus 27:9, 18',
        ntRef: 'John 14:6',
        epistemicNature: 'scholarly_interpretive',
        note: 'The single eastern gate into the sacred court is widely interpreted christologically alongside Jesus\' declaration, "I am the way... no man cometh unto the Father, but by me."',
        verseIds: ['EXO.27.9', 'EXO.27.18', 'JHN.14.6'],
      },
    ],
    verseIds: ['EXO.27.9', 'EXO.27.18', 'PSA.100.4', 'PSA.84.2'],
  },
  {
    id: 'sanc-altar-burnt-offering',
    order: 2,
    name: 'Altar of Burnt Offering',
    hebrewTerm: 'Mizbeach ha-Olah (Brazen Altar)',
    kind: 'furnishing',
    compartment: 'Outer Court',
    dimensions: '5 cubits long × 5 cubits broad × 3 cubits high (foursquare)',
    material: 'Hollow acacia (shittim) wood frame overlaid entirely with bronze, bronze grating, utensils, and carrying poles',
    biblicalDescription:
      'Exodus 27:1–8 describes a hollow, square acacia-wood altar overlaid with bronze, positioned directly inside the eastern courtyard gate. Four horns projected from its upper corners as integral extensions of the frame, with a bronze network grating suspended midway inside and bronze rings holding carrying poles.',
    construction:
      'Built as a portable hollow box of shittim wood plated in thick bronze to withstand continuous fire. Halfway up inside hung a bronze mesh grating with four rings at its corners so ash fell beneath while sacrifices burned above. Priests used matching bronze pans, shovels, basins, fleshhooks, and firepans.',
    purpose:
      'First station upon entering the courtyard. Daily morning and evening burnt offerings, peace offerings, and sin/guilt offerings were presented here, with sacrificial blood applied to the altar\'s horns and base. Leviticus 6:13 commands that the fire upon this altar never go out.',
    otTextualBasis: ['Exodus 27:1–8', 'Exodus 38:1–7', 'Leviticus 6:12–13', 'Leviticus 17:11'],
    symbolism:
      'Embodies substitutionary atonement and divine justice meeting mercy: an innocent, unblemished victim bears the penalty of sin in place of the penitent offerer.',
    ntFulfillment:
      'Foreshadows the cross of Calvary, where Jesus offered Himself once for all as the spotless Lamb of God (John 1:29; 1 Peter 1:19). Hebrews 13:10 contrasts the Levitical altar service with the true Christian altar in Christ.',
    canonicalConnections: [
      {
        label: 'Life in the Blood & Remission',
        otRef: 'Leviticus 17:11',
        ntRef: 'Hebrews 9:22',
        epistemicNature: 'explicit_biblical',
        note: 'Hebrews 9:22 explicitly summarizes the Levitical sacrificial principle established at the altar: "without shedding of blood is no remission."',
        verseIds: ['LEV.17.11', 'HEB.9.22'],
      },
      {
        label: 'Unblemished Lamb Typology',
        otRef: 'Exodus 12:5; Isaiah 53:7',
        ntRef: 'John 1:29; 1 Peter 1:19',
        epistemicNature: 'explicit_biblical',
        note: 'New Testament witnesses explicitly identify Christ as the spotless Passover/burnt-offering Lamb.',
        verseIds: ['EXO.12.5', 'ISA.53.7', 'JHN.1.29', '1PE.1.19'],
      },
      {
        label: 'Altar of Sacrifice & Cross Parallel',
        otRef: 'Exodus 27:1–2; Leviticus 6:13',
        ntRef: 'Hebrews 13:10',
        epistemicNature: 'scholarly_interpretive',
        note: 'Typological reading connects the perpetual fire and bronze altar outside the tent with Christ\'s once-for-all sacrifice outside the gate.',
        verseIds: ['EXO.27.1', 'EXO.27.2', 'LEV.6.13', 'HEB.13.10'],
      },
    ],
    verseIds: ['EXO.27.1', 'EXO.27.2', 'LEV.6.13', 'LEV.17.11', 'JHN.1.29', 'HEB.9.22', 'HEB.13.10'],
  },
  {
    id: 'sanc-laver',
    order: 3,
    name: 'The Laver',
    hebrewTerm: 'Kiyyor Nechosheth (Bronze Basin)',
    kind: 'furnishing',
    compartment: 'Outer Court',
    dimensions: 'Dimensions not specified in the biblical text',
    material: 'Cast bronze basin and matching bronze pedestal (fashioned from the bronze mirrors of the serving women, Exod 38:8)',
    biblicalDescription:
      'Exodus 30:17–21 instructs Moses to construct a bronze laver with a bronze base ("foot") filled with water and placed between the Altar of Burnt Offering and the entrance to the tent of meeting. Exodus 38:8 notes its remarkable raw material: the polished bronze mirrors donated by the women who ministered at the door of the tabernacle.',
    construction:
      'Unlike the other vessels, Scripture gives no cubit dimensions for the laver. It consisted of an upper water basin resting securely upon a separate bronze pedestal so priests could draw clean water to wash hands and feet without immersing in or contaminating the reservoir.',
    purpose:
      'Mandatory ritual purification station. Before approaching the Altar of Burnt Offering to minister or entering the Holy Place, Aaron and his sons had to wash their hands and feet with water from the laver under penalty of death ("that they die not," Exod 30:20–21).',
    otTextualBasis: ['Exodus 30:17–21', 'Exodus 38:8', 'Exodus 40:30–32'],
    symbolism:
      'Represents spiritual cleansing, repentance, and daily renewal required after forgiveness has been received at the altar—washing the walk (feet) and service (hands) of the believer.',
    ntFulfillment:
      'Thematically linked in New Testament theology to baptism, the "washing of regeneration, and renewing of the Holy Ghost" (Titus 3:5), and sanctification through "the washing of water by the word" (Ephesians 5:26).',
    canonicalConnections: [
      {
        label: 'Washing of Regeneration & Renewal',
        otRef: 'Exodus 30:18–19',
        ntRef: 'Titus 3:5',
        epistemicNature: 'scholarly_interpretive',
        note: 'The priestly washing between sacrifice and sanctuary entry is commonly read typologically alongside Spirit-wrought regeneration and Christian baptism.',
        verseIds: ['EXO.30.18', 'EXO.30.19', 'TIT.3.5'],
      },
      {
        label: 'Cleansing by the Word',
        otRef: 'Exodus 30:18',
        ntRef: 'Ephesians 5:26',
        epistemicNature: 'scholarly_interpretive',
        note: 'Echoing the bronze mirrors from which the laver was forged, Paul pairs water-washing imagery with cleansing by the Word of God.',
        verseIds: ['EXO.30.18', 'EPH.5.26'],
      },
    ],
    verseIds: ['EXO.30.18', 'EXO.30.19', 'TIT.3.5', 'EPH.5.26'],
  },
  {
    id: 'sanc-holy-place',
    order: 4,
    name: 'The Holy Place',
    hebrewTerm: 'Ha-Qodesh (First Apartment)',
    kind: 'compartment',
    compartment: 'Holy Place',
    dimensions: '20 cubits long × 10 cubits wide × 10 cubits high',
    material: 'Acacia boards overlaid with gold, silver sockets, four-layered roof coverings, and a five-pillared eastern screen',
    biblicalDescription:
      'Exodus 26:15–37 and Hebrews 9:2, 6 describe the first interior room of the tabernacle tent. Entered from the east through a screen of blue, purple, and scarlet hung on five gold-overlaid pillars in bronze sockets, it occupied the eastern two-thirds of the thirty-cubit structure and housed the Candlestick (south), Table of Showbread (north), and Altar of Incense (west before the veil).',
    construction:
      'Framed by vertical acacia-wood boards standing ten cubits high and one-and-a-half cubits wide, overlaid in gold and anchored each in two silver sockets. Five gold-overlaid horizontal bars held the boards rigid. Four layered coverings draped overhead: inner cherubim-woven linen, goat hair, ram skins dyed red, and protective outer skins.',
    purpose:
      'Site of the continuous daily (tamid) priestly ministry. Priests entered every morning and evening to trim and light the lampstand, burn incense before the veil, and renew the twelve loaves of showbread each Sabbath.',
    otTextualBasis: ['Exodus 26:1–37', 'Exodus 40:22–27', 'Hebrews 9:2, 6'],
    symbolism:
      'Illustrates ongoing covenant fellowship and sustained mediation: redeemed believers live and worship continually in divine light, spiritual nourishment, and intercessory prayer.',
    ntFulfillment:
      'Hebrews 9:2, 6 explicitly describes the daily ministry of the first apartment as part of the earthly shadow contrasting with Christ\'s superior heavenly sanctuary ministry (Hebrews 8:1–2; 9:11–12).',
    canonicalConnections: [
      {
        label: 'Explicit Hebrews Inventory of the First Apartment',
        otRef: 'Exodus 26:33',
        ntRef: 'Hebrews 9:2, 6',
        epistemicNature: 'explicit_biblical',
        note: 'Hebrews 9 explicitly summarizes the furnishings and continuous daily priestly ministry of the first tabernacle apartment.',
        verseIds: ['EXO.26.33', 'HEB.9.2', 'HEB.9.6'],
      },
      {
        label: 'Heavenly Sanctuary Pattern',
        otRef: 'Exodus 25:8–9',
        ntRef: 'Hebrews 8:1–2, 5',
        epistemicNature: 'explicit_biblical',
        note: 'Hebrews 8:5 directly cites Exodus 25 to show that Moses built the tabernacle apartments after the heavenly pattern.',
        verseIds: ['EXO.25.8', 'EXO.25.9', 'HEB.8.1', 'HEB.8.2', 'HEB.8.5'],
      },
    ],
    verseIds: ['EXO.25.8', 'EXO.26.33', 'HEB.9.2', 'HEB.9.6', 'HEB.8.5'],
  },
  {
    id: 'sanc-candlestick',
    order: 5,
    name: 'The Candlestick',
    hebrewTerm: 'Menorah (Golden Lampstand)',
    kind: 'furnishing',
    compartment: 'Holy Place',
    dimensions: 'No linear cubit dimensions given; hammered from 1 talent (~34 kg) of pure gold',
    material: 'Single piece of beaten pure gold; seven detachable oil lamps fueled by pure beaten olive oil',
    biblicalDescription:
      'Exodus 25:31–40 commands a seven-branched lampstand hammered from a single talent of pure gold and placed on the south side of the Holy Place opposite the Table of Showbread. From a central shaft rose six curved branches—three on each side—all ornamented with almond-blossom cups, buds (knops), and open flowers.',
    construction:
      'No wood core was used; master craftsmen hammered the entire shaft, six branches, bowls, knops, and blossoms out of solid pure gold ("beaten work"). Seven individual lamps rested atop the central stem and six branches, tended with golden tongs (snuffers) and snuffdishes.',
    purpose:
      'Provided the sole illumination inside the windowless Holy Place. Priests dressed the wicks and refilled pure beaten olive oil every morning and evening so the seven lamps cast continuous light toward the Table of Showbread and Altar of Incense.',
    otTextualBasis: ['Exodus 25:31–40', 'Exodus 27:20–21', 'Exodus 37:17–24', 'Leviticus 24:2–4'],
    symbolism:
      'Unites sevenfold perfection, living almond-branch fruitfulness, and Spirit-empowered witness (cf. Zechariah 4:2–6): God\'s people shine only as supplied by the oil of the Spirit.',
    ntFulfillment:
      'Christ declares, "I am the light of the world" (John 8:12), while Revelation 1:12–20 and 4:5 explicitly adapt the seven golden lampstands and seven lamps of fire before God\'s throne to represent both the seven churches and the seven Spirits of God.',
    canonicalConnections: [
      {
        label: 'Seven Lamps & Seven Spirits Before the Throne',
        otRef: 'Exodus 25:37',
        ntRef: 'Revelation 1:12; 4:5',
        epistemicNature: 'explicit_biblical',
        note: 'Revelation explicitly adapts the golden seven-lamp imagery for Christ walking among the seven golden candlesticks and the seven lamps of fire before the throne.',
        verseIds: ['EXO.25.37', 'REV.1.12', 'REV.4.5'],
      },
      {
        label: 'The Light of the World',
        otRef: 'Exodus 25:31, 37',
        ntRef: 'John 8:12',
        epistemicNature: 'scholarly_interpretive',
        note: 'The pure gold lampstand illuminating the dark interior of the Holy Place is traditionally read as a type of Christ, the Light of the world.',
        verseIds: ['EXO.25.31', 'JHN.8.12'],
      },
    ],
    verseIds: ['EXO.25.31', 'EXO.25.37', 'JHN.8.12', 'REV.1.12', 'REV.4.5'],
  },
  {
    id: 'sanc-table-showbread',
    order: 6,
    name: 'The Table of Showbread',
    hebrewTerm: 'Shulchan Lechem ha-Panim (Bread of the Presence)',
    kind: 'furnishing',
    compartment: 'Holy Place',
    dimensions: '2 cubits long × 1 cubit wide × 1.5 cubits high',
    material: 'Acacia wood overlaid with pure gold, double gold crown molding, gold dishes/spoons/flagons/bowls, and 12 unleavened loaves',
    biblicalDescription:
      'Exodus 25:23–30 and Leviticus 24:5–9 describe an ornate gold-overlaid table stationed on the north side of the Holy Place. Surrounding its top stood a handbreadth border with golden crown moldings, and upon it were arranged twelve unleavened cakes of fine flour in two rows of six with pure frankincense placed beside each row.',
    construction:
      'Crafted of acacia wood covered in pure gold, supported on four legs fitted with golden rings for carrying poles. Accompanying vessels—dishes, spoons (incense cups), bowls, and flagons for drink offerings—were cast in pure gold.',
    purpose:
      'Maintained the "bread of the Presence" continually before the LORD. Every Sabbath morning, priests replaced the twelve loaves with fresh warm bread and burned the frankincense as a memorial portion, while Aaron and his sons ate the previous week\'s loaves in the holy place.',
    otTextualBasis: ['Exodus 25:23–30', 'Exodus 37:10–16', 'Leviticus 24:5–9'],
    symbolism:
      'Twelve loaves signify all twelve tribes of Israel held continually in covenant fellowship before God\'s face—acknowledging Him as daily provider and covenant host.',
    ntFulfillment:
      'Points to Jesus Christ, who declared, "I am the bread of life: he that cometh to me shall never hunger" (John 6:35), sustaining the entire covenant community by His Word and self-giving life.',
    canonicalConnections: [
      {
        label: 'Bread of the Presence & Bread of Life',
        otRef: 'Exodus 25:30; Leviticus 24:5',
        ntRef: 'John 6:35',
        epistemicNature: 'scholarly_interpretive',
        note: 'The twelve loaves kept continually before God\'s face anticipate Christ offering Himself as the living Bread sustaining believers.',
        verseIds: ['EXO.25.23', 'EXO.25.30', 'LEV.24.5', 'JHN.6.35'],
      },
      {
        label: 'Tabernacle Inventory in Hebrews',
        otRef: 'Exodus 25:23, 30',
        ntRef: 'Hebrews 9:2',
        epistemicNature: 'explicit_biblical',
        note: 'Hebrews 9:2 explicitly lists "the table, and the shewbread" as central fixtures of the first apartment.',
        verseIds: ['EXO.25.30', 'HEB.9.2'],
      },
    ],
    verseIds: ['EXO.25.23', 'EXO.25.30', 'LEV.24.5', 'JHN.6.35', 'HEB.9.2'],
  },
  {
    id: 'sanc-altar-incense',
    order: 7,
    name: 'The Altar of Incense',
    hebrewTerm: 'Mizbeach ha-Qetoret (Golden Altar)',
    kind: 'furnishing',
    compartment: 'Holy Place',
    dimensions: '1 cubit long × 1 cubit wide × 2 cubits high (foursquare)',
    material: 'Acacia wood overlaid with pure gold, four golden horns, golden crown molding, and sacred compounded incense',
    biblicalDescription:
      'Exodus 30:1–10 and 37:25–28 describe a tall, slender square altar overlaid with pure gold, positioned in the center of the Holy Place immediately in front of the Veil that concealed the Ark of the Covenant. It featured four integral golden horns at the corners and an encircling golden crown rim.',
    construction:
      'Constructed of acacia wood plated completely in pure gold, with two golden rings beneath the crown on opposite sides for acacia-and-gold carrying poles. Only the uniquely formulated sweet incense (stacte, onycha, galbanum, and pure frankincense, Exod 30:34–38) could be burned upon it using live coals from the Brazen Altar.',
    purpose:
      'Every morning and evening—at the exact hours when the lamps were trimmed and lit—the priest burned sweet incense upon this altar so a fragrant cloud rose before the Veil. Once a year on the Day of Atonement, its horns were touched with atoning blood (Exod 30:10).',
    otTextualBasis: ['Exodus 30:1–10', 'Exodus 30:34–38', 'Exodus 37:25–28', 'Psalm 141:2'],
    symbolism:
      'Explicitly linked in Scripture itself to prayer ascending to God (Psalm 141:2), rendered acceptable through the merits and intercession of the priest standing directly before the throne.',
    ntFulfillment:
      'Hebrews 7:25 and Romans 8:34 reveal Christ ever living to make intercession before God, while Revelation 8:3–4 portrays an angel standing at the golden altar before the throne offering much incense with the prayers of all saints.',
    canonicalConnections: [
      {
        label: 'Prayer Rising as Incense at the Golden Altar',
        otRef: 'Exodus 30:1, 7; Psalm 141:2',
        ntRef: 'Revelation 8:3',
        epistemicNature: 'explicit_biblical',
        note: 'Psalm 141:2 and Revelation 8:3 explicitly identify ascending sanctuary incense with the prayers of God\'s saints offered on the golden altar before the throne.',
        verseIds: ['EXO.30.1', 'EXO.30.7', 'PSA.141.2', 'REV.8.3'],
      },
      {
        label: 'Perpetual High Priestly Intercession',
        otRef: 'Exodus 30:7',
        ntRef: 'Hebrews 7:25; Romans 8:34',
        epistemicNature: 'scholarly_interpretive',
        note: 'Continuous morning-and-evening incense directly before the veil mirrors Christ\'s uninterrupted intercessory ministry on behalf of believers.',
        verseIds: ['EXO.30.7', 'HEB.7.25', 'ROM.8.34'],
      },
    ],
    verseIds: ['EXO.30.1', 'EXO.30.7', 'PSA.141.2', 'REV.8.3', 'HEB.7.25'],
  },
  {
    id: 'sanc-veil',
    order: 8,
    name: 'The Veil of Partition',
    hebrewTerm: 'Parokhet (Inner Dividing Curtain)',
    kind: 'boundary',
    compartment: 'Holy Place',
    dimensions: '10 cubits wide × 10 cubits high (spanning the interior width)',
    material: 'Blue, purple, and scarlet yarn woven with fine twined white linen and embroidered cherubim, hung on 4 gold-overlaid pillars in silver sockets',
    biblicalDescription:
      'Exodus 26:31–33 commands a thick inner curtain woven of blue, purple, and scarlet on fine twined linen, artistically embroidered with cherubim. Suspended by golden clasps (taches) beneath the roof seam upon four gold-overlaid acacia pillars set in silver sockets, it formed the partition dividing the Holy Place from the Most Holy Place.',
    construction:
      'Woven by skilled artisans with cherubim figures—recalling the guardians of Eden\'s presence—and mounted directly beneath the golden clasps joining the two halves of the inner tabernacle ceiling curtains.',
    purpose:
      'Guarded the sanctity of God\'s immediate presence in the Most Holy Place. No ordinary priest could pass beyond it; only the high priest entered within the veil once each year on the Day of Atonement bearing sacrificial blood and burning incense (Lev 16:2, 12–15).',
    otTextualBasis: ['Exodus 26:31–33', 'Leviticus 16:2, 12–15', '2 Chronicles 3:14'],
    symbolism:
      'Marked both the holiness of God\'s throne and the provisional, unfinished barrier of the Levitical covenant while the first tabernacle stood (Hebrews 9:8).',
    ntFulfillment:
      'At Jesus\' death on the cross, the temple veil was torn in two from top to bottom (Matthew 27:51). Hebrews 10:19–20 explicitly identifies the veil with Christ\'s flesh, opening "a new and living way" of bold access into the holiest.',
    canonicalConnections: [
      {
        label: 'Veil Torn at Calvary & Living Way Through Christ\'s Flesh',
        otRef: 'Exodus 26:33; Leviticus 16:15',
        ntRef: 'Matthew 27:51; Hebrews 10:19–20',
        epistemicNature: 'explicit_biblical',
        note: 'Hebrews 10:20 explicitly interprets the sanctuary veil as Christ\'s flesh, opened so believers may enter the holiest by His blood.',
        verseIds: ['EXO.26.33', 'LEV.16.15', 'MAT.27.51', 'HEB.10.19', 'HEB.10.20'],
      },
    ],
    verseIds: ['EXO.26.33', 'LEV.16.15', 'MAT.27.51', 'HEB.10.19', 'HEB.10.20'],
  },
  {
    id: 'sanc-most-holy-place',
    order: 9,
    name: 'The Most Holy Place',
    hebrewTerm: 'Qodesh Haqqodashim (Holiest of All)',
    kind: 'compartment',
    compartment: 'Most Holy Place',
    dimensions: '10 cubits long × 10 cubits wide × 10 cubits high (a perfect cube)',
    material: 'Acacia boards overlaid with pure gold, resting in silver sockets, enclosed behind the inner cherubim veil',
    biblicalDescription:
      'Exodus 26:33–34 and Hebrews 9:3, 7 describe the innermost chamber behind the second veil—a perfect ten-cubit cube housing only the Ark of the Covenant and its Mercy Seat. No lampstand illuminated it; the glory of the LORD (the Shekinah cloud) dwelt above the Mercy Seat between the cherubim.',
    construction:
      'Formed the western third of the tabernacle tent: twenty gold-overlaid boards along the western rear and sides, veiled from the Holy Place on its eastern boundary. Its cubic symmetry later reappeared enlarged in Solomon\'s twenty-cubit inner oracle (1 Kgs 6:20) and Jerusalem\'s apocalyptic cube (Rev 21:16).',
    purpose:
      'Earthly seat of God\'s enthroned presence among Israel. Sealed throughout the year, it was entered solely by the high priest on the Day of Atonement (Yom Kippur) to sprinkle blood of the bullock and sin-offering goat upon and before the Mercy Seat, cleansing the sanctuary and people (Lev 16:15–16, 30).',
    otTextualBasis: ['Exodus 26:33–34', 'Leviticus 16:2–17, 30', 'Daniel 8:14'],
    symbolism:
      'Represents the immediate throne room of God\'s holiness, justice, and ultimate Day of Atonement vindication—the goal toward which the entire sanctuary system moves.',
    ntFulfillment:
      'Hebrews 9:3, 7, 12, 24 declares that Christ did not enter an earthly holy place made with hands, "but into heaven itself, now to appear in the presence of God for us," obtaining eternal redemption by His own blood.',
    canonicalConnections: [
      {
        label: 'Day of Atonement Entry vs. Christ in Heaven Itself',
        otRef: 'Leviticus 16:15, 30',
        ntRef: 'Hebrews 9:3, 7, 12, 24',
        epistemicNature: 'explicit_biblical',
        note: 'Hebrews 9 explicitly contrasts the annual blood entry into the earthly Most Holy Place with Christ\'s once-for-all entry into heaven itself.',
        verseIds: ['EXO.26.34', 'LEV.16.15', 'HEB.9.3', 'HEB.9.7', 'HEB.9.12', 'HEB.9.24'],
      },
      {
        label: 'Cleansing of the Sanctuary & Heavenly Court',
        otRef: 'Daniel 7:9–10; 8:14',
        ntRef: 'Revelation 11:19; 21:3',
        epistemicNature: 'scholarly_interpretive',
        note: 'Daniel\'s apocalyptic sanctuary cleansing and Revelation\'s opened heavenly temple echo the Most Holy Place and Day of Atonement culmination.',
        verseIds: ['DAN.7.9', 'DAN.8.14', 'REV.11.19', 'REV.21.3'],
      },
    ],
    verseIds: ['EXO.26.34', 'LEV.16.15', 'LEV.16.30', 'HEB.9.3', 'HEB.9.7', 'HEB.9.24', 'REV.21.3'],
  },
  {
    id: 'sanc-ark-covenant',
    order: 10,
    name: 'The Ark of the Covenant',
    hebrewTerm: 'Aron ha-Berit & Kapporet (Ark & Mercy Seat)',
    kind: 'furnishing',
    compartment: 'Most Holy Place',
    dimensions: '2.5 cubits long × 1.5 cubits wide × 1.5 cubits high',
    material: 'Acacia chest overlaid inside and out with pure gold; solid gold Mercy Seat lid with two beaten-gold winged cherubim',
    biblicalDescription:
      'Exodus 25:10–22 and Hebrews 9:4 describe the supreme sacred artifact inside the Most Holy Place: a gold-plated acacia chest crowned with a golden molding and covered by a solid pure-gold lid—the Mercy Seat (kapporet)—out of whose two ends two golden cherubim stretched their wings over the lid, facing one another and looking downward.',
    construction:
      'Overlaid with pure gold both interiorly and exteriorly, equipped with four cast gold rings near its base through which acacia-and-gold poles remained permanently inserted (Exod 25:14–15). Inside the ark rested the two stone tablets of the Decalogue (the Testimony), alongside the golden pot of manna and Aaron\'s budded rod (Heb 9:4).',
    purpose:
      'Served as God\'s covenant throne and footstool ("there I will meet with thee, and I will commune with thee from above the mercy seat," Exod 25:22). On the Day of Atonement, sacrificial blood was sprinkled directly upon and before the Mercy Seat above the broken law inside.',
    otTextualBasis: ['Exodus 25:10–22', 'Leviticus 16:14–15', '1 Kings 8:6–9'],
    symbolism:
      'Unites the moral permanence of God\'s law (inside the ark) with the covering grace of atoning blood (above on the Mercy Seat): righteousness and mercy kiss in God\'s governance.',
    ntFulfillment:
      'Romans 3:25 applies the Septuagint word for the Mercy Seat (hilastērion, "propitiation") directly to Christ through faith in His blood; Hebrews 4:16 invites believers boldly to the "throne of grace," and Revelation 11:19 reveals the ark of His testament in the opened heavenly temple.',
    canonicalConnections: [
      {
        label: 'The Ark Inventory & Heavenly Temple Vision',
        otRef: 'Exodus 25:10, 16, 22',
        ntRef: 'Hebrews 9:4; Revelation 11:19',
        epistemicNature: 'explicit_biblical',
        note: 'Hebrews 9:4 explicitly inventories the Ark\'s contents, and Revelation 11:19 unveils the ark of God\'s testament inside the heavenly temple.',
        verseIds: ['EXO.25.10', 'EXO.25.16', 'HEB.9.4', 'REV.11.19'],
      },
      {
        label: 'Christ as Mercy Seat (Hilasterion) & Throne of Grace',
        otRef: 'Exodus 25:17, 22; Leviticus 16:15',
        ntRef: 'Romans 3:25; Hebrews 4:16',
        epistemicNature: 'scholarly_interpretive',
        note: 'Paul\'s use of hilastērion (the LXX term for kapporet / Mercy Seat) in Romans 3:25 identifies Christ\'s blood-bought atonement as the antitypical meeting place of divine justice and mercy.',
        verseIds: ['EXO.25.17', 'EXO.25.22', 'ROM.3.25', 'HEB.4.16'],
      },
    ],
    verseIds: ['EXO.25.10', 'EXO.25.16', 'EXO.25.17', 'EXO.25.22', 'HEB.9.4', 'ROM.3.25', 'HEB.4.16', 'REV.11.19'],
  },
];
