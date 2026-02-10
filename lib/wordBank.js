const BANK_SIZE = 365;

const EN_SCENES = [
  { desc: 'a rainy city street at dusk', tag: 'daily' },
  { desc: 'a quiet library with warm lamp light', tag: 'study' },
  { desc: 'friends talking in a late-night cafe', tag: 'social' },
  { desc: 'a shoreline at golden hour', tag: 'nature' },
  { desc: 'a handwritten letter on a wooden desk', tag: 'emotional' },
  { desc: 'a train station reunion hug', tag: 'romantic' },
  { desc: 'a focused studio workspace', tag: 'work' },
  { desc: 'a calm morning walk in the park', tag: 'daily' },
  { desc: 'a mountain trail in fresh air', tag: 'nature' },
  { desc: 'a softly lit music room', tag: 'emotional' },
  { desc: 'a thoughtful conversation on a balcony', tag: 'social' },
  { desc: 'a notebook filled with ideas', tag: 'study' },
];

const COMMON_SCENES = [
  { desc: 'a cozy kitchen at home', tag: 'daily' },
  { desc: 'a park bench in spring', tag: 'daily' },
  { desc: 'a rainy window and warm tea', tag: 'emotional' },
  { desc: 'a sunset walk side by side', tag: 'romantic' },
  { desc: 'a small flower shop', tag: 'daily' },
  { desc: 'a quiet bedroom at night', tag: 'emotional' },
  { desc: 'a city street after rain', tag: 'daily' },
  { desc: 'a friendly cafe corner', tag: 'social' },
  { desc: 'a family dinner table', tag: 'daily' },
  { desc: 'a train platform meeting', tag: 'romantic' },
  { desc: 'a peaceful riverside path', tag: 'nature' },
  { desc: 'a warm living room with soft light', tag: 'daily' },
];

const EN_VARIANTS = ['today', 'at dawn', 'tonight', 'in practice', 'in reflection', 'in conversation', 'with intention', 'in daily life'];
const UK_VARIANTS = [
  { native: 'сьогодні', romanization: 'sohodni', meaning: 'today' },
  { native: 'зараз', romanization: 'zaraz', meaning: 'now' },
  { native: 'ввечері', romanization: 'vvecheri', meaning: 'in the evening' },
  { native: 'вранці', romanization: 'vrantsi', meaning: 'in the morning' },
  { native: 'завжди', romanization: 'zavzhdy', meaning: 'always' },
  { native: 'щиро', romanization: 'shchyro', meaning: 'sincerely' },
  { native: 'разом', romanization: 'razom', meaning: 'together' },
  { native: 'тихо', romanization: 'tykho', meaning: 'quietly' },
];
const FA_VARIANTS = [
  { native: 'امروز', romanization: 'emrooz', meaning: 'today' },
  { native: 'الان', romanization: 'alan', meaning: 'now' },
  { native: 'امشب', romanization: 'emshab', meaning: 'tonight' },
  { native: 'صبح', romanization: 'sobh', meaning: 'in the morning' },
  { native: 'همیشه', romanization: 'hamisheh', meaning: 'always' },
  { native: 'آرام', romanization: 'aram', meaning: 'calmly' },
  { native: 'با هم', romanization: 'ba ham', meaning: 'together' },
  { native: 'آهسته', romanization: 'aheste', meaning: 'gently' },
];

