import { VerseId } from '../types/scripture';

export interface BeliefSubsection {
  label: string;
  summary: string;
  verseIds: VerseId[];
}

export interface FundamentalBeliefChapter {
  id: string;
  kind: 'preface' | 'chapter' | 'conclusion';
  order: number;
  numeral: string;
  title: string;
  pageRange: string;
  category:
    | 'Foundations'
    | 'Law & Sabbath'
    | 'Origins & Redemption'
    | 'Church & Ordinances'
    | 'Sanctuary & Prophecy'
    | 'Christian Living'
    | 'Last Things';
  biblicalSummary: string;
  doctrinalNotes: string;
  subsections: BeliefSubsection[];
  keyVerseIds: VerseId[];
  studyQuestions: string[];
  relatedThemeId?: string;
  relatedSanctuaryId?: string;
  relatedEventId?: string;
}

export const FUNDAMENTAL_BELIEFS_META = {
  title: 'Fundamental Christian Beliefs of the Seventh Day Adventist Reform Movement',
  publicationYear: '2006',
  publisher: 'Seventh Day Adventist Reform Movement General Conference · Reformation Herald Publishing Association',
  translationUsed: 'King James Version (KJV)',
  totalPages: 146,
  pdfUrl: '/assets/aistudio/beliefs_397d75b7.pdf',
};

