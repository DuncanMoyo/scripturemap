import { BibleChapter, Verse } from '../types/scripture';
import { BOOK_MAP } from './books';

function v(
  bookId: string,
  chapter: number,
  verse: number,
  text: string,
  keyTerms?: string[]
): Verse {
  const book = BOOK_MAP[bookId];
  return {
    id: `${bookId}.${chapter}.${verse}`,
    bookId,
    bookName: book.name,
    chapter,
    verse,
    reference: `${book.name} ${chapter}:${verse}`,
    shortRef: `${book.shortName} ${chapter}:${verse}`,
    testament: book.testament,
    text,
    translation: 'KJV',
    keyTerms,
  };
}

export const SAMPLE_VERSES: Verse[] = [
  // GENESIS 1 (Complete key narrative + Sabbath climax in Gen 2:1-3)
  v('GEN', 1, 1, 'In the beginning God created the heaven and the earth.', ['Creation', 'Beginning', 'Elohim']),
  v('GEN', 1, 2, 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.', ['Spirit of God', 'Creation']),
  v('GEN', 1, 3, 'And God said, Let there be light: and there was light.', ['Light', 'Word of God']),
  v('GEN', 1, 4, 'And God saw the light, that it was good: and God divided the light from the darkness.'),
  v('GEN', 1, 5, 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.'),
  v('GEN', 1, 26, 'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.', ['Image of God', 'Dominion']),
  v('GEN', 1, 27, 'So God created man in his own image, in the image of God created he him; male and female created he them.', ['Image of God']),
  v('GEN', 1, 31, 'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.'),

  // GENESIS 2
  v('GEN', 2, 1, 'Thus the heavens and the earth were finished, and all the host of them.'),
  v('GEN', 2, 2, 'And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made.', ['Sabbath', 'Seventh Day']),
  v('GEN', 2, 3, 'And God blessed the seventh day, and sanctified it: because that in it he had rested from all his work which God created and made.', ['Sabbath', 'Sanctified']),
  v('GEN', 2, 7, 'And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.', ['Breath of Life', 'Creation']),

  // GENESIS 2 (continued geography)
  v('GEN', 2, 14, 'And the name of the third river is Hiddekel: that is it which goeth toward the east of Assyria. And the fourth river is Euphrates.', ['Hiddekel', 'Euphrates']),

  // GENESIS 3
  v('GEN', 3, 15, 'And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.', ['Seed of the Woman', 'Protoevangelium']),

  // GENESIS 11, 12, 15, 21, 22, 47
  v('GEN', 11, 31, 'And Terah took Abram his son, and Lot the son of Haran his son\'s son, and Sarai his daughter in law, his son Abram\'s wife; and they went forth with them from Ur of the Chaldees, to go into the land of Canaan; and they came unto Haran, and dwelt there.', ['Ur', 'Haran', 'Canaan']),
  v('GEN', 12, 1, 'Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father\'s house, unto a land that I will shew thee:', ['Call of Abram']),
  v('GEN', 12, 3, 'And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed.', ['Abrahamic Covenant', 'Blessing']),
  v('GEN', 12, 6, 'And Abram passed through the land unto the place of Sichem, unto the plain of Moreh. And the Canaanite was then in the land.', ['Shechem']),
  v('GEN', 15, 6, 'And he believed in the LORD; and he counted it to him for righteousness.', ['Faith', 'Righteousness']),
  v('GEN', 21, 31, 'Wherefore he called that place Beer-sheba; because there they sware both of them.', ['Beer-sheba']),
  v('GEN', 22, 8, 'And Abraham said, My son, God will provide himself a lamb for a burnt offering: so they went both of them together.', ['Lamb', 'Substitution']),
  v('GEN', 22, 18, 'And in thy seed shall all the nations of the earth be blessed; because thou hast obeyed my voice.', ['Seed', 'Covenant']),
  v('GEN', 47, 27, 'And Israel dwelt in the land of Egypt, in the country of Goshen; and they had possessions therein, and grew, and multiplied exceedingly.', ['Goshen', 'Egypt']),

  // EXODUS 3, 12, 13, 19, 20, 25, 34
  v('EXO', 3, 14, 'And God said unto Moses, I AM THAT I AM: and he said, Thus shalt thou say unto the children of Israel, I AM hath sent me unto you.', ['I AM', 'Divine Name']),
  v('EXO', 12, 5, 'Your lamb shall be without blemish, a male of the first year: ye shall take it out from the sheep, or from the goats:', ['Passover Lamb', 'Without Blemish']),
  v('EXO', 12, 13, 'And the blood shall be to you for a token upon the houses where ye are: and when I see the blood, I will pass over you, and the plague shall not be upon you to destroy you, when I smite the land of Egypt.', ['Passover', 'Blood']),
  v('EXO', 13, 18, 'But God led the people about, through the way of the wilderness of the Red sea: and the children of Israel went up harnessed out of the land of Egypt.', ['Red Sea', 'Exodus']),
  v('EXO', 19, 1, 'In the third month, when the children of Israel were gone forth out of the land of Egypt, the same day came they into the wilderness of Sinai.', ['Mount Sinai', 'Wilderness']),
  v('EXO', 20, 8, 'Remember the sabbath day, to keep it holy.', ['Sabbath', 'Decalogue']),
  v('EXO', 20, 11, 'For in six days the LORD made heaven and earth, the sea, and all that in them is, and rested the seventh day: wherefore the LORD blessed the sabbath day, and hallowed it.', ['Sabbath', 'Creation Memorial']),
  v('EXO', 25, 8, 'And let them make me a sanctuary; that I may dwell among them.', ['Sanctuary', 'Dwelling']),
  v('EXO', 25, 9, 'According to all that I shew thee, after the pattern of the tabernacle, and the pattern of all the instruments thereof, even so shall ye make it.', ['Pattern', 'Tabernacle']),
  v('EXO', 25, 10, 'And they shall make an ark of shittim wood: two cubits and a half shall be the length thereof, and a cubit and a half the breadth thereof, and a cubit and a half the height thereof.', ['Ark of the Covenant', 'Acacia Wood']),
  v('EXO', 25, 16, 'And thou shalt put into the ark the testimony which I shall give thee.', ['Testimony', 'Decalogue']),
  v('EXO', 25, 17, 'And thou shalt make a mercy seat of pure gold: two cubits and a half shall be the length thereof, and a cubit and a half the breadth thereof.', ['Mercy Seat', 'Pure Gold']),
  v('EXO', 25, 22, 'And there I will meet with thee, and I will commune with thee from above the mercy seat, from between the two cherubims which are upon the ark of the testimony, of all things which I will give thee in commandment unto the children of Israel.', ['Mercy Seat', 'Ark of the Covenant']),
  v('EXO', 25, 23, 'Thou shalt also make a table of shittim wood: two cubits shall be the length thereof, and a cubit the breadth thereof, and a cubit and a half the height thereof.', ['Table of Showbread', 'Acacia Wood']),
  v('EXO', 25, 30, 'And thou shalt set upon the table shewbread before me alway.', ['Showbread', 'Presence']),
  v('EXO', 25, 31, 'And thou shalt make a candlestick of pure gold: of beaten work shall the candlestick be made: his shaft, and his branches, his bowls, his knops, and his flowers, shall be of the same.', ['Candlestick', 'Pure Gold']),
  v('EXO', 25, 37, 'And thou shalt make the seven lamps thereof: and they shall light the lamps thereof, that they may give light over against it.', ['Seven Lamps', 'Light']),
  v('EXO', 26, 33, 'And thou shalt hang up the vail under the taches, that thou mayest bring in thither within the vail the ark of the testimony: and the vail shall divide unto you between the holy place and the most holy.', ['Veil', 'Holy Place', 'Most Holy Place']),
  v('EXO', 26, 34, 'And thou shalt put the mercy seat upon the ark of the testimony in the most holy place.', ['Most Holy Place', 'Mercy Seat']),
  v('EXO', 27, 1, 'And thou shalt make an altar of shittim wood, five cubits long, and five cubits broad; the altar shall be foursquare: and the height thereof shall be three cubits.', ['Altar of Burnt Offering']),
  v('EXO', 27, 2, 'And thou shalt make the horns of it upon the four corners thereof: his horns shall be of the same: and thou shalt overlay it with brass.', ['Altar Horns', 'Brass']),
  v('EXO', 27, 9, 'And thou shalt make the court of the tabernacle: for the south side southward there shall be hangings for the court of fine twined linen of an hundred cubits long for one side:', ['Courtyard', 'Fine Linen']),
  v('EXO', 27, 18, 'The length of the court shall be an hundred cubits, and the breadth fifty every where, and the height five cubits of fine twined linen, and their sockets of brass.', ['Courtyard', 'Dimensions']),
  v('EXO', 30, 1, 'And thou shalt make an altar to burn incense upon: of shittim wood shalt thou make it.', ['Altar of Incense']),
  v('EXO', 30, 7, 'And Aaron shall burn thereon sweet incense every morning: when he dresseth the lamps, he shall burn incense upon it.', ['Sweet Incense', 'Morning and Evening']),
  v('EXO', 30, 18, 'Thou shalt also make a laver of brass, and his foot also of brass, to wash withal: and thou shalt put it between the tabernacle of the congregation and the altar, and thou shalt put water therein.', ['Laver', 'Washing']),
  v('EXO', 30, 19, 'For Aaron and his sons shall wash their hands and their feet thereat:', ['Laver', 'Priesthood']),
  v('EXO', 34, 6, 'And the LORD passed by before him, and proclaimed, The LORD, The LORD God, merciful and gracious, longsuffering, and abundant in goodness and truth,', ['Character of God', 'Mercy', 'Grace']),
  v('EXO', 34, 7, 'Keeping mercy for thousands, forgiving iniquity and transgression and sin, and that will by no means clear the guilty; visiting the iniquity of the fathers upon the children, and upon the children\'s children, unto the third and to the fourth generation.', ['Forgiveness', 'Justice']),

  // LEVITICUS 6, 16, 17, 24
  v('LEV', 6, 13, 'The fire shall ever be burning upon the altar; it shall never go out.', ['Perpetual Fire', 'Altar']),
  v('LEV', 16, 15, 'Then shall he kill the goat of the sin offering, that is for the people, and bring his blood within the vail, and do with that blood as he did with the blood of the bullock, and sprinkle it upon the mercy seat, and before the mercy seat:', ['Day of Atonement', 'Mercy Seat']),
  v('LEV', 16, 30, 'For on that day shall the priest make an atonement for you, to cleanse you, that ye may be clean from all your sins before the LORD.', ['Atonement', 'Cleansing']),
  v('LEV', 17, 11, 'For the life of the flesh is in the blood: and I have given it to you upon the altar to make an atonement for your souls: for it is the blood that maketh an atonement for the soul.', ['Blood', 'Atonement']),
  v('LEV', 24, 5, 'And thou shalt take fine flour, and bake twelve cakes thereof: two tenth deals shall be in one cake.', ['Showbread', 'Twelve Loaves']),

  // NUMBERS 21, 33 & DEUTERONOMY 6, 18, 34 & JOSHUA 3 & 1 KINGS 18
  v('NUM', 21, 9, 'And Moses made a serpent of brass, and put it upon a pole, and it came to pass, that if a serpent had bitten any man, when he beheld the serpent of brass, he lived.', ['Serpent of Brass', 'Typology']),
  v('NUM', 33, 3, 'And they departed from Rameses in the first month, on the fifteenth day of the first month; on the morrow after the passover the children of Israel went out with an high hand in the sight of all the Egyptians.', ['Rameses', 'Exodus']),
  v('DEU', 6, 4, 'Hear, O Israel: The LORD our God is one LORD:', ['Shema', 'Monotheism']),
  v('DEU', 18, 15, 'The LORD thy God will raise up unto thee a Prophet from the midst of thee, of thy brethren, like unto me; unto him ye shall hearken;', ['Prophet like Moses']),
  v('DEU', 34, 1, 'And Moses went up from the plains of Moab unto the mountain of Nebo, to the top of Pisgah, that is over against Jericho. And the LORD shewed him all the land of Gilead, unto Dan,', ['Mount Nebo', 'Pisgah', 'Jericho']),
  v('JOS', 3, 15, 'And as they that bare the ark were come unto Jordan, and the feet of the priests that bare the ark were dipped in the brim of the water, (for Jordan overfloweth all his banks all the time of harvest,)', ['Jordan River', 'Crossing']),
  v('1KI', 18, 19, 'Now therefore send, and gather to me all Israel unto mount Carmel, and the prophets of Baal four hundred and fifty, and the prophets of the groves four hundred, which eat at Jezebel\'s table.', ['Mount Carmel', 'Elijah']),

  // PSALMS 2, 16, 22, 23, 33, 51, 84, 100, 110, 141
  v('PSA', 2, 7, 'I will declare the decree: the LORD hath said unto me, Thou art my Son; this day have I begotten thee.', ['Son of God', 'Messianic']),
  v('PSA', 16, 10, 'For thou wilt not leave my soul in hell; neither wilt thee suffer thine Holy One to see corruption.', ['Resurrection', 'Holy One']),
  v('PSA', 22, 1, 'My God, my God, why hast thou forsaken me? why art thou so far from helping me, and from the words of my roaring?', ['Crucifixion Cry', 'Lament']),
  v('PSA', 22, 16, 'For dogs have compassed me: the assembly of the wicked have inclosed me: they pierced my hands and my feet.', ['Pierced', 'Suffering']),
  v('PSA', 22, 18, 'They part my garments among them, and cast lots upon my vesture.', ['Garments', 'Lots']),
  v('PSA', 23, 1, 'The LORD is my shepherd; I shall not want.', ['Shepherd']),
  v('PSA', 23, 2, 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.'),
  v('PSA', 23, 3, 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.'),
  v('PSA', 23, 4, 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.'),
  v('PSA', 23, 5, 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.'),
  v('PSA', 23, 6, 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.'),
  v('PSA', 33, 6, 'By the word of the LORD were the heavens made; and all the host of them by the breath of his mouth.', ['Word of the LORD', 'Creation']),
  v('PSA', 51, 10, 'Create in me a clean heart, O God; and renew a right spirit within me.', ['Clean Heart', 'Repentance']),
  v('PSA', 84, 2, 'My soul longeth, yea, even fainteth for the courts of the LORD: my heart and my flesh crieth out for the living God.', ['Courts of the LORD']),
  v('PSA', 100, 4, 'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.', ['Gates', 'Courts', 'Praise']),
  v('PSA', 110, 1, 'The LORD said unto my Lord, Sit thou at my right hand, until I make thine enemies thy footstool.', ['Right Hand', 'Messiah']),
  v('PSA', 110, 4, 'The LORD hath sworn, and will not repent, Thou art a priest for ever after the order of Melchizedek.', ['Melchizedek', 'Priesthood']),
  v('PSA', 141, 2, 'Let my prayer be set forth before thee as incense; and the lifting up of my hands as the evening sacrifice.', ['Prayer as Incense']),
  v('PRO', 3, 5, 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.', ['Trust', 'Wisdom']),
  v('PRO', 3, 6, 'In all thy ways acknowledge him, and he shall direct thy paths.', ['Guidance']),
  v('ECC', 12, 13, 'Let us hear the conclusion of the whole matter: Fear God, and keep his commandments: for this is the whole duty of man.', ['Fear God', 'Commandments']),

  // ISAIAH 7, 9, 40, 53, 55, 65
  v('ISA', 7, 14, 'Therefore the Lord himself shall give you a sign; Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel.', ['Immanuel', 'Virgin Birth']),
  v('ISA', 9, 6, 'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.', ['Prince of Peace', 'Messianic']),
  v('ISA', 40, 3, 'The voice of him that crieth in the wilderness, Prepare ye the way of the LORD, make straight in the desert a highway for our God.', ['Forerunner', 'Wilderness']),
  v('ISA', 53, 1, 'Who hath believed our report? and to whom is the arm of the LORD revealed?'),
  v('ISA', 53, 2, 'For he shall grow up before him as a tender plant, and as a root out of a dry ground: he hath no form nor comeliness; and when we shall see him, there is no beauty that we should desire him.'),
  v('ISA', 53, 3, 'He is despised and rejected of men; a man of sorrows, and acquainted with grief: and we hid as it were our faces from him; he was despised, and we esteemed him not.', ['Man of Sorrows']),
  v('ISA', 53, 4, 'Surely he hath borne our griefs, and carried our sorrows: yet we did esteem him stricken, smitten of God, and afflicted.'),
  v('ISA', 53, 5, 'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.', ['Substitution', 'Atonement']),
  v('ISA', 53, 6, 'All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all.', ['Iniquity']),
  v('ISA', 53, 7, 'He was oppressed, and he was afflicted, yet he opened not his mouth: he is brought as a lamb to the slaughter, and as a sheep before her shearers is dumb, so he openeth not his mouth.', ['Lamb to the Slaughter']),
  v('ISA', 53, 10, 'Yet it pleased the LORD to bruise him; he hath put him to grief: when thou shalt make his soul an offering for sin, he shall see his seed, he shall prolong his days, and the pleasure of the LORD shall prosper in his hand.'),
  v('ISA', 53, 12, 'Therefore will I divide him a portion with the great, and he shall divide the spoil with the strong; because he hath poured out his soul unto death: and he was numbered with the transgressors; and he bare the sin of many, and made intercession for the transgressors.', ['Intercession']),
  v('ISA', 61, 1, 'The Spirit of the Lord GOD is upon me; because the LORD hath anointed me to preach good tidings unto the meek; he hath sent me to bind up the brokenhearted, to proclaim liberty to the captives, and the opening of the prison to them that are bound;', ['Anointed', 'Good Tidings']),
  v('ISA', 65, 17, 'For, behold, I create new heavens and a new earth: and the former shall not be remembered, nor come into mind.', ['New Creation']),

  // JEREMIAH 31 & DANIEL 2, 7, 8 & MICAH 5 & HABAKKUK 2
  v('JER', 31, 31, 'Behold, the days come, saith the LORD, that I will make a new covenant with the house of Israel, and with the house of Judah:', ['New Covenant']),
  v('JER', 31, 33, 'But this shall be the covenant that I will make with the house of Israel; After those days, saith the LORD, I will put my law in their inward parts, and write it in their hearts; and will be their God, and they shall be my people.', ['New Covenant', 'Law in Heart']),
  v('DAN', 7, 9, 'I beheld till the thrones were cast down, and the Ancient of days did sit, whose garment was white as snow, and the hair of his head like the pure wool: his throne was like the fiery flame, and his wheels as burning fire.', ['Ancient of Days', 'Judgment']),
  v('DAN', 7, 10, 'A fiery stream issued and came forth from before him: thousand thousands ministered unto him, and ten thousand times ten thousand stood before him: the judgment was set, and the books were opened.', ['Judgment', 'Books Opened']),
  v('DAN', 7, 13, 'I saw in the night visions, and, behold, one like the Son of man came with the clouds of heaven, and came to the Ancient of days, and they brought him near before him.', ['Son of Man', 'Clouds']),
  v('DAN', 7, 14, 'And there was given him dominion, and glory, and a kingdom, that all people, nations, and languages, should serve him: his dominion is an everlasting dominion, which shall not pass away, and his kingdom that which shall not be destroyed.', ['Everlasting Kingdom']),
  v('DAN', 8, 14, 'And he said unto me, Unto two thousand and three hundred days; then shall the sanctuary be cleansed.', ['Sanctuary Cleansed']),
  v('MIC', 5, 2, 'But thou, Bethlehem Ephratah, though thou be little among the thousands of Judah, yet out of thee shall he come forth unto me that is to be ruler in Israel; whose goings forth have been from of old, from everlasting.', ['Bethlehem', 'From Everlasting']),
  v('HAB', 2, 4, 'Behold, his soul which is lifted up is not upright in him: but the just shall live by his faith.', ['Faith', 'Justification']),
  v('HOS', 6, 6, 'For I desired mercy, and not sacrifice; and the knowledge of God more than burnt offerings.', ['Mercy', 'Knowledge of God']),
  v('HOS', 11, 1, 'When Israel was a child, then I loved him, and called my son out of Egypt.', ['Out of Egypt']),
  v('JOL', 2, 28, 'And it shall come to pass afterward, that I will pour out my spirit upon all flesh; and your sons and your daughters shall prophesy, your old men shall dream dreams, your young men shall see visions:', ['Spirit Outpoured', 'Prophecy']),
  v('ZEC', 9, 9, 'Rejoice greatly, O daughter of Zion; shout, O daughter of Jerusalem: behold, thy King cometh unto thee: he is just, and having salvation; lowly, and riding upon an ass, and upon a colt the foal of an ass.', ['King of Zion', 'Lowly']),
  v('ZEC', 12, 10, 'And I will pour upon the house of David, and upon the inhabitants of Jerusalem, the spirit of grace and of supplications: and they shall look upon me whom they have pierced, and they shall mourn for him, as one mourneth for his only son, and shall be in bitterness for him, as one that is in bitterness for his firstborn.', ['Pierced', 'Spirit of Grace']),
  v('MAL', 3, 1, 'Behold, I will send my messenger, and he shall prepare the way before me: and the Lord, whom ye seek, shall suddenly come to his temple, even the messenger of the covenant, whom ye delight in: behold, he shall come, saith the LORD of hosts.', ['Messenger of the Covenant', 'Temple']),

  // MATTHEW 1, 2, 4, 5, 6, 11, 24, 27, 28 & MARK 10
  v('MAT', 1, 23, 'Behold, a virgin shall be with child, and shall bring forth a son, and they shall call his name Emmanuel, which being interpreted is, God with us.', ['Emmanuel', 'Incarnation']),
  v('MAT', 2, 6, 'And thou Bethlehem, in the land of Juda, art not the least among the princes of Juda: for out of thee shall come a Governor, that shall rule my people Israel.', ['Bethlehem']),
  v('MAT', 4, 13, 'And leaving Nazareth, he came and dwelt in Capernaum, which is upon the sea coast, in the borders of Zabulon and Nephthalim:', ['Nazareth', 'Capernaum', 'Galilee']),
  v('MAT', 5, 17, 'Think not that I am come to destroy the law, or the prophets: I am not come to destroy, but to fulfil.', ['Law and Prophets']),
  v('MAT', 6, 9, 'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.', ['Lord\'s Prayer', 'Prayer']),
  v('MAT', 6, 10, 'Thy kingdom come. Thy will be done in earth, as it is in heaven.', ['Kingdom of God', 'Prayer']),
  v('MAT', 11, 28, 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', ['Rest', 'Invitation']),
  v('MAT', 24, 30, 'And then shall appear the sign of the Son of man in heaven: and then shall all the tribes of the earth mourn, and they shall see the Son of man coming in the clouds of heaven with power and great glory.', ['Second Coming', 'Clouds of Heaven']),
  v('MAT', 27, 46, 'And about the ninth hour Jesus cried with a loud voice, saying, Eli, Eli, lama sabachthani? that is to say, My God, my God, why hast thou forsaken me?', ['Crucifixion']),
  v('MAT', 27, 51, 'And, behold, the veil of the temple was rent in twain from the top to the bottom; and the earth did quake, and the rocks rent;', ['Veil Rent', 'Sanctuary']),
  v('MAT', 28, 19, 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:', ['Great Commission']),
  v('MRK', 10, 45, 'For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many.', ['Ransom', 'Servant']),

  // LUKE 2, 4 & 24
  v('LUK', 2, 4, 'And Joseph also went up from Galilee, out of the city of Nazareth, into Judaea, unto the city of David, which is called Bethlehem; (because he was of the house and lineage of David:)', ['Galilee', 'Nazareth', 'Bethlehem']),
  v('LUK', 4, 18, 'The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor; he hath sent me to heal the brokenhearted, to preach deliverance to the captives, and recovering of sight to the blind, to set at liberty them that are bruised,', ['Gospel', 'Anointed']),
  v('LUK', 24, 27, 'And beginning at Moses and all the prophets, he expounded unto them in all the scriptures the things concerning himself.', ['Christ in All Scripture']),

  // JOHN 1 (Prologue)
  v('JHN', 1, 1, 'In the beginning was the Word, and the Word was with God, and the Word was God.', ['Logos', 'The Word', 'Deity']),
  v('JHN', 1, 2, 'The same was in the beginning with God.'),
  v('JHN', 1, 3, 'All things were made by him; and without him was not any thing made that was made.', ['Creation']),
  v('JHN', 1, 4, 'In him was life; and the life was the light of men.', ['Life', 'Light']),
  v('JHN', 1, 14, 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.', ['Incarnation', 'Tabernacled', 'Grace and Truth']),
  v('JHN', 1, 29, 'The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.', ['Lamb of God']),

  // JOHN 3 (Complete conversation core)
  v('JHN', 3, 3, 'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.', ['New Birth', 'Kingdom of God']),
  v('JHN', 3, 14, 'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:', ['Lifted Up', 'Typology']),
  v('JHN', 3, 15, 'That whosoever believeth in him should not perish, but have eternal life.', ['Belief', 'Eternal Life']),
  v('JHN', 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', ['Love of God', 'Gospel', 'Eternal Life']),
  v('JHN', 3, 17, 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.', ['Salvation']),

  // JOHN 5, 6, 8, 11, 14
  v('JHN', 5, 39, 'Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.', ['Scripture Testimony']),
  v('JHN', 6, 35, 'And Jesus said unto them, I am the bread of life: he that cometh to me shall never hunger; and he that believeth on me shall never thirst.', ['Bread of Life']),
  v('JHN', 8, 12, 'Then spake Jesus again unto them, saying, I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.', ['Light of the World']),
  v('JHN', 10, 11, 'I am the good shepherd: the good shepherd giveth his life for the sheep.', ['Good Shepherd']),
  v('JHN', 11, 25, 'Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live:', ['Resurrection', 'Life']),
  v('JHN', 14, 1, 'Let not your heart be troubled: ye believe in God, believe also in me.'),
  v('JHN', 14, 2, 'In my Father\'s house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.'),
  v('JHN', 14, 3, 'And if I go and prepare a place for you, I will come again, and receive you unto myself; that where I am, there ye may be also.', ['Second Coming']),
  v('JHN', 14, 6, 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', ['Way, Truth, Life']),

  // ACTS 1, 2, 4, 9, 11, 13, 16, 17, 18, 19, 28
  v('ACT', 1, 11, 'Which also said, Ye men of Galilee, why stand ye gazing up into heaven? this same Jesus, which is taken up from you into heaven, shall so come in like manner as ye have seen him go into heaven.', ['Ascension', 'Second Coming']),
  v('ACT', 1, 12, 'Then returned they unto Jerusalem from the mount called Olivet, which is from Jerusalem a sabbath day\'s journey.', ['Mount of Olives', 'Jerusalem']),
  v('ACT', 2, 17, 'And it shall come to pass in the last days, saith God, I will pour out of my Spirit upon all flesh: and your sons and your daughters shall prophesy, and your young men shall see visions, and your old men shall dream dreams:', ['Pentecost', 'Holy Spirit']),
  v('ACT', 2, 27, 'Because thou wilt not leave my soul in hell, neither wilt thou suffer thine Holy One to see corruption.', ['Resurrection']),
  v('ACT', 4, 12, 'Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.', ['Salvation']),
  v('ACT', 9, 3, 'And as he journeyed, he came near Damascus: and suddenly there shined round about him a light from heaven:', ['Damascus', 'Paul']),
  v('ACT', 11, 26, 'And when he had found him, he brought him unto Antioch. And it came to pass, that a whole year they assembled themselves with the church, and taught much people. And the disciples were called Christians first in Antioch.', ['Antioch', 'Christians']),
  v('ACT', 13, 4, 'So they, being sent forth by the Holy Ghost, departed unto Seleucia; and from thence they sailed to Cyprus.', ['First Missionary Journey', 'Cyprus']),
  v('ACT', 16, 9, 'And a vision appeared to Paul in the night; There stood a man of Macedonia, and prayed him, saying, Come over into Macedonia, and help us.', ['Macedonia', 'Second Missionary Journey']),
  v('ACT', 17, 22, 'Then Paul stood in the midst of Mars\' hill, and said, Ye men of Athens, I perceive that in all things ye are too superstitious.', ['Athens', 'Areopagus']),
  v('ACT', 18, 1, 'After these things Paul departed from Athens, and came to Corinth;', ['Corinth', 'Athens']),
  v('ACT', 19, 1, 'And it came to pass, that, while Apollos was at Corinth, Paul having passed through the upper coasts came to Ephesus: and finding certain disciples,', ['Ephesus', 'Corinth']),
  v('ACT', 28, 14, 'Where we found brethren, and were desired to tarry with them seven days: and so we went toward Rome.', ['Rome', 'Voyage to Rome']),

  // ROMANS 1, 3, 5, 6, 8
  v('ROM', 1, 17, 'For therein is the righteousness of God revealed from faith to faith: as it is written, The just shall live by faith.', ['Righteousness', 'Faith']),
  v('ROM', 3, 23, 'For all have sinned, and come short of the glory of God;', ['Sin']),
  v('ROM', 3, 24, 'Being justified freely by his grace through the redemption that is in Christ Jesus:', ['Justification', 'Grace', 'Redemption']),
  v('ROM', 3, 25, 'Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;', ['Propitiation', 'Mercy Seat']),
  v('ROM', 5, 8, 'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.', ['Love of God', 'Redemption']),
  v('ROM', 6, 23, 'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.', ['Grace', 'Eternal Life']),
  v('ROM', 8, 1, 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.', ['No Condemnation']),
  v('ROM', 8, 34, 'Who is he that condemneth? It is Christ that died, yea rather, that is risen again, who is even at the right hand of God, who also maketh intercession for us.', ['Intercession']),
  v('ROM', 10, 9, 'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.', ['Salvation', 'Resurrection']),

  // 1 CORINTHIANS 5 & 15 & 2 CORINTHIANS 5
  v('1CO', 5, 7, 'Purge out therefore the old leaven, that ye may be a new lump, as ye are unleavened. For even Christ our passover is sacrificed for us:', ['Christ our Passover']),
  v('1CO', 15, 3, 'For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;', ['Gospel']),
  v('1CO', 15, 4, 'And that he was buried, and that he rose again the third day according to the scriptures:', ['Resurrection']),
  v('1CO', 15, 20, 'But now is Christ risen from the dead, and become the firstfruits of them that slept.', ['Firstfruits', 'Resurrection']),
  v('1CO', 15, 52, 'In a moment, in the twinkling of an eye, at the last trump: for the trumpet shall sound, and the dead shall be raised incorruptible, and we shall be changed.', ['Resurrection', 'Last Trump']),
  v('2CO', 5, 17, 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.', ['New Creation']),

  // GALATIANS 3 & EPHESIANS 2, 5 & PHILIPPIANS 2 & COLOSSIANS 1 & 1 THESSALONIANS 4 & TITUS 3
  v('GAL', 3, 13, 'Christ hath redeemed us from the curse of the law, being made a curse for us: for it is written, Cursed is every one that hangeth on a tree:', ['Redemption']),
  v('GAL', 3, 16, 'Now to Abraham and his seed were the promises made. He saith not, And to seeds, as of many; but as of one, And to thy seed, which is Christ.', ['Seed', 'Covenant']),
  v('EPH', 2, 8, 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:', ['Grace', 'Faith']),
  v('EPH', 2, 9, 'Not of works, lest any man should boast.'),
  v('EPH', 5, 26, 'That he might sanctify and cleanse it with the washing of water by the word,', ['Washing of Water', 'Word']),
  v('PHP', 2, 6, 'Who, being in the form of God, thought it not robbery to be equal with God:', ['Deity of Christ']),
  v('PHP', 2, 7, 'But made himself of no reputation, and took upon him the form of a servant, and was made in the likeness of men:', ['Incarnation']),
  v('PHP', 2, 8, 'And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross.', ['Humility', 'Cross']),
  v('COL', 1, 15, 'Who is the image of the invisible God, the firstborn of every creature:', ['Image of God', 'Christology']),
  v('COL', 1, 16, 'For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:', ['Creation']),
  v('1TH', 4, 16, 'For the Lord himself shall descend from heaven with a shout, with the voice of the archangel, and with the trump of God: and the dead in Christ shall rise first:', ['Second Coming', 'Resurrection']),
  v('1TH', 4, 17, 'Then we which are alive and remain shall be caught up together with them in the clouds, to meet the Lord in the air: and so shall we ever be with the Lord.'),
  v('TIT', 3, 5, 'Not by works of righteousness which we have done, but according to his mercy he saved us, by the washing of regeneration, and renewing of the Holy Ghost;', ['Washing of Regeneration']),

  // HEBREWS 1, 4, 7, 8, 9, 10, 11, 13
  v('HEB', 1, 2, 'Hath in these last days spoken unto us by his Son, whom he hath appointed heir of all things, by whom also he made the worlds;', ['Creation', 'Son']),
  v('HEB', 1, 3, 'Who being the brightness of his glory, and the express image of his person, and upholding all things by the word of his power, when he had by himself purged our sins, sat down on the right hand of the Majesty on high;', ['Right Hand', 'Purged Sins']),
  v('HEB', 4, 9, 'There remaineth therefore a rest to the people of God.', ['Sabbath Rest']),
  v('HEB', 4, 14, 'Seeing then that we have a great high priest, that is passed into the heavens, Jesus the Son of God, let us hold fast our profession.', ['High Priest']),
  v('HEB', 4, 16, 'Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.', ['Throne of Grace', 'Prayer']),
  v('HEB', 7, 25, 'Wherefore he is able also to save them to the uttermost that come unto God by him, seeing he ever liveth to make intercession for them.', ['Intercession']),
  v('HEB', 8, 1, 'Now of the things which we have spoken this is the sum: We have such an high priest, who is set on the right hand of the throne of the Majesty in the heavens;', ['Heavenly Sanctuary', 'High Priest']),
  v('HEB', 8, 2, 'A minister of the sanctuary, and of the true tabernacle, which the Lord pitched, and not man.', ['True Tabernacle']),
  v('HEB', 8, 5, 'Who serve unto the example and shadow of heavenly things, as Moses was admonished of God when he was about to make the tabernacle: for, See, saith he, that thou make all things according to the pattern shewed to thee in the mount.', ['Pattern', 'Shadow']),
  v('HEB', 9, 2, 'For there was a tabernacle made; the first, wherein was the candlestick, and the table, and the shewbread; which is called the sanctuary.', ['Holy Place', 'Candlestick', 'Showbread']),
  v('HEB', 9, 3, 'And after the second veil, the tabernacle which is called the Holiest of all;', ['Most Holy Place', 'Second Veil']),
  v('HEB', 9, 4, 'Which had the golden censer, and the ark of the covenant overlaid round about with gold, wherein was the golden pot that had manna, and Aaron\'s rod that budded, and the tables of the covenant;', ['Ark of the Covenant', 'Golden Censer']),
  v('HEB', 9, 6, 'Now when these things were thus ordained, the priests went always into the first tabernacle, accomplishing the service of God.', ['Daily Ministry', 'Holy Place']),
  v('HEB', 9, 7, 'But into the second went the high priest alone once every year, not without blood, which he offered for himself, and for the errors of the people:', ['Day of Atonement', 'High Priest']),
  v('HEB', 9, 11, 'But Christ being come an high priest of good things to come, by a greater and more perfect tabernacle, not made with hands, that is to say, not of this building;', ['Heavenly Sanctuary']),
  v('HEB', 9, 12, 'Neither by the blood of goats and calves, but by his own blood he entered in once into the holy place, having obtained eternal redemption for us.', ['Redemption', 'Blood']),
  v('HEB', 9, 22, 'And almost all things are by the law purged with blood; and without shedding of blood is no remission.', ['Remission', 'Blood']),
  v('HEB', 9, 24, 'For Christ is not entered into the holy places made with hands, which are the figures of the true; but into heaven itself, now to appear in the presence of God for us:', ['Sanctuary', 'Intercession']),
  v('HEB', 10, 19, 'Having therefore, brethren, boldness to enter into the holiest by the blood of Jesus,', ['Holiest', 'Veil']),
  v('HEB', 10, 20, 'By a new and living way, which he hath consecrated for us, through the veil, that is to say, his flesh;', ['Veil', 'Living Way']),
  v('HEB', 11, 1, 'Now faith is the substance of things hoped for, the evidence of things not seen.', ['Faith']),
  v('HEB', 11, 3, 'Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.', ['Faith', 'Creation']),
  v('HEB', 13, 10, 'We have an altar, whereof they have no right to eat which serve the tabernacle.', ['Altar', 'Christ']),

  // JAMES 2, 1 PETER 1-2, 2 PETER 1, 1 JOHN 4
  v('JAS', 2, 17, 'Even so faith, if it hath not works, is dead, being alone.', ['Faith and Works']),
  v('1PE', 1, 18, 'Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers;', ['Redemption']),
  v('1PE', 1, 19, 'But with the precious blood of Christ, as of a lamb without blemish and without spot:', ['Lamb Without Blemish']),
  v('1PE', 2, 24, 'Who his own self bare our sins in his own body on the tree, that we, being dead to sins, should live unto righteousness: by whose stripes ye were healed.', ['Stripes', 'Sin Bearer']),
  v('2PE', 1, 21, 'For the prophecy came not in old time by the will of man: but holy men of God spake as they were moved by the Holy Ghost.', ['Prophecy', 'Inspiration']),
  v('1JN', 4, 8, 'He that loveth not knoweth not God; for God is love.', ['God is Love', 'Character of God']),
  v('1JN', 4, 9, 'In this was manifested the love of God toward us, because that God sent his only begotten Son into the world, that we might live through him.', ['Love of God']),

  // REVELATION 1, 4, 5, 8, 11, 14, 19, 21, 22
  v('REV', 1, 7, 'Behold, he cometh with clouds; and every eye shall see him, and they also which pierced him: and all kindreds of the earth shall wail because of him. Even so, Amen.', ['Second Coming', 'Clouds']),
  v('REV', 1, 9, 'I John, who also am your brother, and companion in tribulation, and in the kingdom and patience of Jesus Christ, was in the isle that is called Patmos, for the word of God, and for the testimony of Jesus Christ.', ['Patmos', 'Revelation']),
  v('REV', 1, 12, 'And I turned to see the voice that spake with me. And being turned, I saw seven golden candlesticks;', ['Seven Candlesticks', 'Heavenly Sanctuary']),
  v('REV', 4, 5, 'And out of the throne proceeded lightnings and thunderings and voices: and there were seven lamps of fire burning before the throne, which are the seven Spirits of God.', ['Seven Lamps', 'Seven Spirits']),
  v('REV', 5, 6, 'And I beheld, and, lo, in the midst of the throne and of the four beasts, and in the midst of the elders, stood a Lamb as it had been slain, having seven horns and seven eyes, which are the seven Spirits of God sent forth into all the earth.', ['Lamb Slain', 'Throne']),
  v('REV', 5, 9, 'And they sung a new song, saying, Thou art worthy to take the book, and to open the seals thereof: for thou wast slain, and hast redeemed us to God by thy blood out of every kindred, and tongue, and people, and nation;', ['Redemption', 'Blood']),
  v('REV', 8, 3, 'And another angel came and stood at the altar, having a golden censer; and there was given unto him much incense, that he should offer it with the prayers of all saints upon the golden altar which was before the throne.', ['Golden Altar', 'Incense', 'Prayers']),
  v('REV', 11, 19, 'And the temple of God was opened in heaven, and there was seen in his temple the ark of his testament: and there were lightnings, and voices, and thunderings, and an earthquake, and great hail.', ['Heavenly Temple', 'Ark of Testament']),
  v('REV', 14, 6, 'And I saw another angel fly in the midst of heaven, having the everlasting gospel to preach unto them that dwell on the earth, and to every nation, and kindred, and tongue, and people,', ['Everlasting Gospel']),
  v('REV', 14, 7, 'Saying with a loud voice, Fear God, and give glory to him; for the hour of his judgment is come: and worship him that made heaven, and earth, and the sea, and the fountains of waters.', ['Judgment', 'Worship Creator']),
  v('REV', 19, 16, 'And he hath on his vesture and on his thigh a name written, KING OF KINGS, AND LORD OF LORDS.', ['King of Kings']),
  v('REV', 21, 1, 'And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away; and there was no more sea.', ['New Heaven and Earth']),
  v('REV', 21, 3, 'And I heard a great voice out of heaven saying, Behold, the tabernacle of God is with men, and he will dwell with them, and they shall be his people, and God himself shall be with them, and be their God.', ['Tabernacle of God', 'Dwelling']),
  v('REV', 21, 4, 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.', ['No More Death']),
  v('REV', 22, 12, 'And, behold, I come quickly; and my reward is with me, to give every man according as his work shall be.', ['Second Coming']),
  v('REV', 22, 20, 'He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus.', ['Maranatha']),
];

export const VERSE_MAP: Record<string, Verse> = Object.fromEntries(
  SAMPLE_VERSES.map((verse) => [verse.id, verse])
);

export const SAMPLE_CHAPTERS: BibleChapter[] = (() => {
  const map = new Map<string, BibleChapter>();
  for (const verse of SAMPLE_VERSES) {
    const chId = `${verse.bookId}.${verse.chapter}`;
    if (!map.has(chId)) {
      map.set(chId, {
        id: chId,
        bookId: verse.bookId,
        chapterNumber: verse.chapter,
        verseIds: [],
      });
    }
    map.get(chId)!.verseIds.push(verse.id);
  }
  return Array.from(map.values());
})();