const EN_SEEDS = [
  { native: 'ephemeral', romanization: 'ih-FEM-er-uhl', type: 'Adjective', meaning_en: 'lasting for a very short time', sentence_native: 'The feeling was ephemeral but unforgettable.' },
  { native: 'nuanced', romanization: 'NOO-ahnst', type: 'Adjective', meaning_en: 'showing subtle differences', sentence_native: 'Her answer was nuanced and thoughtful.' },
  { native: 'resilient', romanization: 'ri-ZIL-yuhnt', type: 'Adjective', meaning_en: 'able to recover quickly', sentence_native: 'He stayed resilient after a difficult week.' },
  { native: 'meticulous', romanization: 'muh-TIK-yuh-luhs', type: 'Adjective', meaning_en: 'very careful and precise', sentence_native: 'She made a meticulous plan for the project.' },
  { native: 'serendipity', romanization: 'ser-uhn-DIP-uh-tee', type: 'Noun', meaning_en: 'a lucky and pleasant discovery', sentence_native: 'Meeting there felt like pure serendipity.' },
  { native: 'eloquent', romanization: 'EL-uh-kwuhnt', type: 'Adjective', meaning_en: 'fluent and persuasive in speaking', sentence_native: 'His speech was brief but eloquent.' },
  { native: 'contemplative', romanization: 'kuhn-TEM-pluh-tiv', type: 'Adjective', meaning_en: 'deeply thoughtful', sentence_native: 'She sat in a contemplative silence.' },
  { native: 'fortitude', romanization: 'FOR-ti-tood', type: 'Noun', meaning_en: 'strength in adversity', sentence_native: 'They faced uncertainty with fortitude.' },
  { native: 'enigmatic', romanization: 'en-ig-MAT-ik', type: 'Adjective', meaning_en: 'mysterious and hard to interpret', sentence_native: 'His smile looked enigmatic in the photo.' },
  { native: 'compelling', romanization: 'kuhm-PEL-ing', type: 'Adjective', meaning_en: 'capturing attention strongly', sentence_native: 'Her story was compelling from start to finish.' },
  { native: 'pragmatic', romanization: 'prag-MAT-ik', type: 'Adjective', meaning_en: 'practical and realistic', sentence_native: 'We chose a pragmatic solution.' },
  { native: 'catharsis', romanization: 'kuh-THAR-sis', type: 'Noun', meaning_en: 'emotional release', sentence_native: 'Writing became a form of catharsis.' },
  { native: 'ambivalent', romanization: 'am-BIV-uh-luhnt', type: 'Adjective', meaning_en: 'having mixed feelings', sentence_native: 'She felt ambivalent about the move.' },
  { native: 'impeccable', romanization: 'im-PEK-uh-buhl', type: 'Adjective', meaning_en: 'without flaws', sentence_native: 'His timing was impeccable.' },
  { native: 'discern', romanization: 'di-SURN', type: 'Verb', meaning_en: 'to recognize clearly', sentence_native: 'You can discern the pattern with patience.' },
  { native: 'tangible', romanization: 'TAN-juh-buhl', type: 'Adjective', meaning_en: 'clear and noticeable', sentence_native: 'There was a tangible sense of relief.' },
  { native: 'transcend', romanization: 'tran-SEND', type: 'Verb', meaning_en: 'to go beyond ordinary limits', sentence_native: 'Great art can transcend language.' },
  { native: 'equilibrium', romanization: 'ee-kwuh-LIB-ree-uhm', type: 'Noun', meaning_en: 'a state of balance', sentence_native: 'He worked to regain equilibrium.' },
  { native: 'candid', romanization: 'KAN-did', type: 'Adjective', meaning_en: 'honest and straightforward', sentence_native: 'We had a candid conversation.' },
  { native: 'solace', romanization: 'SOL-iss', type: 'Noun', meaning_en: 'comfort in sadness', sentence_native: 'Music gave her solace.' },
  { native: 'profound', romanization: 'pruh-FOUND', type: 'Adjective', meaning_en: 'very deep or meaningful', sentence_native: 'The quiet moment felt profound.' },
  { native: 'articulate', romanization: 'ar-TIK-yuh-lit', type: 'Adjective', meaning_en: 'able to express ideas clearly', sentence_native: 'He was articulate under pressure.' },
  { native: 'fervent', romanization: 'FUR-vuhnt', type: 'Adjective', meaning_en: 'showing strong passion', sentence_native: 'She made a fervent promise.' },
  { native: 'subtle', romanization: 'SUT-l', type: 'Adjective', meaning_en: 'delicate and not obvious', sentence_native: 'The change was subtle but important.' },
  { native: 'poignant', romanization: 'POIN-yuhnt', type: 'Adjective', meaning_en: 'evoking strong emotion', sentence_native: 'The ending was poignant.' },
  { native: 'coherent', romanization: 'koh-HEER-uhnt', type: 'Adjective', meaning_en: 'logical and consistent', sentence_native: 'Her explanation was coherent.' },
  { native: 'diligent', romanization: 'DIL-uh-juhnt', type: 'Adjective', meaning_en: 'hard-working and careful', sentence_native: 'They stayed diligent throughout the semester.' },
  { native: 'whimsical', romanization: 'WIM-zi-kuhl', type: 'Adjective', meaning_en: 'playful and imaginative', sentence_native: 'The illustration had a whimsical charm.' },
  { native: 'tenacious', romanization: 'tuh-NAY-shuhs', type: 'Adjective', meaning_en: 'persistent and determined', sentence_native: 'She remained tenacious during recovery.' },
  { native: 'integrity', romanization: 'in-TEG-ri-tee', type: 'Noun', meaning_en: 'strong moral honesty', sentence_native: 'Trust grows where integrity is visible.' },
  { native: 'empathy', romanization: 'EM-puh-thee', type: 'Noun', meaning_en: 'understanding others feelings', sentence_native: 'Empathy changed the tone of the meeting.' },
  { native: 'nostalgia', romanization: 'no-STAL-juh', type: 'Noun', meaning_en: 'sentimental longing for the past', sentence_native: 'That song brought immediate nostalgia.' },
  { native: 'momentum', romanization: 'moh-MEN-tuhm', type: 'Noun', meaning_en: 'forward progress or drive', sentence_native: 'Small wins built momentum.' },
  { native: 'cornerstone', romanization: 'KOR-ner-stohn', type: 'Noun', meaning_en: 'an essential foundation', sentence_native: 'Consistency became the cornerstone of success.' },
  { native: 'synthesis', romanization: 'SIN-thuh-sis', type: 'Noun', meaning_en: 'combining ideas into a whole', sentence_native: 'Her report was a strong synthesis of research.' },
  { native: 'versatile', romanization: 'VUR-suh-tl', type: 'Adjective', meaning_en: 'able to adapt to many roles', sentence_native: 'He is versatile across different tasks.' },
  { native: 'austere', romanization: 'aw-STEER', type: 'Adjective', meaning_en: 'simple and plain in style', sentence_native: 'The room looked austere but peaceful.' },
  { native: 'vivid', romanization: 'VIV-id', type: 'Adjective', meaning_en: 'clear and bright in detail', sentence_native: 'She gave a vivid description.' },
  { native: 'deliberate', romanization: 'di-LIB-er-it', type: 'Adjective', meaning_en: 'done carefully and intentionally', sentence_native: 'Every step was deliberate.' },
  { native: 'seamless', romanization: 'SEEM-luhs', type: 'Adjective', meaning_en: 'smooth with no interruptions', sentence_native: 'The transition was seamless.' },
  { native: 'reverence', romanization: 'REV-er-uhns', type: 'Noun', meaning_en: 'deep respect', sentence_native: 'They spoke with reverence about their teacher.' },
  { native: 'conviction', romanization: 'kuhn-VIK-shuhn', type: 'Noun', meaning_en: 'firm belief', sentence_native: 'She answered with calm conviction.' },
  { native: 'synergy', romanization: 'SIN-er-jee', type: 'Noun', meaning_en: 'combined effect stronger than parts', sentence_native: 'Their collaboration created synergy.' },
  { native: 'paradigm', romanization: 'PAR-uh-dime', type: 'Noun', meaning_en: 'a model or framework', sentence_native: 'The team adopted a new paradigm.' },
  { native: 'quiet confidence', romanization: 'KWAI-uht KON-fi-duhns', type: 'Phrase', meaning_en: 'calm and steady self-belief', sentence_native: 'She entered the room with quiet confidence.' },
  { native: 'meaningful pause', romanization: 'MEE-ning-fuhl PAWZ', type: 'Phrase', meaning_en: 'a silence that adds meaning', sentence_native: 'A meaningful pause changed the conversation.' },
  { native: 'heartfelt apology', romanization: 'HART-felt uh-POL-uh-jee', type: 'Phrase', meaning_en: 'a sincere expression of regret', sentence_native: 'He offered a heartfelt apology.' },
  { native: 'mutual respect', romanization: 'MYOO-choo-uhl ri-SPEKT', type: 'Phrase', meaning_en: 'respect shared by both sides', sentence_native: 'Their partnership was built on mutual respect.' },
  { native: 'mindful presence', romanization: 'MIND-fuhl PREZ-uhns', type: 'Phrase', meaning_en: 'fully attentive awareness in the moment', sentence_native: 'Her mindful presence calmed everyone.' },
  { native: 'steady progress', romanization: 'STED-ee PROG-res', type: 'Phrase', meaning_en: 'consistent gradual improvement', sentence_native: 'Steady progress won the long game.' },
  { native: 'grateful heart', romanization: 'GRAYT-fuhl HART', type: 'Phrase', meaning_en: 'a lasting feeling of gratitude', sentence_native: 'She left with a grateful heart.' },
];

