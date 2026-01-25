export const INDUSTRIES = [
  'Grožio specialistai (kirpėjai, kosmetologai, nagų meistrai)',
  'Treneriai (fitness, joga, personaliniai)',
  'Kineziterapeutai',
  'Masažistai',
  'Odontologai',
  'Veterinarai',
  'Psichologai ir terapeutai',
  'Nekilnojamojo turto agentai',
  'Fotografai ir videografai',
  'Buhalteriai ir finansų konsultantai',
  'Teisininkai ir advokatai',
  'Automobilių servisai',
  'Restoranai ir kavinės',
  'Kita',
] as const;

export type Industry = typeof INDUSTRIES[number];
