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