const UK_SEEDS = [
  { native: 'Привіт', romanization: 'Pryvit', type: 'Phrase', meaning_en: 'Hi' },
  { native: 'Доброго ранку', romanization: 'Dobroho ranku', type: 'Phrase', meaning_en: 'Good morning' },
  { native: 'Добрий вечір', romanization: 'Dobryi vechir', type: 'Phrase', meaning_en: 'Good evening' },
  { native: 'На добраніч', romanization: 'Na dobranich', type: 'Phrase', meaning_en: 'Good night' },
  { native: 'Дякую', romanization: 'Diakuiu', type: 'Phrase', meaning_en: 'Thank you' },
  { native: 'Будь ласка', romanization: 'Bud laska', type: 'Phrase', meaning_en: 'Please / You are welcome' },
  { native: 'Перепрошую', romanization: 'Pereproshuiu', type: 'Phrase', meaning_en: 'Excuse me' },
  { native: 'Я тебе люблю', romanization: 'Ya tebe liubliu', type: 'Phrase', meaning_en: 'I love you' },
  { native: 'Я сумую за тобою', romanization: 'Ya sumuiu za toboiu', type: 'Phrase', meaning_en: 'I miss you' },
  { native: 'Обійми мене', romanization: 'Obiimy mene', type: 'Phrase', meaning_en: 'Hug me' },
  { native: 'Ти мені подобаєшся', romanization: 'Ty meni podobaieshsia', type: 'Phrase', meaning_en: 'I like you' },
  { native: 'Мені сумно', romanization: 'Meni sumno', type: 'Phrase', meaning_en: 'I am sad' },
  { native: 'Я щасливий', romanization: 'Ya shchaslyvyi', type: 'Phrase', meaning_en: 'I am happy' },
  { native: 'Все добре', romanization: 'Vse dobre', type: 'Phrase', meaning_en: 'Everything is good' },
  { native: 'Як справи?', romanization: 'Yak spravy?', type: 'Phrase', meaning_en: 'How are you?' },
  { native: 'Я втомився', romanization: 'Ya vtomyvsia', type: 'Phrase', meaning_en: 'I am tired' },
  { native: 'Мені потрібна кава', romanization: 'Meni potribna kava', type: 'Phrase', meaning_en: 'I need coffee' },
  { native: 'Ходімо гуляти', romanization: 'Khodimo huliaty', type: 'Phrase', meaning_en: 'Lets go for a walk' },
  { native: 'Я вдома', romanization: 'Ya vdoma', type: 'Phrase', meaning_en: 'I am home' },
  { native: 'Я на роботі', romanization: 'Ya na roboti', type: 'Phrase', meaning_en: 'I am at work' },
  { native: 'До зустрічі', romanization: 'Do zustrichi', type: 'Phrase', meaning_en: 'See you' },
  { native: 'Гарного дня', romanization: 'Harnoho dnia', type: 'Phrase', meaning_en: 'Have a nice day' },
  { native: 'Ти чудова', romanization: 'Ty chudova', type: 'Phrase', meaning_en: 'You are wonderful' },
  { native: 'Мені тебе не вистачає', romanization: 'Meni tebe ne vystachaie', type: 'Phrase', meaning_en: 'I miss having you here' },
  { native: 'Я поруч', romanization: 'Ya poruch', type: 'Phrase', meaning_en: 'I am here with you' },
  { native: 'Не хвилюйся', romanization: 'Ne khvyliuisia', type: 'Phrase', meaning_en: 'Do not worry' },
  { native: 'Все буде добре', romanization: 'Vse bude dobre', type: 'Phrase', meaning_en: 'Everything will be okay' },
  { native: 'Це дуже смачно', romanization: 'Tse duzhe smachno', type: 'Phrase', meaning_en: 'This is very tasty' },
  { native: 'Я люблю музику', romanization: 'Ya liubliu muzyku', type: 'Phrase', meaning_en: 'I love music' },
  { native: 'Я люблю дощ', romanization: 'Ya liubliu doshch', type: 'Phrase', meaning_en: 'I love rain' },
  { native: 'Теплий чай', romanization: 'Teplyi chai', type: 'Phrase', meaning_en: 'Warm tea' },
  { native: 'Чудовий день', romanization: 'Chudovyi den', type: 'Phrase', meaning_en: 'Wonderful day' },
  { native: 'Тиха ніч', romanization: 'Tykha nich', type: 'Phrase', meaning_en: 'Quiet night' },
  { native: 'Щаслива мить', romanization: 'Shchaslyva myt', type: 'Phrase', meaning_en: 'Happy moment' },
  { native: 'Серце спокійне', romanization: 'Sertse spokiine', type: 'Phrase', meaning_en: 'The heart is calm' },
  { native: 'Тримай мою руку', romanization: 'Trymai moiu ruku', type: 'Phrase', meaning_en: 'Hold my hand' },
  { native: 'Посміхнись', romanization: 'Posmikhnys', type: 'Phrase', meaning_en: 'Smile' },
  { native: 'Я тебе чекаю', romanization: 'Ya tebe chekaiu', type: 'Phrase', meaning_en: 'I am waiting for you' },
  { native: 'Ми разом', romanization: 'My razom', type: 'Phrase', meaning_en: 'We are together' },
  { native: 'Я розумію', romanization: 'Ya rozumiiu', type: 'Phrase', meaning_en: 'I understand' },
  { native: 'Я не розумію', romanization: 'Ya ne rozumiiu', type: 'Phrase', meaning_en: 'I do not understand' },
  { native: 'Де ти?', romanization: 'De ty?', type: 'Phrase', meaning_en: 'Where are you?' },
  { native: 'Я тут', romanization: 'Ya tut', type: 'Phrase', meaning_en: 'I am here' },
  { native: 'Це красиво', romanization: 'Tse krasyvo', type: 'Phrase', meaning_en: 'This is beautiful' },
  { native: 'Я вдячний', romanization: 'Ya vdiachnyi', type: 'Phrase', meaning_en: 'I am grateful' },
  { native: 'Я хвилююся', romanization: 'Ya khvyliuiusia', type: 'Phrase', meaning_en: 'I am worried' },
  { native: 'Спокійно', romanization: 'Spokiino', type: 'Phrase', meaning_en: 'Calmly' },
  { native: 'Добре', romanization: 'Dobre', type: 'Phrase', meaning_en: 'Okay' },
  { native: 'До завтра', romanization: 'Do zavtra', type: 'Phrase', meaning_en: 'See you tomorrow' },
  { native: 'Я рада тебе бачити', romanization: 'Ya rada tebe bachyty', type: 'Phrase', meaning_en: 'I am happy to see you' },
  { native: 'Дякую за підтримку', romanization: 'Diakuiu za pidtrymku', type: 'Phrase', meaning_en: 'Thank you for your support' },
];

