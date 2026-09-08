/** Galactic Butterfly: geometry and source provenance, independent of DOM/WebGL.
 * Coordinate convention: right-handed J2000 mean ecliptic, +x at the equinox.
 * No asserted causal connection from Hunab Ku symbolism to physical events.
 */
export const SCHEMA='hcc.galactic-butterfly/1';
export const DEG=Math.PI/180;
export const YEAR_DAYS=365.2422;
export const PLANET_MIN_DAY=-73048.5; // 1800-01-01 00:00, relative to J2000 noon
export const PLANET_MAX_DAY=18627.49999999; // before 2051-01-01
export const SOURCES=Object.freeze({
  symbolism:{title:'Ian Xel Lungold · modern Galactic Butterfly interpretation',url:'https://mayanmajix.com/gb250.html',kind:'primary cultural interpretation'},
  harmonic:{title:'Foundation for the Law of Time · 1987 Harmonic Convergence',url:'https://www.lawoftime.org/infobooth/hc24.html',kind:'movement’s own account'},
  maya:{title:'Smithsonian NMAI · The Calendar System',url:'https://maya.nmai.si.edu/calendar/calendar-system',kind:'museum'},
  dresden:{title:'SLUB Dresden · Venus and eclipse tables of the Dresden Codex',url:'https://www.slub-dresden.de/en/explore/manuscripts/the-dresden-maya-codex/content',kind:'manuscript custodian'},
  jpl:{title:'NASA/JPL · Approximate Positions of the Planets',url:'https://ssd.jpl.nasa.gov/planets/approx_pos.html',kind:'ephemeris specification'},
  precession:{title:'NASA · Milankovitch cycles',url:'https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/',kind:'astronomy'},
  alignment:{title:'UC Berkeley · The Great Galactic Alignment of 2012',url:'https://multiverse.ssl.berkeley.edu/Calendar-in-the-Sky/Articles/the-great-galactic-alignment-of-2012',kind:'astronomy education'},
  centre:{title:'Chandra · Sagittarius A*, J2000 position',url:'https://chandra.si.edu/photo/2015/sgra2/',kind:'observatory'},
  galaxy:{title:'NASA · Solar System facts',url:'https://science.nasa.gov/solar-system/solar-system-facts/',kind:'astronomy'},
  sun:{title:'NASA · Sunspots',url:'https://science.nasa.gov/sun/sunspots/',kind:'solar astronomy'},
  butterfly:{title:'Solar Cycle Science · Butterfly diagrams',url:'https://solarcyclescience.com/solarcycle.html',kind:'solar physicists’ reference'},
  forecast:{title:'NOAA · Solar cycle progression and uncertainty',url:'https://www.spaceweather.gov/products/solar-cycle-progression',kind:'observed data and forecast'},
  nebula:{title:'NASA/Hubble · Butterfly Nebula NGC 6302',url:'https://science.nasa.gov/image-detail/ngc-6302-the-butterfly-nebula/',kind:'observatory'},
  torus:{title:'ESA/Hubble · NGC 6302 bipolar lobes and dusty torus',url:'https://esawebb.org/images/weic2517e/',kind:'observatory'},
  fermi:{title:'NASA · Fermi’s giant Galactic structure',url:'https://www.nasa.gov/universe/nasas-fermi-telescope-finds-giant-structure-in-our-galaxy/',kind:'discovery announcement'},
  eclipse:{title:'NASA · Saros and eclipse periodicity',url:'https://eclipse.gsfc.nasa.gov/SEsaros/SEsaros.html',kind:'eclipse catalogue'},
  eclipse2027:{title:'NASA · Eclipses during 2027',url:'https://eclipse.gsfc.nasa.gov/OH/OH2027.html',kind:'event catalogue'}
});
const row=(id,kind,view,title,ru,de,text,ruText,deText,sources)=>Object.freeze({id,kind,view,title,ru,de,text,ruText,deText,sources:Object.freeze(sources)});
export const RELATIONS=Object.freeze([
 row('hunab','CULTURAL','sky','Hunab Ku · meaning','Hunab Ku · смысл','Hunab Ku · Bedeutung',
 '“Galactic Butterfly” is used in modern spiritual interpretations. This source establishes the interpretation, not an ancient astronomical measurement or a physical mechanism.',
 '«Галактическая бабочка» встречается в современных духовных интерпретациях. Источник подтверждает трактовку, но не древнее астрономическое измерение или физический механизм.',
 '„Galaktischer Schmetterling“ gehört zu modernen spirituellen Deutungen. Die Quelle belegt diese Deutung, keine antike Messung oder physikalische Ursache.',['symbolism']),
 row('solstice','GEOMETRY','sky','Solstice & Milky Way','Солнцестояние и Млечный Путь','Sonnenwende & Milchstraße',
 'The Sun crosses the Galactic great circle twice per year in sky projection. Crossing this direction is not passage through the Galactic disk. The Galactic centre is off the ecliptic.',
 'В проекции на небо Солнце дважды в год пересекает галактический большой круг. Это не прохождение Солнечной системы через диск Галактики. Центр Галактики лежит вне эклиптики.',
 'Die Sonne kreuzt den galaktischen Großkreis zweimal jährlich am Himmel. Das ist kein Durchgang durch die galaktische Scheibe. Das Zentrum liegt außerhalb der Ekliptik.',['alignment','centre']),
 row('precession','REFERENCE_MODEL','sky','Axial precession','Прецессия земной оси','Achspräzession',
 'Solar and lunar gravity torque Earth’s equatorial bulge. The mean cycle is about 25,772 years. The cone shown is a fixed-obliquity reference, not a precision Earth-orientation solution.',
 'Солнечные и лунные гравитационные моменты действуют на экваториальное утолщение Земли. Средний цикл — около 25 772 лет. Здесь показан конус с постоянным наклоном, а не точная ориентация Земли.',
 'Drehmomente von Sonne und Mond wirken auf den Erdäquatorwulst. Der mittlere Zyklus beträgt etwa 25.772 Jahre. Gezeigt wird ein Referenzkegel mit konstanter Neigung.',['precession']),
 row('galactic-year','REFERENCE_MODEL','galaxy','Galactic year','Галактический год','Galaktisches Jahr',
 'The Solar System orbits in the Galaxy’s combined gravitational field in roughly 230 million years. This is not the precession cycle. The displayed orbital phase has an arbitrary J2000 origin.',
 'Солнечная система обращается в суммарном гравитационном поле Галактики примерно за 230 млн лет. Это не цикл прецессии. Ноль показанной фазы условно задан на J2000.',
 'Das Sonnensystem umläuft die Galaxis in ihrem gesamten Gravitationsfeld in etwa 230 Millionen Jahren. Das ist nicht die Präzession; der gezeigte Phasenursprung ist frei gewählt.',['galaxy']),
 row('venus','HISTORICAL_ASTRONOMY','venus','Venus · five returns / eight years','Венера · пять возвращений / восемь лет','Venus · fünf Wiederkehren / acht Jahre',
 'Dresden tables use 584 days. Five tabular Venus cycles equal eight 365-day years exactly; the astronomical 583.92-day mean gives an approximately 2.34-day residual against eight tropical years. The chord pattern is a geometric visualization, not a known origin of Hunab Ku.',
 'Дрезденские таблицы используют 584 дня. Пять табличных циклов равны восьми годам по 365 дней; средний астрономический цикл 583,92 дня даёт отклонение около −2,34 дня от восьми тропических лет. Рисунок хорд не доказывает происхождение Hunab Ku.',
 'Dresdner Tafeln verwenden 584 Tage. Fünf Tabellenzyklen ergeben exakt acht 365-Tage-Jahre; 583,92 Tage astronomisches Mittel ergeben etwa −2,34 Tage gegenüber acht tropischen Jahren. Das Sehnenmuster belegt keinen Ursprung von Hunab Ku.',['dresden','jpl']),
 row('calendar','CALENDAR_ARITHMETIC','venus','260 · 365 · 18,980 days','260 · 365 · 18 980 дней','260 · 365 · 18.980 Tage',
 'Calendar Round: lcm(260,365) = 18,980 = 73×260 = 52×365. The 365-day Haab is not the tropical year; exact integer closure does not establish a physical resonance.',
 'Календарный круг: НОК(260,365) = 18 980 = 73×260 = 52×365. Год Хааб в 365 дней не равен тропическому; точное целочисленное замыкание не устанавливает физический резонанс.',
 'Kalenderrunde: kgV(260,365) = 18.980 = 73×260 = 52×365. Das Haab-Jahr ist nicht das tropische Jahr; ganzzahlige Schließung belegt keine physikalische Resonanz.',['maya']),
 row('eclipses','ASTRONOMY','sky','Eclipses · phase and nodes','Затмения · фазы и узлы','Finsternisse · Phasen und Knoten',
 'The Dresden Codex contains eclipse tables. Actual eclipses require syzygy near a lunar orbital node. The Saros recurrence is approximate; local visibility needs shadow geometry, not a symbol or calendar phase alone.',
 'Дрезденский кодекс содержит таблицы затмений. Физическое условие — сизигия вблизи узла лунной орбиты. Повторение Сароса приближённое; местная видимость требует расчёта тени, а не одного символа или календарной фазы.',
 'Der Dresdner Kodex enthält Finsternistafeln. Reale Finsternisse benötigen Syzygie nahe einem Mondbahnknoten. Die Saros-Wiederkehr ist angenähert; lokale Sichtbarkeit verlangt Schattengeometrie.',['dresden','eclipse','eclipse2027']),
 row('solar','OBSERVED_PATTERN','solar','Solar butterfly · 11 / 22 years','Солнечная бабочка · 11 / 22 года','Sonnenschmetterling · 11 / 22 Jahre',
 'Sunspot emergence migrates toward the equator during an approximately 11-year activity cycle; magnetic polarity has a roughly 22-year cycle. The displayed points are synthetic examples of this pattern, not measured spots.',
 'Области появления пятен смещаются к экватору в течение примерно 11-летнего цикла активности; магнитная полярность имеет цикл около 22 лет. Здесь точки синтетические: они объясняют закономерность, а не изображают измеренные пятна.',
 'Sonnenflecken entstehen im etwa 11-jährigen Aktivitätszyklus zunehmend äquatornah; die magnetische Polarität hat etwa 22 Jahre Periodizität. Gezeigte Punkte sind synthetische Beispiele.',['butterfly','sun']),
 row('weather','STATISTICAL','solar','Flares · CMEs · aurora','Вспышки · выбросы · сияния','Flares · CMEs · Polarlicht',
 'Solar activity changes event probabilities. A cycle phase cannot predict the date of an individual flare, Earth-directed CME or aurora. Use observed solar data and operational forecasts.',
 'Солнечная активность меняет вероятности событий. Фаза цикла не предсказывает дату отдельной вспышки, направленного к Земле выброса или сияния. Нужны наблюдения и оперативные прогнозы.',
 'Sonnenaktivität verändert Ereigniswahrscheinlichkeiten. Die Zyklusphase sagt keine einzelne Eruption, erdgerichtete CME oder ein Polarlicht voraus. Dafür braucht es Beobachtungen und aktuelle Vorhersagen.',['sun','forecast']),
 row('nebula','MORPHOLOGY','nebula','NGC 6302 · stellar outflow','NGC 6302 · звёздный выброс','NGC 6302 · stellarer Ausfluss',
 'A planetary nebula inside the Milky Way, about 2,500–3,800 light-years away. Bipolar lobes and a dusty torus surround an evolved star. The 3D shell here is schematic, not a reconstruction or a supernova.',
 'Планетарная туманность внутри Млечного Пути, примерно в 2500–3800 световых годах. Две лопасти и пылевой тор окружают эволюционировавшую звезду. 3D-оболочка здесь схематическая; это не реконструкция и не сверхновая.',
 'Ein planetarischer Nebel in der Milchstraße, etwa 2.500–3.800 Lichtjahre entfernt. Bipolare Lappen und Staubtorus umgeben einen entwickelten Stern. Die 3D-Hülle ist schematisch, keine Rekonstruktion oder Supernova.',['nebula','torus']),
 row('fermi','MORPHOLOGY','galaxy','Fermi bubbles · Galactic outflow','Пузыри Ферми · галактический выброс','Fermi-Blasen · galaktischer Ausfluss',
 'Observed gamma-ray lobes span about 50,000 light-years end to end. Past central activity is a proposed origin. Their paired shape does not establish any connection to Hunab Ku or a calendar event.',
 'Наблюдаемые гамма-лопасти имеют размах около 50 000 световых лет. Прошлая активность центра — предполагаемая причина. Парная форма не устанавливает связи с Hunab Ku или календарным событием.',
 'Beobachtete Gamma-Lappen erstrecken sich über etwa 50.000 Lichtjahre. Vergangene Zentrumsaktivität ist eine mögliche Ursache. Ihre Form belegt keinen Bezug zu Hunab Ku oder einem Kalenderereignis.',['fermi']),
 row('1987-2012','CULTURAL','sky','1987 and 2012 · different claims','1987 и 2012 · разные утверждения','1987 und 2012 · unterschiedliche Aussagen',
 'The 1987 Harmonic Convergence was an organized spiritual event. The December 2012 Long Count milestone does not establish a unique Sun–Galactic-centre alignment. A cultural date is not evidence for a physical trigger.',
 '«Гармоническая конвергенция» 1987 года была организованным духовным событием. Календарная граница декабря 2012 года не устанавливает уникального выравнивания Солнца с центром Галактики. Культурная дата не доказывает физический запуск.',
 'Die Harmonische Konvergenz 1987 war ein organisiertes spirituelles Ereignis. Der Kalenderübergang im Dezember 2012 belegt keine einzigartige Sonne–Galaxienzentrum-Ausrichtung. Ein Kulturdatum ist kein physikalischer Auslöser.',['harmonic','alignment'])
]);
export const mod=(x,p)=>((x%p)+p)%p;
const norm=a=>{const n=Math.hypot(...a);if(!(n>0)||!Number.isFinite(n))throw new RangeError('finite nonzero vector required');return a.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function equatorialToEcliptic(raDeg,decDeg){
 const a=raDeg*DEG,d=decDeg*DEG,e=23.4392911*DEG;
 const x=Math.cos(d)*Math.cos(a),y=Math.cos(d)*Math.sin(a),z=Math.sin(d);
 return [x,y*Math.cos(e)+z*Math.sin(e),-y*Math.sin(e)+z*Math.cos(e)];
}
export function planeBasis(pole){
 const p=norm(pole),u=norm(cross(Math.abs(p[2])<.9?[0,0,1]:[1,0,0],p));
 return [u,cross(p,u)];
}
export function skyGeometry(){
 const galacticPole=equatorialToEcliptic(192.85948,27.12825);
 // Rounded Chandra J2000 catalogue direction, not the approximate centre of a photo.
 const galacticCentre=equatorialToEcliptic(266.4166667,-29.0077778);
 return {eclipticPole:[0,0,1],equatorPole:equatorialToEcliptic(0,90),galacticPole,galacticCentre,
  galacticCentreLatitudeDeg:Math.asin(galacticCentre[2])/DEG,
  planeInclinationDeg:Math.acos(galacticPole[2])/DEG,
  convention:'J2000 mean ecliptic; IAU Galactic pole; catalogue directions fixed'};
}
export function calendarRelations(){
 return {calendarRoundDays:18980,haabCount:52,tzolkinCount:73,
  dresdenFiveVenusDays:5*584,eightHaabDays:8*365,
  venusEightYearResidualDays:5*583.92-8*YEAR_DAYS,physicalResonanceEstablished:false};
}
export function planetaryEpochValid(day){return Number.isFinite(day)&&day>=PLANET_MIN_DAY&&day<=PLANET_MAX_DAY;}
export function epochSummary(day){
 if(!Number.isFinite(day))throw new RangeError('finite J2000 day required');
 return {epochDaysJ2000:day,precessionPhase:mod(day,25772*365.25)/(25772*365.25),
  galacticPhase:mod(day,230e6*365.25)/(230e6*365.25),
  planetaryStatus:planetaryEpochValid(day)?'APPROXIMATE_JPL':'OUT_OF_RANGE',
  calendar:calendarRelations(),physicalLinkToSymbolEstablished:false};
}
export function venusTrace(day,ephemeris,count=240){
 if(!planetaryEpochValid(day))return null;
 if(typeof ephemeris!=='function')throw new TypeError('Atlas ephemeris callback required');
 const n=Math.max(16,Math.min(480,Math.floor(count))),span=8*YEAR_DAYS;
 const startDay=Math.max(PLANET_MIN_DAY,Math.min(day-span/2,PLANET_MAX_DAY-span));
 const segments=[];
 for(let i=0;i<n;i++){
  const d=startDay+span*i/(n-1),p=ephemeris(d);
  if(!p||![p.earth,p.venus].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))throw new RangeError('invalid ephemeris vector');
  segments.push({day:d,earth:p.earth,venus:p.venus});
 }
 return {startDay,endDay:startDay+span,segments,status:'APPROXIMATE_JPL',unit:'au',frame:'heliocentric J2000 ecliptic'};
}
export function solarReference(year){
 if(!Number.isFinite(year))throw new RangeError('finite reference year required');
 const phase=mod(year-2019.96,11)/11;
 return {phase,latitudeDeg:35-30*phase,activity:Math.sin(Math.PI*phase)**2,
  polarity:Math.floor((year-2019.96)/11)%2===0?1:-1,status:'SCHEMATIC',predictsIndividualEvents:false};
}