export const FUNDAMENTAL_BELIEF_SECTIONS: FundamentalBeliefChapter[] = [
  {
    id: 'preface',
    kind: 'preface',
    order: 0,
    numeral: 'Preface',
    title: 'Historical Context & Sole Rule of Faith',
    pageRange: 'pp. 6–9',
    category: 'Foundations',
    biblicalSummary:
      'God revealed Christ as the true Light entering the world and called a commandment-keeping people holding the faith of Jesus and resting solely upon "Thus saith the Lord."',
    doctrinalNotes:
      'Traces the lineage of reformation—from the 16th-century Reformation, the 1844 Advent movement, and the 1888 message of Christ Our Righteousness, to the faithful stand against military combat during 1914–1918 and the 1925 SDARM organization. Frames the Bible as the sole rule of faith and Spirit of Prophecy writings as a lesser light leading back to Scripture.',
    subsections: [
      {
        label: 'Reformation Heritage & Remnant Identity',
        summary:
          'God has preserved a faithful witness through periods of compromise, calling believers to keep His commandments and the faith of Jesus.',
        verseIds: ['JHN.1.9', 'REV.14.12', 'ACT.3.19', 'REV.3.18'],
      },
      {
        label: 'Scripture Tested & Confirmed',
        summary:
          'All teaching must be tested by the Law and the Testimony, equipping believers to give a reason for their hope with meekness and fear.',
        verseIds: ['ISA.8.20', '1PE.3.15', '2PE.1.4', 'ACT.2.17'],
      },
    ],
    keyVerseIds: ['JHN.1.9', 'REV.14.12', 'ISA.8.20', '1PE.3.15', 'ACT.3.19', 'REV.3.18', '2PE.1.4'],
    studyQuestions: [
      'Why does Isaiah 8:20 establish "the law and to the testimony" as the test of every religious teaching?',
      'How do the "commandments of God" and the "faith of Jesus" belong together in Revelation 14:12?',
    ],
    relatedThemeId: 'theme-faith',
  },
  {
    id: 'ch-1',
    kind: 'chapter',
    order: 1,
    numeral: 'I',
    title: 'The Godhead',
    pageRange: 'pp. 10–22',
    category: 'Foundations',
    biblicalSummary:
      'There is one eternal, omnipotent, omniscient, omnipresent God—united as Father, Son, and Holy Spirit—manifested in creation, incarnation, atonement, and ongoing intercession.',
    doctrinalNotes:
      'Presents the attributes of the Godhead alongside three distinct sections: (A) The Father as Sovereign Fountain of being; (B) The Son in His dual divine-human nature, eternally pre-existent, tempted in all points yet sinless, and ministering as High Priest; and (C) The Holy Spirit as a divine Person dwelling in, teaching, and resurrecting believers.',
    subsections: [
      {
        label: 'A. The Father & Attributes of Deity',
        summary:
          'One eternal God possessing omniscience, omnipotence, and infinite love, yet known in threefold manifestation at Creation and Baptism.',
        verseIds: ['DEU.6.4', 'ISA.44.6', 'GEN.1.1', 'GEN.1.26', 'MAT.28.19', '2CO.13.14'],
      },
      {
        label: 'B. The Son — Dual Nature & Intercession',
        summary:
          'From everlasting as divine Word and brightness of the Father’s glory, Christ took true human nature, overcame all temptation without sin, died for our transgressions, and now intercedes in heaven.',
        verseIds: ['JHN.1.1', 'MIC.5.2', 'HEB.1.3', 'PHP.2.7', 'ISA.53.5', 'HEB.4.15', 'HEB.9.24'],
      },
      {
        label: 'C. The Holy Spirit — Personality & Power',
        summary:
          'The Spirit is the promised Comforter who convicts of sin, inspires Scripture, helps believers pray, and empowers resurrection life.',
        verseIds: ['JHN.14.16', 'JHN.16.8', 'ROM.8.26', 'ROM.8.11', 'DEU.29.29'],
      },
    ],
    keyVerseIds: [
      'DEU.6.4',
      'GEN.1.26',
      'MAT.28.19',
      '2CO.13.14',
      'JHN.1.1',
      'JHN.3.16',
      'HEB.1.3',
      'PHP.2.7',
      'HEB.4.15',
      'HEB.9.24',
      'JHN.14.16',
      'ROM.8.26',
    ],
    studyQuestions: [
      'How do Deuteronomy 6:4 and Matthew 28:19 work together in describing the unity and threefold revelation of the Godhead?',
      'Why was it essential for Christ to possess both true divinity (John 1:1) and true humanity (Hebrews 4:15)?',
      'What personal actions does Scripture attribute to the Holy Spirit in John 14–16 and Romans 8?',
    ],
    relatedThemeId: 'theme-creation',
  },
  {
    id: 'ch-2',
    kind: 'chapter',
    order: 2,
    numeral: 'II',
    title: 'The Holy Scriptures',
    pageRange: 'pp. 23–24',
    category: 'Foundations',
    biblicalSummary:
      'All Scripture is given by inspiration of God through holy men moved by the Holy Ghost, serving as an infallible, self-interpreting lamp and standard of truth.',
    doctrinalNotes:
      'Affirms that Old and New Testaments together form God’s complete, authoritative revelation—never subject to private human speculation, and given to make every believer wise unto salvation.',
    subsections: [
      {
        label: 'Divine Inspiration & Authority',
        summary:
          'Prophecy came not by human will; holy writers spoke as moved by the Holy Spirit, giving a sure word of light.',
        verseIds: ['2TI.3.16', '2PE.1.19', '2PE.1.21', 'ISA.8.20'],
      },
      {
        label: 'Sufficiency for Salvation & Guidance',
        summary:
          'Searching Scripture diligently leads to Christ, truth, sanctification, and daily spiritual nourishment.',
        verseIds: ['JHN.5.39', 'PSA.119.105', 'ACT.17.11', 'JHN.17.17', 'MAT.4.4'],
      },
    ],
    keyVerseIds: ['2TI.3.15', '2TI.3.16', '2PE.1.19', '2PE.1.21', 'JHN.5.39', 'PSA.119.105', 'ACT.17.11', 'JHN.17.17'],
    studyQuestions: [
      'What four purposes does Paul assign to inspired Scripture in 2 Timothy 3:16?',
      'How did the Bereans (Acts 17:11) model Scripture-first discernment?',
    ],
    relatedThemeId: 'theme-faith',
  },
  {
    id: 'ch-3',
    kind: 'chapter',
    order: 3,
    numeral: 'III',
    title: 'Divine Laws',
    pageRange: 'pp. 25–29',
    category: 'Law & Sabbath',
    biblicalSummary:
      'Scripture distinguishes between God’s eternal Moral Law—spoken at Sinai and written on two tables of stone—and the temporary Ceremonial Law of sacrifices and yearly feasts nailed to the cross.',
    doctrinalNotes:
      'Explains (A) the Moral Law (Ten Commandments) as the unchangeable transcript of God’s righteous character, upheld by Christ, internalized in the New Covenant, and serving as the standard of judgment; and (B) the Ceremonial Law of Levitical shadows, fulfilled in Christ’s single sacrifice.',
    subsections: [
      {
        label: 'A. The Moral Law (Ten Commandments)',
        summary:
          'Written by God’s own finger, summarized in love to God and neighbor, magnified by Christ, and inscribed upon the heart in the New Covenant.',
        verseIds: ['EXO.20.1', 'EXO.31.18', 'MAT.5.17', 'MAT.22.36', 'ROM.7.12', '1JN.3.4', 'JER.31.33', 'JAS.2.12'],
      },
      {
        label: 'B. The Ceremonial Law Abolished at Calvary',
        summary:
          'Animal sacrifices, meat/drink offerings, and Levitical shadow-ordinances pointed forward to Christ and ended at His cross.',
        verseIds: ['EPH.2.15', 'COL.2.14', 'HEB.10.1', 'DAN.9.27'],
      },
    ],
    keyVerseIds: [
      'EXO.20.1',
      'EXO.31.18',
      'MAT.5.17',
      'MAT.22.36',
      'ROM.7.12',
      '1JN.3.4',
      'JER.31.33',
      'ECC.12.13',
      'JAS.2.12',
      'EPH.2.15',
      'COL.2.14',
      'HEB.10.1',
    ],
    studyQuestions: [
      'What textual contrasts distinguish the Ten Commandments (Exodus 31:18) from the Mosaic ordinance book (Colossians 2:14)?',
      'How does Paul reconcile justification by faith with upholding the law in Romans 3:20–31 and 7:12?',
    ],
    relatedThemeId: 'theme-covenant',
    relatedEventId: 'evt-exodus-sinai',
  },
  {
    id: 'ch-4',
    kind: 'chapter',
    order: 4,
    numeral: 'IV',
    title: 'The Sabbath',
    pageRange: 'pp. 30–40',
    category: 'Law & Sabbath',
    biblicalSummary:
      'God blessed and sanctified the seventh day at Creation before sin entered, commanded its observance in the heart of the Decalogue, kept it through Christ and the apostles, and promises it in the New Earth.',
    doctrinalNotes:
      'Details the Sabbath as a perpetual sign of Creation, covenant relationship, deliverance, and sanctification; covers Friday preparation from sunset to sunset, works of necessity and mercy vs. secular labor, and the distinction between the weekly seventh-day Sabbath and Levitical annual sabbaths.',
    subsections: [
      {
        label: 'Edenic Institution & Fourth Commandment',
        summary:
          'Rooted in God’s seventh-day rest at Creation and codified at Sinai as the memorial of the Creator.',
        verseIds: ['GEN.2.1', 'GEN.2.3', 'EXO.20.8', 'EXO.31.16', 'EXO.31.17', 'DEU.5.15'],
      },
      {
        label: 'Example of Christ, the Apostles & Future Eternity',
        summary:
          'Jesus declared Himself Lord of the Sabbath, kept it by custom, expected its observance after His ascension, and Isaiah affirms its eternal celebration.',
        verseIds: ['MRK.2.27', 'MRK.2.28', 'LUK.4.16', 'MAT.24.20', 'LUK.23.56', 'ACT.17.2', 'ISA.66.23'],
      },
      {
        label: 'Delightful Observance & Distinction from Yearly Sabbaths',
        summary:
          'Calling the Sabbath a delight honors God’s holy day from evening to evening, distinct from the ceremonial sabbaths of Leviticus 23.',
        verseIds: ['ISA.58.13', 'EZK.20.12', 'EZK.20.20', 'LEV.23.38', 'COL.2.16'],
      },
    ],
    keyVerseIds: [
      'GEN.2.2',
      'GEN.2.3',
      'EXO.20.8',
      'EXO.31.17',
      'EZK.20.12',
      'EZK.20.20',
      'ISA.58.13',
      'ISA.66.23',
      'MRK.2.27',
      'LUK.4.16',
      'LUK.23.56',
      'ACT.17.2',
      'LEV.23.38',
      'COL.2.16',
    ],
    studyQuestions: [
      'Why does Exodus 20:8–11 base Sabbath rest on Genesis 2:1–3 rather than solely on Israel’s history?',
      'How did Jesus demonstrate proper Sabbath-keeping in Luke 4:16 and Mark 2:27–28?',
    ],
    relatedThemeId: 'theme-creation',
    relatedEventId: 'evt-creation',
  },
  {
    id: 'ch-5',
    kind: 'chapter',
    order: 5,
    numeral: 'V',
    title: 'Origin of Evil and the Fall of Lucifer',
    pageRange: 'pp. 41–43',
    category: 'Origins & Redemption',
    biblicalSummary:
      'God created moral beings with free choice; sin originated not from God, but in heaven when Lucifer yielded to pride, rebelled, was cast out, and deceived humanity—yet his defeat was sealed at Calvary.',
    doctrinalNotes:
      'Explains why a loving God permitted free moral agency, traces Satan’s fall in Ezekiel 28, Isaiah 14, and Revelation 12, highlights the Genesis 3:15 promise of the crushed serpent, and points to the millennial binding and final eradication of evil.',
    subsections: [
      {
        label: 'Love, Moral Freedom & Rebellion in Heaven',
        summary:
          'Created as an anointed covering cherub perfect in his ways, Lucifer fell through self-exaltation and waged war in heaven.',
        verseIds: ['1JN.4.16', 'DEU.30.19', 'EZK.28.13', 'ISA.14.12', 'REV.12.7', 'REV.12.9'],
      },
      {
        label: 'Victory at the Cross & End of Sin',
        summary:
          'Through death Christ destroyed him who had the power of death, securing Satan’s millennial restraint and final destruction.',
        verseIds: ['JHN.8.44', 'GEN.3.15', 'HEB.2.14', 'REV.20.1', 'MAL.4.1'],
      },
    ],
    keyVerseIds: ['EZK.28.13', 'ISA.14.12', 'REV.12.7', 'REV.12.9', 'JHN.8.44', 'GEN.3.15', 'HEB.2.14', 'REV.20.1', 'MAL.4.1'],
    studyQuestions: [
      'How do Ezekiel 28:13–17 and Isaiah 14:12–14 portray the mysterious emergence of pride in an unfallen universe?',
      'How does Hebrews 2:14 explain the cross as the decisive triumph over the devil?',
    ],
    relatedEventId: 'evt-promise-eden',
  },
  {
    id: 'ch-6',
    kind: 'chapter',
    order: 6,
    numeral: 'VI',
    title: 'Creation',
    pageRange: 'pp. 44–45',
    category: 'Origins & Redemption',
    biblicalSummary:
      'By His spoken word through Christ, God created the heavens, the earth, and all living forms in six literal days, resting on the seventh and sustaining all things by His power.',
    doctrinalNotes:
      'Emphasizes creation ex nihilo by divine fiat rather than random evolution, noting that observable design throughout nature reveals God’s eternal power and Godhead.',
    subsections: [
      {
        label: 'Six Literal Days by the Word of the LORD',
        summary:
          'God spoke and it stood fast, declaring the completed creation "very good" on the sixth day and sealing the week on the seventh.',
        verseIds: ['GEN.1.1', 'GEN.1.31', 'GEN.2.1', 'PSA.33.6', 'EXO.20.11'],
      },
      {
        label: 'Christ the Creator & Witness of Nature',
        summary:
          'All things were created by and for Christ, leaving humanity without excuse before the visible handiwork of heaven.',
        verseIds: ['COL.1.16', 'HEB.11.3', 'PSA.19.1', 'ROM.1.20', 'ISA.45.18'],
      },
    ],
    keyVerseIds: ['GEN.1.1', 'GEN.1.31', 'GEN.2.1', 'PSA.33.6', 'PSA.19.1', 'ROM.1.20', 'HEB.11.3', 'COL.1.16', 'EXO.20.11', 'ISA.45.18'],
    studyQuestions: [
      'What connection do Colossians 1:16 and Hebrews 1:2–3 draw between Jesus Christ and Genesis 1?',
      'How does Psalm 33:6–9 characterize the manner and speed of creation?',
    ],
    relatedThemeId: 'theme-creation',
    relatedEventId: 'evt-creation',
  },
  {
    id: 'ch-7',
    kind: 'chapter',
    order: 7,
    numeral: 'VII',
    title: 'The Plan of Redemption',
    pageRange: 'pp. 46–55',
    category: 'Origins & Redemption',
    biblicalSummary:
      'Conceived before the foundation of the world and revealed in Eden, salvation is God’s free gift of grace in Christ, received through faith that justifies (imputed righteousness) and transforms character (imparted righteousness).',
    doctrinalNotes:
      'Unfolds five core themes: (A) Grace, Faith, and Works—salvation by grace alone bearing living obedience; (B) Justification and Sanctification; (C) Humanity’s response of repentance, confession, and surrender; (D) Christian perfection in Christ; and (E) Urgent readiness today with no second probation after death or the close of mercy.',
    subsections: [
      {
        label: 'A. Grace, Faith & Living Obedience',
        summary:
          'Eternal life is the gift of God through faith, yet saving faith always works through love rather than dead profession.',
        verseIds: ['EPH.2.8', 'ROM.6.23', 'JAS.2.20', 'GAL.2.20'],
      },
      {
        label: 'B. Justification & Sanctification',
        summary:
          'God pardons and justifies the repentant believer by Christ’s righteousness and progressively renews them into His image by the Spirit.',
        verseIds: ['ROM.3.23', 'ROM.5.1', '1JN.1.9', '2CO.5.19', '1TH.4.3', '2CO.3.18'],
      },
      {
        label: 'C–E. Repentance, Perfection & Present Urgency',
        summary:
          'Believers strive to enter the strait gate now, growing toward maturity in Christ before probation closes.',
        verseIds: ['JHN.3.16', 'MAT.5.48', 'LUK.13.24', 'REV.22.11'],
      },
    ],
    keyVerseIds: [
      'GEN.3.15',
      'JHN.3.16',
      'ROM.3.23',
      'ROM.5.1',
      'ROM.5.12',
      'ROM.6.23',
      'EPH.2.8',
      '1JN.1.9',
      '2CO.5.19',
      'GAL.2.20',
      'JAS.2.20',
      '1TH.4.3',
      '2CO.3.18',
      'MAT.5.48',
      'REV.22.11',
    ],
    studyQuestions: [
      'How do Romans 5:1 and 2 Corinthians 3:18 distinguish forgiveness (justification) from ongoing inward transformation (sanctification)?',
      'Why does James 2:17–22 argue that genuine saving faith naturally produces obedience?',
    ],
    relatedThemeId: 'theme-redemption',
  },
  {
    id: 'ch-8',
    kind: 'chapter',
    order: 8,
    numeral: 'VIII',
    title: 'Baptism',
    pageRange: 'pp. 56–59',
    category: 'Church & Ordinances',
    biblicalSummary:
      'Christian baptism is full immersion in water in the name of the Father, Son, and Holy Spirit following instruction, repentance, and personal faith—symbolizing death, burial, and resurrection with Christ.',
    doctrinalNotes:
      'Teaches believer’s baptism by immersion (excluding infant sprinkling), entry into Christ’s visible church body, and biblical grounds for rebaptism when a believer walks into fuller light or true conversion as in Acts 19:1–5.',
    subsections: [
      {
        label: 'Immersion After Repentance & Teaching',
        summary:
          'Christ’s baptism in the Jordan, the Great Commission, and Philip’s baptism of the Ethiopian eunuch establish teaching and immersion in water.',
        verseIds: ['MAT.3.16', 'MAT.28.19', 'MRK.16.16', 'ACT.2.38', 'ACT.8.38'],
      },
      {
        label: 'Buried with Christ, Union & Rebaptism',
        summary:
          'Immersion depicts burial to sin and walking in newness of life; believers receiving further gospel truth may be baptized anew.',
        verseIds: ['ROM.6.3', 'COL.2.12', 'EPH.4.5', '1PE.3.21', 'ACT.19.1'],
      },
    ],
    keyVerseIds: ['MAT.3.16', 'MAT.28.19', 'MRK.16.16', 'ACT.2.38', 'ACT.8.38', 'ROM.6.3', 'COL.2.12', 'EPH.4.5', '1PE.3.21', 'ACT.19.1'],
    studyQuestions: [
      'What prerequisite steps precede baptism in Matthew 28:19–20 and Acts 2:38?',
      'Why does Paul compare baptism to burial and resurrection in Romans 6:3–4?',
    ],
  },
  {
    id: 'ch-9',
    kind: 'chapter',
    order: 9,
    numeral: 'IX',
    title: 'The Communion Service',
    pageRange: 'pp. 60–63',
    category: 'Church & Ordinances',
    biblicalSummary:
      'Christ instituted the ordinance of feet washing (humility and spiritual cleansing) together with the Lord’s Supper—using unleavened bread and unfermented grape juice to proclaim His death until He comes.',
    doctrinalNotes:
      'Covers (A) Feet Washing as Christ’s literal example of humble mutual service and peace before communion; and (B) the Lord’s Supper with unfermented emblems symbolizing His broken body and shed blood, practiced among baptized believers examining their hearts.',
    subsections: [
      {
        label: 'A. The Ordinance of Humility (Feet Washing)',
        summary:
          'Jesus washed the disciples’ feet at the Last Supper and commanded His followers to do as He had done.',
        verseIds: ['JHN.13.1', 'JHN.13.14'],
      },
      {
        label: 'B. The Lord’s Supper Emblems & Hope',
        summary:
          'Unleavened bread and pure fruit of the vine commemorate Christ’s cross and anticipate drinking it anew in the kingdom.',
        verseIds: ['MAT.26.26', '1CO.11.23', '1CO.11.26', '1CO.5.7', '1CO.10.16'],
      },
    ],
    keyVerseIds: ['JHN.13.1', 'JHN.13.14', 'MAT.26.26', '1CO.11.23', '1CO.11.26', '1CO.5.7', '1CO.10.16', 'JHN.6.53'],
    studyQuestions: [
      'Why did Jesus join the washing of feet directly to the Supper in John 13:1–17?',
      'How does 1 Corinthians 11:26 connect the Communion table to both the cross and the Second Coming?',
    ],
    relatedThemeId: 'theme-sacrifice',
  },
  {
    id: 'ch-10',
    kind: 'chapter',
    order: 10,
    numeral: 'X',
    title: 'The Sanctuary',
    pageRange: 'pp. 64–66',
    category: 'Sanctuary & Prophecy',
    biblicalSummary:
      'Moses constructed the earthly tabernacle after the heavenly pattern so God’s way of redemption could be seen in type: Christ ascended as High Priest in the true heavenly sanctuary and entered the Most Holy Place phase of judgment at the end of the 2,300 prophetic days.',
    doctrinalNotes:
      'Connects the earthly Court, Holy Place, and Most Holy Place services (Leviticus 16) with Christ’s heavenly ministry in Hebrews 8–9 and Daniel 8:14 / 7:9–10—presenting the 1844 cleansing of the heavenly sanctuary (pre-advent investigative judgment) and the final disposition of sin upon the scapegoat.',
    subsections: [
      {
        label: 'Earthly Pattern & Heavenly Reality',
        summary:
          'The wilderness sanctuary revealed God’s way in figure; Christ ministers as our High Priest in the true tabernacle pitched by the Lord.',
        verseIds: ['EXO.25.8', 'PSA.77.13', 'HEB.8.1', 'HEB.9.24'],
      },
      {
        label: '2,300 Days, Cleansing & Investigative Judgment',
        summary:
          'At the close of Daniel’s longest time prophecy, the heavenly courtroom convenes before Christ returns with His reward.',
        verseIds: ['DAN.8.14', 'DAN.7.9', 'LEV.16.8', 'REV.11.19', '1PE.4.17', 'REV.22.11'],
      },
    ],
    keyVerseIds: ['EXO.25.8', 'PSA.77.13', 'HEB.8.1', 'HEB.9.24', 'DAN.8.14', 'DAN.7.9', 'LEV.16.8', 'REV.11.19', '1PE.4.17', 'REV.22.11'],
    studyQuestions: [
      'How does Hebrews 8:1–5 use Exodus 25:8–40 to describe the relationship between the earthly and heavenly sanctuaries?',
      'Explore the 3D Tabernacle model in Sanctuary Explorer: how did the daily Holy Place ministry differ from the annual Day of Atonement?',
    ],
    relatedThemeId: 'theme-sanctuary',
    relatedSanctuaryId: 'sanc-ark-covenant',
    relatedEventId: 'evt-heavenly-ministry',
  },
  {
    id: 'ch-11',
    kind: 'chapter',
    order: 11,
    numeral: 'XI',
    title: "The Three Angels' Messages",
    pageRange: 'pp. 67–71',
    category: 'Sanctuary & Prophecy',
    biblicalSummary:
      'Revelation 14:6–12 presents God’s final global gospel proclamation: (1) Fear God and worship the Creator because the hour of judgment is come; (2) Babylon is fallen; and (3) Beware the beast, its image, and its mark—producing a patient, commandment-keeping people with the faith of Jesus.',
    doctrinalNotes:
      'Identifies the First Angel with the 1844 judgment-hour message and Sabbath Creator-worship; the Second Angel with spiritual departure from fallen ecclesiastical systems; and the Third Angel with the final warning contrasting human-enforced worship against God’s law and Christ’s righteousness.',
    subsections: [
      {
        label: 'First Angel · Everlasting Gospel & Judgment Hour',
        summary:
          'Calls every nation to worship the Creator of heaven and earth as the hour of divine judgment arrives.',
        verseIds: ['REV.14.6', 'DAN.8.14', 'EXO.20.11'],
      },
      {
        label: 'Second & Third Angels · Babylon & Mark of the Beast',
        summary:
          'Exposes Babylon’s fall and warns against the beast’s authority, preserving saints who keep God’s commandments and Christ’s faith.',
        verseIds: ['REV.14.8', 'REV.14.9', 'REV.14.12', 'REV.13.11', 'REV.17.3', 'EZK.20.20'],
      },
    ],
    keyVerseIds: ['REV.14.6', 'REV.14.8', 'REV.14.9', 'REV.14.12', 'REV.13.11', 'REV.17.3', 'DAN.8.14', 'EZK.20.20', 'MAT.5.17', 'GAL.2.20'],
    studyQuestions: [
      'Notice the wording of Revelation 14:7 ("made heaven, and earth, the sea"): where does that phrase echo the Ten Commandments?',
      'What twin traits characterize the saints at the end of the Third Angel’s message in Revelation 14:12?',
    ],
    relatedThemeId: 'theme-judgment',
  },
  {
    id: 'ch-12',
    kind: 'chapter',
    order: 12,
    numeral: 'XII',
    title: 'That Other Angel (Revelation 18:1)',
    pageRange: 'pp. 72–77',
    category: 'Sanctuary & Prophecy',
    biblicalSummary:
      'An angel of great glory descends in Revelation 18:1–4, lightening the earth and calling God’s sincere people out of spiritual Babylon ahead of final judgment and the Time of Trouble.',
    doctrinalNotes:
      'Connects the Revelation 18:1 angel with the 1888 message of Christ Our Righteousness, the promised Latter Rain outpouring of the Spirit, the Loud Cry swelling the Third Angel’s warning, and spiritual preparation for the Time of Jacob’s Trouble.',
    subsections: [
      {
        label: 'Latter Rain, Lightening the Earth & Loud Cry',
        summary:
          'Fresh outpouring of the Spirit accompanies the final call to separate from Babylon and embrace the righteousness of Christ.',
        verseIds: ['REV.18.1', 'REV.18.4', 'JOL.2.23', 'HOS.6.1', 'ACT.3.19', 'HAB.2.14'],
      },
      {
        label: 'Laodicean Revival & Time of Trouble',
        summary:
          'Overcoming lukewarmness through Christ’s righteousness prepares believers for Michael’s stand in Daniel 12.',
        verseIds: ['REV.3.14', 'JER.23.6', 'DAN.12.1'],
      },
    ],
    keyVerseIds: ['REV.18.1', 'REV.18.4', 'REV.3.14', 'DAN.12.1', 'JER.23.6', 'HOS.6.1', 'JOL.2.23', 'HAB.2.14', 'ACT.3.19'],
    studyQuestions: [
      'How does Revelation 18:4 appeal to sincere believers still within confused religious systems?',
      'What spiritual readiness does Jeremiah 23:6 ("THE LORD OUR RIGHTEOUSNESS") describe for the final crisis?',
    ],
    relatedThemeId: 'theme-judgment',
  },
  {
    id: 'ch-13',
    kind: 'chapter',
    order: 13,
    numeral: 'XIII',
    title: 'The Gift of Prophecy',
    pageRange: 'pp. 78–79',
    category: 'Church & Ordinances',
    biblicalSummary:
      'The risen Christ distributes spiritual gifts to equip the church until unity is reached, specifically uniting the "commandments of God" with the "testimony of Jesus Christ" (the spirit of prophecy) among the end-time remnant.',
    doctrinalNotes:
      'Affirms that authentic prophetic ministry must agree with the Law and the Testimony (Isaiah 8:20) and bear godly fruit (Matthew 7:16), recognizing the prophetic ministry of Ellen G. White as illuminating Scripture without replacing the Bible as the supreme rule.',
    subsections: [
      {
        label: 'Continuation of Spiritual Gifts in the Remnant',
        summary:
          'Joel, Acts, Paul, and Revelation describe prophecy continuing alongside apostolic gifts until Christ’s return.',
        verseIds: ['JOL.2.28', 'ACT.2.17', '1CO.1.7', 'EPH.4.11', 'REV.12.17', 'REV.19.10'],
      },
      {
        label: 'Biblical Tests of True Prophecy',
        summary:
          'Despise not prophesyings, but prove all things by Scripture and observable spiritual fruit.',
        verseIds: ['ISA.8.20', 'MAT.7.16', '2PE.1.19', '1TH.5.19'],
      },
    ],
    keyVerseIds: ['JOL.2.28', 'ACT.2.17', 'REV.12.17', 'REV.19.10', '1CO.1.7', '1CO.12.7', 'EPH.4.11', 'ISA.8.20', 'MAT.7.16', '1TH.5.19'],
    studyQuestions: [
      'How does Revelation 19:10 define "the testimony of Jesus" mentioned in Revelation 12:17?',
      'What practical balance does Paul prescribe in 1 Thessalonians 5:19–21?',
    ],
  },
  {
    id: 'ch-14',
    kind: 'chapter',
    order: 14,
    numeral: 'XIV',
    title: 'Marriage',
    pageRange: 'pp. 80–84',
    category: 'Christian Living',
    biblicalSummary:
      'Instituted by God in Eden as a lifelong covenant between one man and one woman, marriage reflects Christ’s union with His church and calls believers to purity, fidelity, and spiritual unity.',
    doctrinalNotes:
      'Emphasizes monogamous, lifelong marriage entered "only in the Lord" (2 Cor 6:14), upholding marital fidelity, honoring Christ’s teaching on divorce/remarriage while a spouse lives (Rom 7:1–3), and maintaining biblical sexual morality.',
    subsections: [
      {
        label: 'Edenic Institution & Lifelong Covenant',
        summary:
          'What God joined together is designed as an enduring one-flesh covenant reflecting Christ and His church.',
        verseIds: ['GEN.2.18', 'GEN.2.24', 'MAT.19.4', 'MAT.19.6', 'MAL.2.14', 'EPH.5.24'],
      },
      {
        label: 'Purity, Faithfulness & Shared Faith',
        summary:
          'Believers honor marriage in purity, bound in the faith and faithful for life.',
        verseIds: ['ROM.7.1', '1CO.7.2', '2CO.6.14', 'HEB.13.4', 'ROM.1.26'],
      },
    ],
    keyVerseIds: ['GEN.2.18', 'GEN.2.24', 'MAT.19.4', 'MAT.19.6', 'MAL.2.14', 'ROM.7.1', '1CO.7.2', '2CO.6.14', 'EPH.5.24', 'HEB.13.4'],
    studyQuestions: [
      'Why did Jesus point back to "from the beginning" in Matthew 19:4–6 when teaching about marriage?',
      'How does Ephesians 5:22–33 elevate marriage into a living parable of Christ and the church?',
    ],
  },
  {
    id: 'ch-15',
    kind: 'chapter',
    order: 15,
    numeral: 'XV',
    title: 'The Christian Family',
    pageRange: 'pp. 85–87',
    category: 'Christian Living',
    biblicalSummary:
      'The Christian home is God’s foundational school and domestic church, built on self-sacrificing love, godly parenting, daily worship, and mutual honor between husbands, wives, and children.',
    doctrinalNotes:
      'Highlights Deuteronomy 6 diligence in teaching Scripture at home, balanced loving authority from parents without provoking children to wrath, and Elijah’s end-time promise turning hearts of fathers and children together.',
    subsections: [
      {
        label: 'The Home as Domestic Sanctuary & School',
        summary:
          'Joshua’s resolve and Deuteronomy’s daily teaching establish God’s Word at the center of family life.',
        verseIds: ['GEN.1.28', 'DEU.6.4', 'JOS.24.15', 'PSA.128.1', 'PSA.127.3'],
      },
      {
        label: 'Loving Leadership & Training Children',
        summary:
          'Wise maternal care, patient paternal nurture, and filial honor build enduring Christian character.',
        verseIds: ['PRO.22.6', 'PRO.31.10', 'EPH.6.1', 'EPH.6.4', 'MAL.4.5'],
      },
    ],
    keyVerseIds: ['DEU.6.4', 'JOS.24.15', 'PSA.127.3', 'PSA.128.1', 'PRO.22.6', 'PRO.31.10', 'EPH.6.1', 'EPH.6.4', 'MAL.4.5'],
    studyQuestions: [
      'What daily rhythms does Deuteronomy 6:4–9 prescribe for passing faith to the next generation?',
      'How do Ephesians 6:1–4 balance the responsibilities of children and parents?',
    ],
  },
  {
    id: 'ch-16',
    kind: 'chapter',
    order: 16,
    numeral: 'XVI',
    title: 'Christian Temperance',
    pageRange: 'pp. 88–97',
    category: 'Christian Living',
    biblicalSummary:
      'Because the believer’s body is the temple of the Holy Spirit, every aspect of eating, drinking, rest, and lifestyle is dedicated to God’s glory—returning toward the original Edenic diet and avoiding harmful intoxicants.',
    doctrinalNotes:
      'Teaches holistic temperance across body, soul, and spirit: abstinence from alcohol, tobacco, harmful stimulants, and unclean/flesh foods as believers progress toward the Edenic plant-based diet (Gen 1:29), valuing natural remedies alongside conscientious medical care in acute emergencies.',
    subsections: [
      {
        label: 'Body as the Temple of the Holy Spirit',
        summary:
          'Holiness encompasses physical stewardship, self-control, and presenting our bodies as living sacrifices.',
        verseIds: ['1CO.10.31', '1CO.3.16', '1CO.6.19', 'ROM.12.1', '2PE.1.5', '1TH.5.23'],
      },
      {
        label: 'Edenic Diet, Sobriety & Stewardship of Health',
        summary:
          'Daniel’s stand in Babylon, Genesis 1:29’s original provision, and Scripture’s warnings against strong drink guide healthful living.',
        verseIds: ['GEN.1.29', 'DAN.1.8', 'EXO.15.26', 'PRO.23.20', 'ISA.11.6', '3JN.1.2'],
      },
    ],
    keyVerseIds: ['1CO.10.31', '1CO.3.16', '1CO.6.19', 'ROM.12.1', '2PE.1.5', '3JN.1.2', '1TH.5.23', 'DAN.1.8', 'GEN.1.29', 'PRO.23.20'],
    studyQuestions: [
      'How does Paul link physical self-stewardship with spiritual worship in 1 Corinthians 6:19–20 and Romans 12:1?',
      'Why did Daniel purpose in his heart regarding the king’s table in Daniel 1:8?',
    ],
  },
  {
    id: 'ch-17',
    kind: 'chapter',
    order: 17,
    numeral: 'XVII',
    title: 'Separation From the World',
    pageRange: 'pp. 98–104',
    category: 'Christian Living',
    biblicalSummary:
      'Though living in the world as salt and light, Christians are called out from worldly pride, corrupting amusements, unequal alliances, and immodesty to reflect heaven’s purity in mind, conduct, and attire.',
    doctrinalNotes:
      'Discusses inward and outward distinction: modest, simple, gender-appropriate dress without ostentatious adornment; vigilance over reading, media, and recreation; avoiding oath-bound secret societies; and dwelling on whatever is true, pure, and lovely (Phil 4:8).',
    subsections: [
      {
        label: 'In the World, Not of the World',
        summary:
          'Jesus prayed not to remove believers from the earth, but to sanctify them from its spirit of pride and compromise.',
        verseIds: ['JHN.17.15', 'MAT.5.13', '1JN.2.15', 'JAS.4.4', '2CO.6.14', 'REV.18.4'],
      },
      {
        label: 'Modesty, Purity & Renewed Minds',
        summary:
          'Adornment of a meek and quiet spirit paired with disciplined thought life.',
        verseIds: ['1TI.2.9', '1PE.3.1', 'DEU.22.5', 'NUM.15.38', 'PHP.4.8'],
      },
    ],
    keyVerseIds: ['JHN.17.15', '2CO.6.14', 'JAS.4.4', '1JN.2.15', 'MAT.5.13', '1TI.2.9', '1PE.3.1', 'DEU.22.5', 'PHP.4.8'],
    studyQuestions: [
      'How does Jesus balance mission ("salt of the earth") with spiritual distinction in John 17:15–18?',
      'What eight mental filters does Philippians 4:8 give Christians for evaluating media and entertainment?',
    ],
  },
  {
    id: 'ch-18',
    kind: 'chapter',
    order: 18,
    numeral: 'XVIII',
    title: 'Our Duty Toward Civil Authorities',
    pageRange: 'pp. 105–107',
    category: 'Christian Living',
    biblicalSummary:
      'Christians honor civil rulers, pay taxes faithfully, pray for those in authority, and live peaceably—yet maintain conscientious non-combatancy and obey God above human decrees whenever state laws conflict with God’s commandments.',
    doctrinalNotes:
      'Captures the historic conscientious-objector stand foundational to the SDA Reform Movement: rendering unto Caesar taxes and civil respect while refusing carnal warfare ("all they that take the sword shall perish with the sword") and echoing Peter: "We ought to obey God rather than men."',
    subsections: [
      {
        label: 'Respect, Taxes & Prayer for Rulers',
        summary:
          'Scripture instructs believers to be law-abiding citizens, render tribute faithfully, and intercede for leaders.',
        verseIds: ['ROM.13.1', 'TIT.3.1', '1PE.2.13', 'MAT.22.21', '1TI.2.1'],
      },
      {
        label: 'Peaceable Non-Combatancy & Supreme Allegiance to God',
        summary:
          'Following Christ who came to save men’s lives, believers decline military combat and yield highest obedience to God’s law.',
        verseIds: ['MAT.26.52', 'LUK.9.56', 'DAN.3.16', 'ACT.4.19', 'ACT.5.29'],
      },
    ],
    keyVerseIds: ['ROM.13.1', 'TIT.3.1', '1PE.2.13', 'MAT.22.21', '1TI.2.1', 'MAT.26.52', 'LUK.9.56', 'DAN.3.16', 'ACT.5.29'],
    studyQuestions: [
      'How do Romans 13:1–7 and Acts 5:29 define both the legitimacy and the boundary of civil authority?',
      'What principles guided Jesus’ rebuke in Matthew 26:52 and Luke 9:55–56?',
    ],
  },
  {
    id: 'ch-19',
    kind: 'chapter',
    order: 19,
    numeral: 'XIX',
    title: 'The Sealing',
    pageRange: 'pp. 108–111',
    category: 'Sanctuary & Prophecy',
    biblicalSummary:
      'Before final judgments fall, God’s angel seals His faithful servants (symbolized as 144,000) in their foreheads—imprinting the Father’s character and the sign of the Sabbath—standing in contrast to the mark of the beast.',
    doctrinalNotes:
      'Connects Ezekiel 9’s mark upon those who sigh over abominations, Isaiah 8:16 ("seal the law among my disciples"), and Ezekiel 20:12/20 (Sabbath as sign) with Revelation 7 and 14, culminating in the special resurrection of Daniel 12:2 and Revelation 1:7 prior to the Second Advent.',
    subsections: [
      {
        label: 'Seal of God vs. Mark of the Beast',
        summary:
          'Sealing settles believers into the truth by the Holy Spirit, bearing the Father’s name and Sabbath sign of loyalty.',
        verseIds: ['REV.7.1', 'REV.14.1', 'REV.14.9', 'EZK.9.4', 'EZK.20.12', 'ISA.8.16', 'EPH.1.13'],
      },
      {
        label: 'Endurance & the Special Resurrection',
        summary:
          'Blessed are the dead in the Lord ahead of the final crisis, and those sleeping in the dust who awake for Christ’s appearing.',
        verseIds: ['REV.14.13', 'DAN.12.2', 'REV.1.7'],
      },
    ],
    keyVerseIds: ['REV.7.1', 'REV.14.1', 'REV.14.9', 'EZK.9.4', 'EZK.20.12', 'ISA.8.16', 'EPH.1.13', 'REV.14.13', 'DAN.12.2', 'REV.1.7'],
    studyQuestions: [
      'Compare Ezekiel 9:4 and Revelation 7:1–3: what attitude of heart precedes receiving God’s seal?',
      'Why does Revelation 14:1 describe the sealed as having the Father’s name written in their foreheads?',
    ],
  },
  {
    id: 'ch-20',
    kind: 'chapter',
    order: 20,
    numeral: 'XX',
    title: 'The Church of God',
    pageRange: 'pp. 112–127',
    category: 'Church & Ordinances',
    biblicalSummary:
      'The church is the body of Christ built solely upon Him as the Chief Cornerstone, called to fellowship, mutual care, gospel mission, orderly ministry, and redemptive Matthew 18 restoration.',
    doctrinalNotes:
      'Covers the church’s foundation in Christ, spiritual apostolic succession of faith and character rather than unbroken human office, church organization and missionary calling, member privileges/duties, and careful pastoral steps in Matthew 18 discipline and restoration.',
    subsections: [
      {
        label: 'Christ the Rock, Body & Spiritual Order',
        summary:
          'One body with diverse Spirit-given ministries built upon Christ, the pillar and ground of the truth.',
        verseIds: ['1TI.3.15', 'MAT.16.18', '1CO.3.11', 'EPH.2.19', 'EPH.4.11', '1CO.12.12', 'ACT.2.47'],
      },
      {
        label: 'Fellowship & Redemptive Church Discipline',
        summary:
          'Loving private counsel, two or three witnesses, and meek restoration seek first to win an erring brother.',
        verseIds: ['HEB.10.25', 'MAT.18.15', 'MAT.18.16', 'GAL.6.1'],
      },
    ],
    keyVerseIds: ['1TI.3.15', 'MAT.16.18', '1CO.3.11', 'EPH.2.19', 'EPH.4.11', '1CO.12.12', 'ACT.2.47', 'MAT.18.15', 'MAT.18.16', 'GAL.6.1', 'HEB.10.25'],
    studyQuestions: [
      'In Matthew 18:15–17, why must personal reconciliation precede bringing a matter before witnesses or the church?',
      'What attitude does Paul require of those restoring an erring member in Galatians 6:1?',
    ],
    relatedThemeId: 'theme-kingdom',
  },
  {
    id: 'ch-21',
    kind: 'chapter',
    order: 21,
    numeral: 'XXI',
    title: 'Stewardship',
    pageRange: 'pp. 128–131',
    category: 'Christian Living',
    biblicalSummary:
      'God owns the earth and all its fullness; believers serve as faithful stewards of time, abilities, and means—returning a holy tenth (tithe) to the gospel storehouse alongside cheerful freewill offerings.',
    doctrinalNotes:
      'Grounds stewardship in creation ownership (Ps 24:1), the sacredness of the tithe predating Sinai (Abraham and Jacob) and affirmed by Jesus (Matt 23:23), support for gospel ministry (1 Cor 9:14), care for family and needy, and Malachi 3’s blessing promise.',
    subsections: [
      {
        label: 'God’s Ownership & Faithful Management',
        summary:
          'Everything belongs to the Lord; believers manage time, talents, and resources as accountable stewards.',
        verseIds: ['PSA.24.1', '1CH.29.11', 'MAT.25.14', '1CO.4.1', '1TI.5.8'],
      },
      {
        label: 'Sacred Tithe & Cheerful Offerings',
        summary:
          'The tenth is holy unto the LORD to sustain ministry, accompanied by willing, cheerful liberality.',
        verseIds: ['LEV.27.30', 'MAL.3.8', 'MAL.3.10', 'MAT.23.23', '1CO.9.14', '2CO.9.6'],
      },
    ],
    keyVerseIds: ['PSA.24.1', '1CH.29.11', 'MAT.25.14', '1CO.4.1', 'LEV.27.30', 'MAL.3.8', 'MAL.3.10', 'MAT.23.23', '1CO.9.14', '2CO.9.6'],
    studyQuestions: [
      'How did Jesus validate faithful tithing while rebuking neglect of justice and mercy in Matthew 23:23?',
      'What principle governs giving above the tithe in 2 Corinthians 9:6–7?',
    ],
  },
  {
    id: 'ch-22',
    kind: 'chapter',
    order: 22,
    numeral: 'XXII',
    title: 'The Second Coming of Christ',
    pageRange: 'pp. 132–135',
    category: 'Last Things',
    biblicalSummary:
      'The blessed hope of the church is the literal, personal, audible, and universally visible return of Jesus Christ in the clouds of heaven to raise the righteous dead, translate living saints, and execute judgment.',
    doctrinalNotes:
      'Refutes secret-rapture and spiritualized-return theories alongside Satanic counterfeits (Matt 24:23–27), outlines the seven last plagues following the close of probation, and emphasizes watchful readiness.',
    subsections: [
      {
        label: 'Literal, Visible & Audible Return',
        summary:
          'Every eye shall see Him returning as lightning spans the sky, accompanied by the shout and trump of God.',
        verseIds: ['JHN.14.1', 'ACT.1.11', 'MAT.24.27', 'MAT.24.30', 'REV.1.7', 'REV.19.11'],
      },
      {
        label: 'Resurrection, Translation & Close of Probation',
        summary:
          'The dead in Christ rise first, living believers are caught up transformed, and seven last plagues fall on the unrepentant.',
        verseIds: ['1TH.4.16', '1CO.15.51', 'REV.16.1', 'TIT.2.13', 'HEB.9.28'],
      },
    ],
    keyVerseIds: ['JHN.14.1', 'ACT.1.11', 'MAT.24.27', 'MAT.24.30', '1TH.4.16', '1CO.15.51', 'REV.1.7', 'REV.19.11', 'REV.16.1', 'TIT.2.13', 'HEB.9.28'],
    studyQuestions: [
      'What sensory details in 1 Thessalonians 4:16–17 and Revelation 1:7 rule out a silent or secret return?',
      'How does Jesus protect believers against end-time impersonations in Matthew 24:23–27?',
    ],
    relatedThemeId: 'theme-second-coming',
    relatedEventId: 'evt-new-creation',
  },
  {
    id: 'ch-23',
    kind: 'chapter',
    order: 23,
    numeral: 'XXIII',
    title: 'The Origin, Nature, and Destiny of Man',
    pageRange: 'pp. 136–139',
    category: 'Last Things',
    biblicalSummary:
      'Formed from the dust of the ground and animated by the breath of life, humanity became a living soul—mortal by nature, unconscious in death’s sleep, awaiting resurrection life in Christ rather than natural immortality.',
    doctrinalNotes:
      'Explains conditional immortality (1 Tim 6:16; Rom 2:7), death as an unconscious sleep where thoughts perish (Eccl 9:5; Ps 146:4; John 11:11), the resurrection as true hope, and total destruction (not endless torment) of sin and the unrepentant in the second death.',
    subsections: [
      {
        label: 'Creation & Conditional Immortality',
        summary:
          'Dust plus the breath of life made a living soul; immortality is God’s gift bestowed at the resurrection.',
        verseIds: ['GEN.1.26', 'GEN.2.7', 'GEN.3.19', 'ROM.6.23'],
      },
      {
        label: 'Sleep of Death, Resurrection & Final Annihilation',
        summary:
          'The dead sleep unconsciously until the resurrection call; the wicked face complete consumption as ashes.',
        verseIds: ['ECC.9.5', 'ECC.12.7', 'PSA.146.4', 'JHN.11.11', '1TH.4.13', 'JHN.5.28', 'MAL.4.1', 'REV.20.14'],
      },
    ],
    keyVerseIds: ['GEN.1.26', 'GEN.2.7', 'GEN.3.19', 'ECC.9.5', 'ECC.12.7', 'PSA.146.4', 'JHN.11.11', '1TH.4.13', 'JHN.5.28', 'ROM.6.23', 'MAL.4.1', 'REV.20.14'],
    studyQuestions: [
      'How does Genesis 2:7 define what a "living soul" is—an essence separate from the body or the whole living person?',
      'Why does Paul refer to believers who died as "them which are asleep" in 1 Thessalonians 4:13–15?',
    ],
    relatedThemeId: 'theme-resurrection',
  },
  {
    id: 'ch-24',
    kind: 'chapter',
    order: 24,
    numeral: 'XXIV',
    title: 'The Millennium',
    pageRange: 'pp. 140–142',
    category: 'Last Things',
    biblicalSummary:
      'Revelation 20 spans 1,000 years between the first resurrection (at Christ’s return) and the second resurrection: the saints reign and participate in judgment in heaven while Satan is bound on a desolate, uninhabited earth.',
    doctrinalNotes:
      'Distinguishes the millennial desolation on earth (Jer 4:23–27) from the saints’ heavenly session (1 Cor 6:2–3); at the close of the 1,000 years, the New Jerusalem descends, the wicked are raised, Satan attempts a final assault, and fire from heaven cleanses the planet permanently.',
    subsections: [
      {
        label: 'During the 1,000 Years · Heaven & Desolate Earth',
        summary:
          'Righteous saints live and reign with Christ in heaven while Satan is confined by circumstances upon a ruined earth.',
        verseIds: ['REV.20.1', 'REV.20.4', 'REV.20.5', 'JER.4.23', '1CO.6.2'],
      },
      {
        label: 'Close of the Millennium & Executive Judgment',
        summary:
          'The Holy City descends, the second resurrection occurs, and fire from heaven consumes sin and sinners forever.',
        verseIds: ['ZEC.14.4', 'REV.21.2', 'REV.20.9', 'MAL.4.1', '2PE.3.10'],
      },
    ],
    keyVerseIds: ['REV.20.1', 'REV.20.4', 'REV.20.5', 'JER.4.23', '1CO.6.2', 'ZEC.14.4', 'REV.21.2', 'REV.20.9', 'MAL.4.1', '2PE.3.10'],
    studyQuestions: [
      'What two resurrections mark the beginning and the end of the thousand years in Revelation 20:4–6?',
      'According to 1 Corinthians 6:2–3 and Revelation 20:4, what judicial review takes place during the millennium?',
    ],
    relatedThemeId: 'theme-judgment',
  },
  {
    id: 'ch-25',
    kind: 'chapter',
    order: 25,
    numeral: 'XXV',
    title: 'The New Earth',
    pageRange: 'pp. 143–145',
    category: 'Last Things',
    biblicalSummary:
      'Purified by fire, God creates new heavens and a new earth wherein righteousness dwells—restoring Eden’s harmony, centering eternity around the New Jerusalem where God dwells with humanity, and uniting creation in eternal Sabbath worship.',
    doctrinalNotes:
      'Fulfillment of God’s promise to Abraham and the meek (Rom 4:13; Matt 5:5), detailing the New Jerusalem, the River and Tree of Life, total abolition of pain and death, and Isaiah 66:22–23’s eternal Sabbath assembly.',
    subsections: [
      {
        label: 'Restored Inheritance & New Jerusalem',
        summary:
          'The meek inherit the renewed earth promised to Abraham’s spiritual seed, with the New Jerusalem as capital.',
        verseIds: ['ISA.65.17', '2PE.3.13', 'ROM.4.13', 'GAL.3.29', 'PSA.37.11', 'MAT.5.5', 'HEB.11.10'],
      },
      {
        label: 'God Dwelling with Humanity Forever',
        summary:
          'No more curse, tears, or death—all flesh gathers from one Sabbath to another to worship before the Lord.',
        verseIds: ['REV.21.1', 'REV.22.1', 'ISA.66.22', 'DAN.7.27'],
      },
    ],
    keyVerseIds: ['ISA.65.17', 'ISA.66.22', '2PE.3.13', 'REV.21.1', 'REV.22.1', 'ROM.4.13', 'GAL.3.29', 'DAN.7.27', 'PSA.37.11', 'MAT.5.5', 'HEB.11.10'],
    studyQuestions: [
      'How do Romans 4:13 and Hebrews 11:10 broaden Abraham’s inheritance to include the renewed earth?',
      'Which Edenic symbols return healed and fulfilled in Revelation 22:1–5?',
    ],
    relatedThemeId: 'theme-creation',
    relatedEventId: 'evt-new-creation',
  },
  {
    id: 'conclusion',
    kind: 'conclusion',
    order: 26,
    numeral: 'Conclusion',
    title: 'Daily Surrender & Christ Living Within',
    pageRange: 'p. 146',
    category: 'Foundations',
    biblicalSummary:
      'Doctrine finds its living end in daily surrender, new birth in Christ, and the mystery of the gospel: "Christ in you, the hope of glory."',
    doctrinalNotes:
      'Closes the 25 studies with an appeal for personal consecration—recognizing that intellectual assent to truth must become a daily born-again walk of love, humility, and readiness for Christ’s appearing.',
    subsections: [
      {
        label: 'New Creation & Indwelling Hope',
        summary:
          'True religion is personal transformation through Christ dwelling within by faith.',
        verseIds: ['2CO.5.17', 'COL.1.27'],
      },
    ],
    keyVerseIds: ['2CO.5.17', 'COL.1.27', 'GAL.2.20', 'REV.22.20'],
    studyQuestions: [
      'Why does the study guide end not with a rulebook, but with 2 Corinthians 5:17 and Colossians 1:27?',
    ],
    relatedThemeId: 'theme-grace',
  },
];