const FA_SEEDS = [
  { native: 'سلام', romanization: 'salam', type: 'Phrase', meaning_en: 'Hi' },
  { native: 'صبح بخیر', romanization: 'sobh bekheir', type: 'Phrase', meaning_en: 'Good morning' },
  { native: 'شب بخیر', romanization: 'shab bekheir', type: 'Phrase', meaning_en: 'Good night' },
  { native: 'ممنون', romanization: 'mamnoon', type: 'Phrase', meaning_en: 'Thank you' },
  { native: 'خواهش می کنم', romanization: 'khahesh mikonam', type: 'Phrase', meaning_en: 'You are welcome' },
  { native: 'ببخشید', romanization: 'bebakhshid', type: 'Phrase', meaning_en: 'Excuse me' },
  { native: 'دوستت دارم', romanization: 'dooset daram', type: 'Phrase', meaning_en: 'I love you' },
  { native: 'دلم برات تنگ شده', romanization: 'delam barat tang shode', type: 'Phrase', meaning_en: 'I miss you' },
  { native: 'بغلم کن', romanization: 'baghalam kon', type: 'Phrase', meaning_en: 'Hug me' },
  { native: 'خوشحالم', romanization: 'khoshhalam', type: 'Phrase', meaning_en: 'I am happy' },
  { native: 'ناراحتم', romanization: 'narahatam', type: 'Phrase', meaning_en: 'I am sad' },
  { native: 'خوبی؟', romanization: 'khubi?', type: 'Phrase', meaning_en: 'How are you?' },
  { native: 'خوبم', romanization: 'khubam', type: 'Phrase', meaning_en: 'I am fine' },
  { native: 'نگران نباش', romanization: 'negaran nabash', type: 'Phrase', meaning_en: 'Do not worry' },
  { native: 'همه چیز خوبه', romanization: 'hame chiz khoobe', type: 'Phrase', meaning_en: 'Everything is fine' },
  { native: 'بیا قدم بزنیم', romanization: 'bia ghadam bezanim', type: 'Phrase', meaning_en: 'Lets go for a walk' },
  { native: 'من خونه ام', romanization: 'man khoone-am', type: 'Phrase', meaning_en: 'I am home' },
  { native: 'من سر کارم', romanization: 'man sar karam', type: 'Phrase', meaning_en: 'I am at work' },
  { native: 'می بینمت', romanization: 'mibinamet', type: 'Phrase', meaning_en: 'See you' },
  { native: 'روز خوبی داشته باشی', romanization: 'rooz khubi dashte bashi', type: 'Phrase', meaning_en: 'Have a nice day' },
  { native: 'تو فوق العاده ای', romanization: 'to fogholade-i', type: 'Phrase', meaning_en: 'You are wonderful' },
  { native: 'من کنارتم', romanization: 'man kenaretam', type: 'Phrase', meaning_en: 'I am by your side' },
  { native: 'چای گرم', romanization: 'chay garm', type: 'Phrase', meaning_en: 'Warm tea' },
  { native: 'روز قشنگی است', romanization: 'rooz ghashangi ast', type: 'Phrase', meaning_en: 'It is a beautiful day' },
  { native: 'شب آرومی است', romanization: 'shab aroumi ast', type: 'Phrase', meaning_en: 'It is a calm night' },
  { native: 'لحظه ی قشنگ', romanization: 'lahze-ye ghashang', type: 'Phrase', meaning_en: 'Beautiful moment' },
  { native: 'دستم رو بگیر', romanization: 'dastam ro begir', type: 'Phrase', meaning_en: 'Hold my hand' },
  { native: 'لبخند بزن', romanization: 'labkhand bezan', type: 'Phrase', meaning_en: 'Smile' },
  { native: 'منتظرم', romanization: 'montazeram', type: 'Phrase', meaning_en: 'I am waiting' },
  { native: 'ما با همیم', romanization: 'ma ba hamim', type: 'Phrase', meaning_en: 'We are together' },
  { native: 'می فهمم', romanization: 'mifahmam', type: 'Phrase', meaning_en: 'I understand' },
  { native: 'نمی فهمم', romanization: 'nemifahmam', type: 'Phrase', meaning_en: 'I do not understand' },
  { native: 'کجایی؟', romanization: 'kojaei?', type: 'Phrase', meaning_en: 'Where are you?' },
  { native: 'من اینجام', romanization: 'man injam', type: 'Phrase', meaning_en: 'I am here' },
  { native: 'این خیلی قشنگه', romanization: 'in kheili ghashange', type: 'Phrase', meaning_en: 'This is very beautiful' },
  { native: 'سپاسگزارم', romanization: 'sepasgozaram', type: 'Phrase', meaning_en: 'I am grateful' },
  { native: 'نگرانم', romanization: 'negaranam', type: 'Phrase', meaning_en: 'I am worried' },
  { native: 'آرام باش', romanization: 'aram bash', type: 'Phrase', meaning_en: 'Stay calm' },
  { native: 'خوبه', romanization: 'khoobe', type: 'Phrase', meaning_en: 'Okay' },
  { native: 'تا فردا', romanization: 'ta farda', type: 'Phrase', meaning_en: 'See you tomorrow' },
  { native: 'قهوه می خوام', romanization: 'ghahve mikham', type: 'Phrase', meaning_en: 'I want coffee' },
  { native: 'موسیقی دوست دارم', romanization: 'musiqi doost daram', type: 'Phrase', meaning_en: 'I love music' },
  { native: 'بارون رو دوست دارم', romanization: 'baroon ro doost daram', type: 'Phrase', meaning_en: 'I love rain' },
  { native: 'دلتنگتم', romanization: 'deltangetam', type: 'Phrase', meaning_en: 'I miss you deeply' },
  { native: 'نزدیکم', romanization: 'nazdikam', type: 'Phrase', meaning_en: 'I am close by' },
  { native: 'بهت فکر می کنم', romanization: 'behet fekr mikonam', type: 'Phrase', meaning_en: 'I am thinking about you' },
  { native: 'حالت چطوره؟', romanization: 'halet chetore?', type: 'Phrase', meaning_en: 'How are you feeling?' },
  { native: 'امروز خوبه', romanization: 'emrooz khoobe', type: 'Phrase', meaning_en: 'Today is good' },
  { native: 'هوای خوب', romanization: 'havaye khoob', type: 'Phrase', meaning_en: 'Nice weather' },
  { native: 'قلبم آرومه', romanization: 'ghalbam aroome', type: 'Phrase', meaning_en: 'My heart is calm' },
  { native: 'ممنونم ازت', romanization: 'mamnoonam azat', type: 'Phrase', meaning_en: 'Thank you so much' },
  { native: 'خیلی خوشحال شدم', romanization: 'kheili khoshhal shodam', type: 'Phrase', meaning_en: 'I am very glad' },
];

