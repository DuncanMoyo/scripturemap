import { BiblicalEvent } from '../types/scripture';
export { BIBLICAL_LOCATIONS } from './geography';
export { SANCTUARY_ARTICLES } from './sanctuary';

export const BIBLICAL_EVENTS: BiblicalEvent[] = [
  {
    id: 'evt-creation',
    title: 'Creation & Seventh-Day Rest',
    era: 'Primeval History',
    approximateDate: 'Beginning',
    sortOrder: 1,
    summary:
      'God brings the heavens and earth into existence by His spoken Word, forms humanity in His image, and sanctifies the seventh day.',
    verseIds: ['GEN.1.1', 'GEN.1.26', 'GEN.2.2', 'GEN.2.3'],
  },
  {
    id: 'evt-promise-eden',
    title: 'The First Gospel Promise',
    era: 'Primeval History',
    approximateDate: 'The Fall',
    sortOrder: 2,
    summary:
      'In the wake of human disobedience, God announces enmity between the serpent and the Seed of the woman.',
    verseIds: ['GEN.3.15'],
  },
  {
    id: 'evt-abraham-covenant',
    title: 'Call of Abraham & Covenant Promise',
    era: 'Patriarchal Era',
    approximateDate: 'c. 2000 BC',
    sortOrder: 3,
    summary:
      'Departing Ur and Haran into Canaan, Abraham receives the promise that through his seed all families of the earth shall be blessed.',
    verseIds: ['GEN.11.31', 'GEN.12.1', 'GEN.12.3', 'GEN.15.6', 'GEN.22.8', 'GAL.3.16'],
  },
  {
    id: 'evt-exodus-sinai',
    title: 'Passover, Sinai & the Tabernacle',
    era: 'Exodus & Wilderness',
    approximateDate: 'c. 1446 BC',
    sortOrder: 4,
    summary:
      'Israel is delivered from Egypt under the blood of the Passover lamb, receives the Decalogue at Mount Sinai, and constructs the wilderness sanctuary after the heavenly pattern.',
    verseIds: ['EXO.12.13', 'EXO.19.1', 'EXO.20.8', 'EXO.25.8', 'EXO.25.9', 'EXO.34.6'],
  },
  {
    id: 'evt-prophetic-hope',
    title: 'Davidic Psalms & Messianic Prophets',
    era: 'Monarchy & Exile',
    approximateDate: 'c. 1000–530 BC',
    sortOrder: 5,
    summary:
      'David, Isaiah, Jeremiah, Micah, Zechariah, and Daniel unfold the suffering Servant, the New Covenant written on the heart, and the everlasting kingdom of the Son of man.',
    verseIds: ['PSA.22.1', 'ISA.7.14', 'ISA.53.5', 'JER.31.31', 'DAN.7.13', 'MIC.5.2', 'ZEC.9.9'],
  },
  {
    id: 'evt-incarnation',
    title: 'Incarnation of the Word',
    era: 'Gospels',
    approximateDate: 'c. 5–4 BC',
    sortOrder: 6,
    summary:
      'The eternal Word becomes flesh in Bethlehem and grows up in Nazareth, tabernacling among humanity full of grace and truth.',
    verseIds: ['JHN.1.1', 'JHN.1.14', 'MAT.1.23', 'MAT.2.6', 'LUK.2.4'],
  },
  {
    id: 'evt-galilee-ministry',
    title: 'Galilean Ministry & Proclamation of the Kingdom',
    era: 'Gospels',
    approximateDate: 'c. AD 27–30',
    sortOrder: 7,
    summary:
      'Centered in Capernaum and the Sea of Galilee, Jesus proclaims the fulfillment of Isaiah 61, heals the brokenhearted, and teaches the Kingdom of God.',
    verseIds: ['ISA.40.3', 'ISA.61.1', 'MAT.4.13', 'LUK.4.18', 'JHN.6.35', 'JHN.8.12'],
  },
  {
    id: 'evt-crucifixion-resurrection',
    title: 'Crucifixion, Veil Rent & Resurrection',
    era: 'Gospels & Apostolic Age',
    approximateDate: 'c. AD 30–33',
    sortOrder: 8,
    summary:
      'Christ dies as the Lamb of God outside Jerusalem, the temple veil is torn from top to bottom, and He rises on the third day as firstfruits.',
    verseIds: ['JHN.3.16', 'MAT.27.46', 'MAT.27.51', '1CO.15.4', '1CO.15.20'],
  },
  {
    id: 'evt-heavenly-ministry',
    title: 'Ascension & Heavenly High Priesthood',
    era: 'Apostolic Age',
    approximateDate: 'AD 33 onward',
    sortOrder: 9,
    summary:
      'Jesus ascends from Olivet to the right hand of the Majesty on high, ministering in the true heavenly sanctuary and making intercession for believers.',
    verseIds: ['ACT.1.11', 'ACT.2.17', 'HEB.8.1', 'HEB.9.24', 'ROM.8.34'],
  },
  {
    id: 'evt-apostolic-mission',
    title: 'Gentile Mission: Antioch, Aegean & Rome',
    era: 'Apostolic Age',
    approximateDate: 'AD 34–62',
    sortOrder: 10,
    summary:
      'From Damascus and Syrian Antioch through Cyprus, Galatia, Athens, Corinth, Ephesus, and Rome, the gospel spreads across the Mediterranean world.',
    verseIds: ['ACT.9.3', 'ACT.11.26', 'ACT.13.4', 'ACT.17.22', 'ACT.18.1', 'ACT.19.1', 'ACT.28.14'],
  },
  {
    id: 'evt-new-creation',
    title: 'Second Coming & New Earth',
    era: 'Consummation',
    approximateDate: 'Eschaton',
    sortOrder: 11,
    summary:
      'Christ returns visibly in the clouds of heaven, raises the righteous, and establishes the new heaven and new earth where God dwells with humanity.',
    verseIds: ['MAT.24.30', '1TH.4.16', 'REV.1.7', 'REV.21.1', 'REV.21.3', 'REV.21.4'],
  },
];
