export const INDUSTRIES = [
  'Grožio specialistai (kirpėjai, kosmetologai, nagų meistrai)',
  'Treneriai (fitness, joga, personaliniai)',
  'Kineziterapeutai ir masažuotojai',
  'Odontologai ir burnos higienistai',
  'Veterinarai',
  'Psichologai ir terapeutai',
  'Nekilnojamojo turto agentai',
  'Fotografai ir videografai',
  'Buhalteriai ir finansų konsultantai',
  'Teisininkai ir notarai',
  'Automobilių servisai ir autodetailing',
  'Restoranai ir kavinės',
  'Statybininkai ir remontininkai',
  'Santechnikai ir elektrikai',
  'Programuotojai ir IT specialistai',
  'Dizaineriai (grafikos, interjero, web)',
  'Konditeriai ir kepėjai',
  'Korepetitoriai ir mokytojai',
  'Valymo paslaugos',
  'Kita',
] as const;

export type Industry = typeof INDUSTRIES[number];

// Placeholder pavyzdžiai kiekvienai industrijai
export const INDUSTRY_PLACEHOLDERS: Record<string, string> = {
  'grožio': 'Pvz.: Nauja plaukų dažymo technika, rudens akcija -20%, lash lift naujiena...',
  'trener': 'Pvz.: Nauja grupinė treniruotė, vasaros kūno iššūkis, nemokama pirmoji treniruotė...',
  'kineziterapeut': 'Pvz.: Nugaros skausmų gydymas, reabilitacija po traumos, masažo akcija...',
  'masažuot': 'Pvz.: Atpalaiduojantis nugaros masažas, akcija poroms, anticeliulitinis masažas...',
  'odontolog': 'Pvz.: Dantų balinimas, nemokama konsultacija, implantų akcija...',
  'veterinar': 'Pvz.: Nemokama vakcinacija, šuniuko sveikatos patikra, sterilizacijos akcija...',
  'psicholog': 'Pvz.: Streso valdymo konsultacija, poros terapija, pirmasis vizitas -30%...',
  'nekilnojam': 'Pvz.: Naujas butas Vilniuje, investicija į NT, nemokamas būsto vertinimas...',
  'fotograf': 'Pvz.: Vestuvių fotosesija, šeimos nuotraukos, kūdikio gimimo fotosesija...',
  'videograf': 'Pvz.: Vestuvių filmavimas, įmonės prisistatymas, produkto video...',
  'buhalter': 'Pvz.: Metinė deklaracija, įmonės steigimas, PVM konsultacija...',
  'finansų': 'Pvz.: Investicijų konsultacija, paskolos refinansavimas, pensijų planavimas...',
  'teisinink': 'Pvz.: Nemokama teisinė konsultacija, sutarčių peržiūra, skyrybų byla...',
  'notar': 'Pvz.: Testamento sudarymas, nekilnojamojo turto sandoriai, įgaliojimai...',
  'auto': 'Pvz.: Pilnas automobilio valymas -30%, žieminių padangų montavimas, techninė apžiūra...',
  'restoran': 'Pvz.: Naujas sezoninis meniu, verslo pietūs, gimtadienio vakarienė...',
  'kavin': 'Pvz.: Nauja kavos rūšis, pusryčių akcija, desertų degustacija...',
  'statyb': 'Pvz.: Namo renovacija, vonios remontas, fasado apšiltinimas...',
  'remont': 'Pvz.: Buto remontas, grindų klojimas, sienų dažymas...',
  'santech': 'Pvz.: Vamzdyno remontas, šildymo sistemos montavimas, nutekėjimo taisymas...',
  'elektrik': 'Pvz.: Elektros instaliacijos darbai, apšvietimo montavimas, gedimų šalinimas...',
  'programuot': 'Pvz.: Svetainės kūrimas, mobili aplikacija, e-parduotuvės sprendimas...',
  'it': 'Pvz.: Kompiuterių remontas, tinklo konfigūracija, debesų paslaugos...',
  'dizainer': 'Pvz.: Logotipo kūrimas, interjero projektas, svetainės dizainas...',
  'konditer': 'Pvz.: Vestuvinis tortas, gimtadienio desertas, sausainių dėžutė dovanai...',
  'kepėj': 'Pvz.: Šviežia duona, bandelės užsakymui, pyragai šventėms...',
  'korepetitor': 'Pvz.: Matematikos pamokos, pasiruošimas egzaminams, anglų kalba vaikams...',
  'mokytoj': 'Pvz.: Muzikos pamokos, piešimo kursai, šokių užsiėmimai...',
  'valym': 'Pvz.: Giluminis namų valymas, langų plovimas, poremontinis valymas...',
  'kita': 'Pvz.: Jūsų paslauga ar produktas, specialus pasiūlymas, naujiena klientams...',
};

// Funkcija gauti placeholder pagal industriją
export function getPlaceholderForIndustry(industry: string): string {
  if (!industry) {
    return 'Pvz.: Aprašykite savo paslaugą, akciją, naujieną ar specialų pasiūlymą...';
  }

  const industryLower = industry.toLowerCase();

  for (const [key, placeholder] of Object.entries(INDUSTRY_PLACEHOLDERS)) {
    if (industryLower.includes(key)) {
      return placeholder;
    }
  }

  return INDUSTRY_PLACEHOLDERS['kita'];
}