function buildEnglishSentence(seed, scene, variant) {
  const tails = [
    `It became clear in ${scene.desc}.`,
    `You could feel it in ${scene.desc}.`,
    `That idea appeared in ${scene.desc}.`,
    `Everyone noticed it in ${scene.desc}.`,
    `The moment carried it in ${scene.desc}.`,
  ];
  return `${seed.sentence_native} ${tails[variant % tails.length]}`;
}

function createImagePrompt(seed, scene, languageLabel) {
  return [
    `Anime watercolor illustration in a soft cinematic style.`,
    `Scene: ${scene.desc}.`,
    `Focus concept: ${seed.meaning_en}.`,
    `Language context: ${languageLabel}.`,
    `No text, no letters, no subtitles in the image.`,
  ].join(' ');
}

function buildEnglishBank() {
  const entries = [];
  for (let i = 0; i < BANK_SIZE; i += 1) {
    const seed = EN_SEEDS[i % EN_SEEDS.length];
    const scene = EN_SCENES[i % EN_SCENES.length];
    const variant = Math.floor(i / EN_SEEDS.length);
    const suffix = EN_VARIANTS[variant % EN_VARIANTS.length];
    const sentenceNative = buildEnglishSentence(seed, scene, variant);
    const native = variant === 0 ? seed.native : `${seed.native} (${suffix})`;
    const romanization = variant === 0 ? seed.romanization : `${seed.romanization} (${suffix})`;

    entries.push({
      id: `en-${String(i + 1).padStart(3, '0')}`,
      language: 'en',
      difficulty: 'advanced',
      native,
      romanization,
      type: seed.type,
      meaning_en: seed.meaning_en,
      sentence: {
        native: sentenceNative,
        romanization: sentenceNative,
        meaning_en: sentenceNative,
      },
      image_prompt: createImagePrompt(seed, scene, 'English'),
      tags: ['advanced', scene.tag],
    });
  }
  return entries;
}

function buildBeginnerBank(lang, seeds, languageLabel) {
  const entries = [];
  const variants = lang === 'uk' ? UK_VARIANTS : FA_VARIANTS;
  for (let i = 0; i < BANK_SIZE; i += 1) {
    const seed = seeds[i % seeds.length];
    const scene = COMMON_SCENES[i % COMMON_SCENES.length];
    const variant = Math.floor(i / seeds.length);
    const suffix = variants[variant % variants.length];
    const native = variant === 0 ? seed.native : `${seed.native} ${suffix.native}`;
    const romanization = variant === 0 ? seed.romanization : `${seed.romanization} ${suffix.romanization}`;
    const meaning = variant === 0 ? seed.meaning_en : `${seed.meaning_en} (${suffix.meaning})`;

    entries.push({
      id: `${lang}-${String(i + 1).padStart(3, '0')}`,
      language: lang,
      difficulty: 'beginner',
      native,
      romanization,
      type: seed.type,
      meaning_en: meaning,
      sentence: {
        native: `${native}.`,
        romanization: `${romanization}.`,
        meaning_en: meaning,
      },
      image_prompt: createImagePrompt(seed, scene, languageLabel),
      tags: ['beginner', scene.tag],
    });
  }
  return entries;
}

const WORD_BANK = {
  en: buildEnglishBank(),
  uk: buildBeginnerBank('uk', UK_SEEDS, 'Ukrainian'),
  fa: buildBeginnerBank('fa', FA_SEEDS, 'Persian'),
};

module.exports = {
  BANK_SIZE,
  WORD_BANK,
};
