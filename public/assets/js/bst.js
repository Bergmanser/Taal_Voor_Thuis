import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";

// Contains test data for 2 quizes
const creationDate = new Date();
const modificationDate = new Date();

// Update the modification date before saving the quiz to Firestore
modificationDate.setSeconds(modificationDate.getSeconds() + 1);
// newQuiz.modificationDate = modificationDate;

const quizzes = [
    {
        id: 0,
        QuizGroupId: '8000',
        Title: 'Draag jij ook zonnebrand crème in de winter',
        Description: 'Een quiz over de effecten van zonnebrand crème',
        Banner: '../public/assets/images/MDB-Background.png',
        EmbeddedText:
            `<p>In de zomer is zonnebrandcrème <b>onmisbaar</b>, je ziet veel mensen om je heen het gebruiken. Dat is ook logisch, want in de zomer schijnt de zon vaak en wil iedereen tijd buiten doorbrengen. We weten ook dat je van te lang in de zon spelen, kunt verbranden. Om <b>dat</b> te voorkomen gebruiken we zonnebrandcrème. Alleen hoe zit het dan met de dagen waarop de zon niet schijnt? Dan is zonnebrandcrème toch helemaal niet nodig, zou je denken...</p> <p>De zon is eigenlijk een soort ster, maar in plaats van 's nachts te twinkelen zoals de sterren die we aan de hemel zien, straalt de zon altijd fel licht en warmte uit. Naast licht en warmte zendt de zon <b>straling</b> uit. Deze bestaat eigenlijk uit kleine, onzichtbare deeltjes die van de zon afkomen en door de ruimte reizen, helemaal tot aan onze aarde! De zon zendt verschillende soorten stralen uit, waaronder UV-stralen. Deze stralen kunnen goed zijn voor ons omdat ze ons lichaam helpen vitamine D te maken, die belangrijk is voor onze botten en ons immuunsysteem. Maar te veel blootstelling aan UV-stralen kan schadelijk zijn voor onze huid en tot verbranding leiden.</p> <p>Om toch van de zon te genieten zonder te verbranden, kunnen we onszelf beschermen met zonnebrandcrème. Deze crème bevat speciale ingrediënten die een onzichtbare laag op je huid vormen en schadelijke UV-stralen van de zon tegenhouden. Het is hierbij wel belangrijk dat je minstens 30 minuten voordat je naar buiten gaat de zonnebrandcrème aanbrengt, zodat het goed kan intrekken. <b>Ook</b> zal je rekening moeten houden met het kiezen van de juiste zonnebrandcrème. Op elke zonnebrandcrème staat een <b>factor</b> vermeld. Dit is eigenlijk de sterkte waarmee de zonnebrandcrème je huid beschermt. Vaak wordt dit aangegeven in ‘SPF’, die staat voor ‘Sun Protection Factor’. De SPF is een getal dat aangeeft hoeveel langer je in de zon kunt blijven zonder te verbranden in vergelijking met wanneer je geen zonnebrandcrème gebruikt. Tot slot moet je niet vergeten om zonnebrandcrème om het paar uur opnieuw in te smeren!</p> <p>De zon zendt dus constant straling uit. Dat betekent dat je lichaam elke dag wordt blootgesteld aan UV-stralen, zelfs wanneer je de zon niet ziet schijnen of als het niet warm is. UV-stralen kunnen namelijk door bewolking en glas heen dringen. Het is dus belangrijk om dagelijks zonnebrandcrème te smeren om een gezonde huid te behouden. Dan is zonnebrandcrème in de winter toch niet zo gek als het klinkt!</p>`,
        Difficulty: 'easy',
        QuizType: 'anders',
        Created_at: creationDate,
        Modified_at: modificationDate,
        Questions: [
            {
                QuestionId: '1',
                Text: 'Wat betekent ”onmisbaar” (alinea 1)?',
                Options: ['Onnodig', 'Vermist', 'Noodzakelijk', 'Verplicht'],
                CorrectOption: 2,
                Hint: 'Vervang het woord ‘onmisbaar’ in de tekst door jouw gekozen antwoord.',
                CorrectOptionDescription: `In de zomer is het belangrijk om zonnebrandcrème te smeren, maar niet verplicht. Het woord noodzakelijk is een synoniem van onmisbaar.`,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '2',
                Text: 'Waar verwijst het woord “dat” naar in (alinea 1)?',
                Options: ['Verbranden', 'In de zon spelen', 'Zonnebrandcréme', 'Te lang'],
                CorrectOption: 0,
                Hint: 'Wat klinkt het meest logisch?',
                CorrectOptionDescription: `Het antwoord op de vraag ‘Wat kun je voorkomen met zonnebrandcrème?' is, verbranden. `,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '3',
                Text: 'Welk tussenkopje past het beste boven alinea 2?',
                Options: ['Straling', 'De grootste ster', 'De zon', 'UV-Straling'],
                CorrectOption: 2,
                Hint: 'Wat kun je voorkomen met zonnebrandcréme?',
                CorrectOptionDescription: `In deze alinea worden er verschillende punten van de zon beschreven. Het gehele thema is de zon en daarom past antwoord C het beste als het tussenkopje van alinea 2.`,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '4',
                Text: 'Welke betekenis past het beste bij “straling” (alinea 2)?',
                Options: ['Warmte', 'Fel licht', 'Kleine, onzichtbare deeltjes die naar de aarde reizen.', 'Immuunsysteem'],
                CorrectOption: 2,
                Hint: 'Kies het juiste antwoord dat past bij de vraag.',
                CorrectOptionDescription: `In de tekst staat dat de zon ook straling uitzendt. De zin erna beschrijft dat straling uit kleine onzichtbare deeltjes bestaat.`,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '5',
                Text: 'Welke uitspraken over UV-stralingen zijn juist?',
                Options: ['UV-straling komt van de zon.', 'Te veel UV-straling is goed voor je lichaam.', 'De zon zendt alleen UV-straling uit.', 'UV-straling helpt je met een vitamine aanmaken en je weerstand.'],
                CorrectOption: 0,
                Hint: 'Denk aan wat er in de alinea 2 wordt besproken. In die alinea wordt vooral gesproken over de zon en wat de zon is.',
                CorrectOptionDescription: `Uit de tekst blijkt dat UV-straling van de zon komt, maar dit is niet de enige straling die de zon uitzendt. UV-straling helpt je lichaam met de aanmaak van vitamine D en is goed voor je immuunsysteem. Alhoewel, te veel UV-straling leidt tot beschadiging van je huid.`,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '6',
                Text: 'Welk tussenkopje past het beste boven alinea 3?',
                Options: ['SPF', 'Waarom verbrand je door de zon?', 'Hoe werkt zonnebrandcrème?', 'Gevaren van de zon.'],
                CorrectOption: 2,
                Hint: 'Welk tussenkopje past het beste bij dat onderwerp?',
                CorrectOptionDescription: `In deze alinea worden er verschillende punten van zonnebrandcrème beschreven. Het gehele thema is werking van zonnebrandcrème en daarom past antwoord C het beste als het tussenkopje van alinea 3.`,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '7',
                Text: 'Wat voor soort signaalwoord is het woord “ook” (alinea 3)?',
                Options: ['Tegenstellend', 'Opsommend', 'Voorbeeld', 'Redengevend'],
                CorrectOption: 1,
                Hint: 'Lees de zin waarin het woord "ook" wordt gebruikt. Probeer te bedenken of het woord "ook" aangeeft: - Dat er iets tegenovergesteld wordt gezegd. (Tegenstellend) - Dat er iets wordt toegevoegd aan wat al eerder is genoemd. (Opsommend) - Dat er een voorbeeld wordt genoemd. (Voorbeeld) - Dat er wordt uitgelegd waarom iets is gebeurd. (Redengevend) Welke van de opties past het beste bij de rol van "ook"?',
                CorrectOptionDescription: `Het signaalwoord ook, geeft aan dat er meer dingen zijn. Het helpt ons begrijpen dat de schrijver een lijst maakt van verschillende dingen. In de tekst werden er meerdere dingen verteld over zonnebrandcrème. `,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '8',
                Text: 'Wat wordt er bedoeld met “factor” (alinea 3)?',
                Options: ['De sterkte waarmee zonnebrandcrème je huid beschermt.', 'Hoeveelheid', 'Een tv programma', 'Een zonnebrand merk'],
                CorrectOption: 0,
                Hint: 'In de tekst staat uitgelegd hoe zonnebrandcrème werkt en waarom het belangrijk is. Lees goed wat er wordt uitgelegd nadat het woord "factor" is genoemd.',
                CorrectOptionDescription: `In de tekst staat dat het woord factor op de verpakkingen van zonnebrandcrème staat. De zin erna beschrijft dat dit de sterkte is waarmee zonnebrandcrème je huid beschermt.`,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '9',
                Text: 'Welk tussenkopje past het beste boven alinea 4?',
                Options: ['Straling', 'Slecht weer', 'Een gezonde huid', 'Gebruik zonnebrandcrème elke dag!'],
                CorrectOption: 3,
                Hint: 'Bedenk welk tussenkopje past het beste bij dat onderwerp.',
                CorrectOptionDescription: `In deze alinea wordt uitgelegd waarom je op niet zonnige dagen zonnebrandcrème moet smeren. Het gehele thema is elke dag zonnebrandcrème smeren en daarom past antwoord D het beste als het tussenkopje van alinea 4.`,
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '10',
                Text: 'Lees de laatste zin: Dan is … het klinkt! (alinea 4)',
                Options: ['Dat het normaal is om zonnebrandcrème te dragen op niet zonnige dagen.', 'Zonnebrandcrème geeft een gek geluid.', 'Het is gek om in de winter zonnebrandcrème te smeren.', 'Je moet alleen zonnebrandcrème in de winter dragen.'],
                CorrectOption: 0,
                Hint: 'Bedenk eerst waarom het gek is om zonnebrandcrème in de winter te smeren. Denk daarna aan wat er in alinea 4 wordt uitgelegd.',
                CorrectOptionDescription: `De schrijver wilt met deze zin zeggen dat het niet raar is om op niet zonnige dagen zonnebrandcrème te dragen, zelfs niet in de winter.Dus de schrijver vindt het normaal om  elke dag zonnebrandcrème te smeren. `,
                QuestionType: "Multiple Choice"
            }
        ]
    },
    {
        id: 1,
        QuizGroupId: '8000',
        Title: 'Entertainment in het Romeinse Rijk',
        Description: 'Een quiz over vormen van entertainment gedurende het Romeinse Rijk',
        Banner: '../public/assets/images/MDB-Background.png',
        EmbeddedText: `<p>Wist je dat er vroeger in het oude Rome geweldige gevechten waren tussen gladiatoren? En keizers die regeerden in een enorm, machtig rijk! Het Romeinse Rijk en zijn overblijfselen zijn heel belangrijk voor de wereldgeschiedenis. Een van die overblijfselen is het Colosseum dat in het midden van de stad stond. Het Colosseum vertelt ons veel over hoe het leven was in die tijd. </p> <p>Het Colosseum werd in de 1e eeuw na Christus (n. Chr) gebouwd door Romeinse keizers in Rome. Het Colosseum is een symbool van de keizerlijke macht van het Romeinse Rijk. Het was ooit het toneel van <strong>grandioze</strong> evenementen, georganiseerd door de keizers en er konden wel 50.000 toeschouwers deelnemen. <strong>Daarnaast</strong> was het Colosseum een enorme, ovaalvormige plek met zuilen en bogen die zorgden dat het niet in elkaar storten. </p> <p>De keizers verloren hun macht na het verliezen van veel oorlogen, maar ze moesten nog steeds de bevolking tevreden houden. Daarom bouwden ze het Colosseum zodat de burgers van het Romeinse Rijk zich vermaakten. Gladiatorengevechten waren het meest populair, waar gladiatoren elkaar bevochten, soms tot de dood. Gladiatoren waren slaven of misdadigers die werden gekozen door de keizer en de Romeinen. De keizer had de macht om het lot van de verliezer te bepalen: leven of dood. Dit deed hij door zijn duim omhoog of omlaag te doen. Omhoog betekende dat ze mochten leven en omlaag een zekere dood. <strong>Ze</strong> streden ook tegen wilde, exotische dieren zoals leeuwen en tijgers. Deze dieren werden onder het Colosseum in grote kooien gehouden, waar ze bijna geen voedsel kregen zodat ze extra veel trek in de gladiatoren. Naast gladiatorengevechten werden er ook race wedstrijden gehouden in het Colosseum, waarbij paarden en strijdkarren werden gebruikt. </p>
        <p>Dit was natuurlijk heel erg gevaarlijk en bloederig. Dus in de 4e eeuw probeerden de Romeinse keizers de gevaarlijke gevechten tot de dood te verminderen door kerken te bouwen. Maar toch bleven de spelen in het Colosseum populair. In 404 n. Chr protesteerde een monnik genaamd Telemachos tegen de gevechten door de arena binnen te gaan en protesteerde door niks te doen in het gevecht. Helaas overleed hij maar zijn dood maakte indruk opkeizer Honorius, die uiteindelijk de spelen beëindigde. </p>
        `,
        Difficulty: 'easy',
        QuizType: 'woordenschat',
        Created_at: creationDate,
        Modified_at: modificationDate,
        Questions: [
            {
                id: '1',
                Text: 'Welk tussenkopje past het best op alinea 2?',
                Options: ['Verkenning van het Colosseum', 'De keizerlijke roem in het colosseum', 'Een eeuwig monument', 'Een symbool van de moderne Romeinse stad'],
                CorrectOption: 1,
                Hint: 'Denk aan wat er in de alinea 2 wordt besproken. In die alinea wordt vooral gesproken over hoe het Colosseum is gebouwd en hoe evenementen werden georganiseerd door de keizers.',
                CorrectOptionDescription: 'De keizerlijke roem in het colosseum',
                Type: 'Multiple Choice'
            },
            {
                id: '2',
                Text: 'Wat betekent “grandioze” in alinea 2?',
                Options: ['Klein en dramatisch', 'Eenvoudig en simpel', 'Bescheiden en onopvallend', 'Indrukwekkend en groots'],
                CorrectOption: 3,
                Hint: 'Vervang het woord “grandioze” in de tekst te vervangen door jouw gekozen antwoord.',
                CorrectOptionDescription: 'Indrukwekkend en groots',
                Type: 'Multiple Choice'
            },
            {
                id: '3',
                Text: 'Wat voor soort signaalwoord is “daarnaast” in alinea 2?',
                Options: ['Opsomming', 'Oorzaak', 'Tegenstelling', 'Redengevend'],
                CorrectOption: 0,
                Hint: 'Kijk naar de zin waarin het woord "daarnaast" wordt gebruikt. Probeer te bedenken of het woord "daarnaast" aangeeft: - Dat er iets tegenovergesteld wordt gezegd. (Tegenstellend) - Dat er iets wordt toegevoegd aan wat al eerder is genoemd. (Opsommend) - Dat er iets gebeurt dat kan leiden tot iets anders. (Oorzaak) - Dat er wordt uitgelegd waarom iets is gebeurd. (Redengevend)',
                CorrectOptionDescription: 'Opsomming',
                Type: 'Multiple Choice'
            },
            {
                id: '4',
                Text: 'Welk tussenkopje past het best op alinea 3?',
                Options: ['Een arena van levensbeslissingen.', 'Gevaarlijke wedstrijden.', 'Amusement in het Colosseum.', 'De keizer kiest.'],
                CorrectOption: 2,
                Hint: 'Denk aan wat er in de alinea 3 wordt besproken. In die alinea wordt vooral gesproken over wat er allemaal gebeurt in het Colosseum.',
                CorrectOptionDescription: 'Amusement in het Colosseum.',
                Type: 'Multiple Choice'
            },
            {
                id: '5',
                Text: 'Wat was het doel van de gladiatorengevechten in het Colosseum?',
                Options: ['Het doel was dat de keizer zijn macht kon laten zien aan de burgers.', 'Het doel was om iets leuks te doen omdat ze oorlogen hadden verloren.', 'Het doel was om de burgers te vermaken.', 'Het doel was om de slaven en misdadigers te straffen.'],
                CorrectOption: 2,
                Hint: 'Lees de eerste twee zinnen van alinea 3.',
                CorrectOptionDescription: 'Het doel was om de burgers te vermaken.',
                Type: 'Multiple Choice'
            },
            {
                id: '6',
                Text: 'Waarnaar verwijst het woord “ze” in alinea 3?',
                Options: ['De gladiatoren van het Colosseum', 'De Romeinse keizers', 'De burgers van het Romeinse Rijk', 'De misdadigers van het Romeinse Rijk'],
                CorrectOption: 0,
                Hint: 'Lees alinea 3 goed door. Wie vochten in het Colosseum en hoe werden ze genoemd?',
                CorrectOptionDescription: 'De gladiatoren van het Colosseum',
                Type: 'Multiple Choice'
            },
            {
                id: '7',
                Text: 'Welke uitspraken over alinea 3 zijn goed?',
                Options: ['Zin 1 en 2 zijn goed, zin 3 is fout.', 'Zin 1 en 3 zijn goed, zin 2 is fout.', 'Alleen zin 1 is goed, zin 2 en 3 zijn fout.', 'Alleen zin 2 is goed, zin 1 en 3 zijn fout.'],
                CorrectOption: 1,
                Hint: 'Lees de uitspraken goed door en ga ze één voor één af. Gebruik hierbij de informatie van alinea 3.',
                CorrectOptionDescription: 'Zin 1 en 3 zijn goed, zin 2 is fout',
                Type: 'Multiple Choice'
            },
            {
                id: '8',
                Text: 'Welk tussenkopje past het best op alinea 4?',
                Options: ['De opkomst van de Romeinse keizers.', 'Telemachos zijn strijd in de Arena.', 'Het colosseum na de 4e eeuw.', 'Het einde van de gladiatorenspelen.'],
                CorrectOption: 3,
                Hint: 'Denk aan wat er in de alinea 4 wordt besproken. In die alinea wordt vooral gesproken over de gebeurtenissen die leiden tot het einde van de gevechten.',
                CorrectOptionDescription: 'Het einde van de gladiatorenspelen.',
                Type: 'Multiple Choice'
            },
            {
                id: '9',
                Text: 'Hoe kwam er een eind aan de gevechten in het Colosseum?',
                Options: ['De Romeinse burgers waren niet meer geïnteresseerd in het Colosseum.', 'De Keizer Honorius eindigde de spelen omdat hij onder de indruk was van de dood van Telemachos.', 'De Romeinse keizers wilden de gevaren verminderen.', 'Telemachos protesteerde en eindigde de gevechten.'],
                CorrectOption: 1,
                Hint: 'Lees: “In 404 n. Chr protesteerde een monnik genaamd Telemachos tegen de wreedheden door de arena binnen te gaan en te proberen het geweld te stoppen. Hij overleed in het gevecht en zijn dood maakte indruk op keizer Honorius, die uiteindelijk de Spelen beëindigde.”',
                CorrectOptionDescription: 'De Keizer Honorius eindigde de spelen omdat hij onder de indruk was van de dood van Telemachos.',
                Type: 'Multiple Choice'
            },
            {
                id: '10',
                Text: 'Wat is het doel van de schrijver?',
                Options: ['De schrijver wilt de lezer amuseren.', 'De schrijver wilt dat de lezer een mening vormt over het onderwerp.', 'De schrijver wilt de lezer overtuigen.', 'De schrijver wilt de lezer informeren.'],
                CorrectOption: 3,
                Hint: 'Lees de zin en bedenk welk antwoord het beste bij de tekst past. Probeer te bedenken of de tekst: de lezer probeert te vermaken door een verzonnen verhaal te vertellen (Amuseren). de lezer laat denken waardoor hij een mening kan vormen over de tekst (Een mening vormen). de lezer probeert te overtuigen over wat er allemaal in de tekst staat (Overtuigen). de lezer probeert te informeren over feiten (Informeren).',
                CorrectOptionDescription: 'De schrijver wilt de lezer informeren over feiten.',
                Type: 'Multiple Choice'
            }
        ]
    },
    {
        id: 3,
        QuizGroupId: '8000',
        Title: 'Het raadsel van de Bermudadriehoek',
        Description: 'In het grote stuk van de Atlantische Oceaan, tussen Bermuda, Miami en Puerto Rico, ligt een plek die bekend staat als de Bermudadriehoek. Hier gebeuren vreemde dingen, veel schepen en vliegtuigen zijn er verdwenen. Waarom is dit gebied zo raar en eng? Laten we eens kijken naar het mysterie van de Bermudadriehoek.',
        Banner: '../public/assets/images/MDB-Background.png',
        EmbeddedText: `
            <p>In het grote stuk van de Atlantische Oceaan, tussen Bermuda, Miami en Puerto Rico, ligt een plek die bekend staat als de Bermudadriehoek. Hier gebeuren vreemde dingen, veel schepen en vliegtuigen zijn er verdwenen. Waarom is dit gebied zo raar en eng? Laten we eens kijken naar het mysterie van de Bermudadriehoek.</p>
            <p>De Bermudadriehoek is beroemd om zijn rare verdwijningen. Veel schepen en vliegtuigen zijn daar verdwenen zonder een duidelijke reden. Ze zijn ook niet meer terug te vinden. Volgens verhalen zeiden de mensen dat ze vreemde elektronische problemen hadden vlak voordat ze verdwenen. Maar wat er precies gebeurt, blijft een raadsel.</p>
            <p>In de Bermudadriehoek zijn veel ideeën over wat er gebeurt, maar niemand weet het zeker. Eén idee is dat sterke magnetische velden het kompas van schepen en vliegtuigen in de war brengen. Meestal zorgen de magnetische velden er juist voor dat zeelieden en piloten de goede weg kunnen vinden, maar in de Bermudadriehoek gaat dat fout. Daardoor wordt het moeilijk om te weten welke kant ze op moeten gaan en raken ze verdwaald. Anderen denken dat er onderwater vulkanen zijn die schepen laten zinken of vliegtuigen laten neerstorten. <b>Bovendien</b> gaan er geruchten rond dat er monsters in het water leven.</p>
            <p>Sommige onderzoekers denken dat menselijke fouten, slecht weer en technische problemen vaak de oorzaak zijn van de verdwijningen. Ondanks deze logische verklaringen blijft de Bermudadriehoek voor veel mensen een fascinerend en mysterieus gebied.</p>
            <p>Hoewel er veel rare verhalen zijn over de Bermudadriehoek, denken wetenschappers dat niet alles waar is. Ze zeggen dat er niet meer verdwijningen zijn dan op andere drukke plekken op zee. Ook zijn veel verhalen overdreven of verzonnen. Er zijn namelijk ook verhalen van mensen die zonder problemen door de Bermudadriehoek zijn gereisd. Deze verhalen krijgen vaak minder aandacht dan de mysterieuze verdwijningen.</p>
            <p>Terwijl wetenschappers proberen erachter te komen wat er precies gebeurt, blijft de Bermudadriehoek een herinnering aan de vele <b>mythische</b> mysteries van de wereld. Misschien komen we er ooit achter wat er echt gebeurt, maar tot die tijd blijft het een bron van verbazing voor ons allemaal.</p>
        `,
        Difficulty: 'easy',
        QuizType: 'grammatica',
        Created_at: 'creationDate',
        Modified_at: 'modificationDate',
        Questions: [
            {
                QuestionId: '1',
                Text: 'Waar staat de Bermudadriehoek volgens de tekst bekend om?',
                Options: ['Schepen en vliegtuigen hebben elektronische problemen gehad en zijn daardoor verdwenen.', 'Er gebeuren vreemde dingen rondom de Bermudadriehoek.', 'Schepen en vliegtuigen zijn zonder duidelijke reden verdwenen.', 'Dat is niet duidelijk.'],
                CorrectOption: 2,
                Hint: 'Welke gebeurtenissen worden er genoemd in de eerste alinea?',
                CorrectOptionDescription: 'Schepen en vliegtuigen zijn zonder duidelijke reden verdwenen.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '2',
                Text: 'Wat is waarschijnlijk het gevolg van de magnetische velden in de Bermudadriehoek op de apparatuur van schepen en vliegtuigen?',
                Options: ['Ze worden beïnvloed en kunnen storingen krijgen.', 'Ze worden versterkt en functioneren beter.', 'Ze worden uitgeschakeld.', 'Ze worden beïnvloed en geven een gevaarlijke route weer.'],
                CorrectOption: 0,
                Hint: 'Wat staat er in alinea 3 over magnetische velden? Wat is vergelijkbaar met \'in de war brengen\'?',
                CorrectOptionDescription: 'Ze worden beïnvloed en kunnen storingen krijgen.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '3',
                Text: 'Waar wordt een kompas voor gebruikt?',
                Options: ['Om schepen en vliegtuigen in de war te brengen.', 'Om de magnetische velden te verstoren.', 'Om het apparatuur van schepen en vliegtuigen werkend te houden.', 'Om de juiste weg te vinden.'],
                CorrectOption: 3,
                Hint: 'Wat gebeurt er met de kompas zodra het in een omgeving met sterke magnetische velden bevindt?',
                CorrectOptionDescription: 'Om de juiste weg te vinden.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '4',
                Text: 'Welke functie heeft het signaalwoord “bovendien” in alinea 3?',
                Options: ['Het geeft een reden aan.', 'Het geeft een tegenstelling aan.', 'Het geeft een opsomming aan.', 'Het trekt een conclusie.'],
                CorrectOption: 2,
                Hint: 'Bedenk of het signaalwoord "bovendien" wordt gebruikt om: - Een reden te geven - Een tegenstelling te geven - Aanvullende info te geven - De belangrijkste punten op te noemen',
                CorrectOptionDescription: 'Het geeft een opsomming aan.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '5',
                Text: 'Wat denken wetenschappers over het aantal verdwijningen in de Bermudadriehoek?',
                Options: ['Er zijn meer verdwijningen dan op andere drukke plekken op zee.', 'Er zijn minder verdwijningen dan op andere drukke plekken op zee.', 'Het aantal verdwijningen is precies hetzelfde als op andere drukke plekken op zee.', 'Wetenschappers hebben hier geen onderzoek naar gedaan.'],
                CorrectOption: 2,
                Hint: 'Denk aan wat er wordt gezegd over de vergelijking tussen de Bermudadriehoek en andere drukke plekken op zee.',
                CorrectOptionDescription: 'Het aantal verdwijningen is precies hetzelfde als op andere drukke plekken op zee.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '6',
                Text: 'Bij welke alinea past de titel “Misleidende verhalen” het best?',
                Options: ['Alinea 4', 'Alinea 2', 'Alinea 5', 'Alinea 3'],
                CorrectOption: 0,
                Hint: 'Misleidende verhalen zijn verhalen die jou eigenlijk op het verkeerde been zetten. Dus je krijgt het verkeerde beeld over iets. In welke alinea gaat het over misleidende verhalen?',
                CorrectOptionDescription: 'Alinea 4',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '7',
                Text: 'Wat is de huidige mening van wetenschappers over de verhalen over de Bermudadriehoek?',
                Options: ['Ze geloven dat alle verhalen waar zijn.', 'Ze denken dat de meeste verhalen overdreven of verzonnen zijn.', 'Ze hebben geen mening over de verhalen.', 'Ze denken dat de verhalen verzonnen zijn door de lokale bevolking.'],
                CorrectOption: 1,
                Hint: 'Lees alinea 4 en kijk naar wat wetenschappers denken over de waarheid van de verhalen. Welke mening vind je letterlijk terug in de tekst?',
                CorrectOptionDescription: 'Ze denken dat de meeste verhalen overdreven of verzonnen zijn.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '8',
                Text: 'Welke uitspraken zijn juist over alinea 5?',
                Options: ['Menselijke fouten, slecht weer en technische problemen worden genoemd als mogelijke oorzaken van de verdwijningen.', 'In de alinea staat dat de wetenschappers de Bermudadriehoek erg veilig vinden.', 'Alle onderzoekers vinden dat menselijke fouten, slecht weer en technische problemen de enige redenen zijn voor de verdwijningen.'],
                CorrectOption: 0,
                Hint: 'Vergelijk de uitspraken met wat er in alinea 5 wordt gezegd over de mogelijke oorzaken van de verdwijningen. Ga ze een voor een af. Welke is/zijn dan juist?',
                CorrectOptionDescription: 'I',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '9',
                Text: 'Wat betekent het woord “mythisch”?',
                Options: ['Wetenschappelijk bewezen.', 'Oude verhalen of legendes.', 'Gevaarlijk en onvoorspelbaar.', 'Onbekend en onopgelost.'],
                CorrectOption: 1,
                Hint: 'Welke betekenis past nu het best bij het woord?',
                CorrectOptionDescription: 'Oude verhalen of legendes',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '10',
                Text: 'Waarom is de Bermudadriehoek een ‘bron van verbazing’ volgens de laatste alinea?',
                Options: ['Omdat er geen logische verklaringen zijn.', 'Omdat alle schepen en vliegtuigen die door de Bermudadriehoek gaan, verdwijnen.', 'Omdat alle verhalen over de Bermudadriehoek verzonnen zijn.', 'Omdat niemand precies weet wat er echt gebeurt.'],
                CorrectOption: 3,
                Hint: 'Lees de laatste alinea aandachtig door. Welk antwoord staat in de tekst weergegeven?',
                CorrectOptionDescription: 'Omdat niemand precies weet wat er echt gebeurt.',
                QuestionType: "Multiple Choice"
            }
        ]
    },
    {
        id: 4,
        QuizGroupId: '8000',
        Title: 'Koken is een wetenschap',
        Description: 'Leer over de wetenschap achter koken en ontdek waarom sommige gerechten niet lukken. Begrijp de rol van ingrediënten zoals gist, bakpoeder en emulgatoren bij het bereiden van voedsel.',
        Banner: '../public/assets/images/Koken-Science.png',
        EmbeddedText: `
            <p>Je hebt vast wel meegemaakt dat je een keer een lekkere pannenkoek of taart wil bakken. Je volgt de instructies goed, maar toch komt het er niet uit zoals op de foto’s. Je pannenkoek is hard en taai, of je taart is plat en het voelt alsof je op een blok boter kauwt. Waarom is dat koken toch zo moeilijk? Nou, dat komt omdat koken een wetenschap is! Er komt veel meer bij kijken dan je zou denken. Om goed ervoor te zorgen dat het de volgende keer wat beter gaat, moet je het eerst snappen.</p>
            <p>Wanneer je brood bakt, maak je meestal gebruik van gist. Je weet misschien al dat het ervoor zorgt dat het brood lekker zacht wordt, maar weet je ook hoe? Gist is een schimmel die suikers in het deeg als het ware opeet. Daarbij komt er een gas vrij. Dit is hetzelfde gas dat zorgt voor de prik in je frisdrank, en hetzelfde gas dat jij uitademt. <b>Het</b> creëert bubbeltjes in het deeg, waardoor het deeg <b>rijst</b> en dus luchtig wordt. Hetzelfde idee wordt gebruikt bij het bakken van cake, alleen wordt hier bakpoeder voor gebruikt. Ook bakpoeder vormt een gas waardoor er bubbeltjes in het beslag komen. Zo krijg je een lekkere kruimelige cake.</p>
            <p>Er is nog een proces dat heel erg vaak voorkomt bij het koken. Je weet vast wel dat water en olie niet mengen. Toch zit er in je eten een combinatie van verschillende vetten en water. Het mengen van twee vloeistoffen die eigenlijk niet goed mengen heet met een moeilijk woord ‘emulgeren’. Dit proces wordt gebruikt bij het maken van verschillende sauzen, zoals mayonaise. Bij het maken van mayonaise worden onder andere azijn en olie met elkaar gemengd. Om ervoor te zorgen dat je niet twee lagen met azijn en olie krijgt, wordt er eigeel bij toegevoegd. Het eigeel werkt als <b>emulgator</b>. Het zorgt ervoor dat de stoffen met elkaar vermengd blijven. De mayonaise die je nu hebt gemaakt wordt gebruikt in verschillende andere sauzen, zoals honing-mosterdsaus of knoflooksaus.</p>
            <p>En natuurlijk heb je weleens gezien hoe snoep gemaakt wordt. Suiker wordt gesmolten, en wordt later zo hard als steen. Daarvoor moet je een hele specifieke temperatuur krijgen, want anders heb je de kans dat het suiker verbrandt of juist niet meer hard wordt. Bij <b>karamelliseren</b> wordt het suiker tot de goede temperatuur gebracht. De suikerdeeltjes breken af en vormen kristallen, hierdoor krijgt het ook een goudbruine kleur. Door met de temperatuur te spelen, kun je verschillende soorten karamel krijgen. Zo zal een temperatuur tussen 118 en 132 graden Celsius zorgen voor een zachte karamel die geschikt is voor een lekkere karamelsaus, terwijl een temperatuur tussen de 135 en 145 graden perfect zal zijn voor toffees en bonbons. Voor een harde karamel zal je een temperatuur nodig hebben van 150 tot 160 graden. Maar maak het niet te heet, want boven de 160 zal de karamel heel knapperig worden, of helemaal verbranden! Dat is natuurlijk niet zo lekker.</p>
            <p>Zoals je ziet is koken een echte wetenschap. Nu begrijp je misschien waarom het ook zo vaak fout gaat. Als je net te veel gist toevoegt, zullen de luchtbubbels misschien te groot worden waardoor je brood kan instorten. Of als je niet genoeg eigeel toevoegt aan je mayonaise, zal je een rare pap krijgen van oliedruppels en azijn. Maar vergeet niet dat koken niet alleen een wetenschap is. Het is ook een kunst. Je moet het dus niet alleen begrijpen, maar je moet het ook oefenen. Het onderzoek is dus gedaan. Nu kan je beginnen met het experimenteren!</p>
        `,
        Difficulty: 'medium',
        QuizType: 'verwijswoorden&signaalwoorden',
        Created_at: 'creationDate',
        Modified_at: 'modificationDate',
        Questions: [
            {
                QuestionId: '1',
                Text: 'Waarnaar verwijst het woordje “het” in alinea 2?',
                Options: ['Het brood', 'Het deeg', 'Het rijzen', 'Het gas'],
                CorrectOption: 3,
                Hint: 'Lees: “Dit is … jij uitademt.” in alinea 2. Wat is de prik in je frisdrank en wat ademen we uit?',
                CorrectOptionDescription: 'Het gas',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '2',
                Text: 'Wat betekent het woord “rijst” in alinea 2?',
                Options: ['Eetbare graansoort, afkomstig van de rijstplant', '(Rijzen) omhoog gaan groeien', 'Gekookt gerecht waarbij rijstkorrels worden gekookt in water', '(Rijzen) het verplaatsen van de ene plaats naar de andere'],
                CorrectOption: 1,
                Hint: 'In alinea 2 staat: “Het creëert bubbeltjes in het deeg, waardoor het deeg rijst en dus luchtig wordt.” Wat gebeurt er met het deeg als het luchtig wordt?',
                CorrectOptionDescription: '(Rijzen) omhoog gaan groeien',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '3',
                Text: 'Wat is de rol van gas bij het rijzen van deeg?',
                Options: ['Het voegt smaak toe.', 'Het maakt het geheel kleurrijk.', 'Het creëert bubbeltjes, waardoor het deeg of beslag luchtig wordt.', 'Het zorgt voor een knapperige textuur.'],
                CorrectOption: 2,
                Hint: 'Het antwoord staat in dezelfde zin als de vorige vraag: “Het creëert bubbeltjes in het deeg, waardoor het deeg rijst en dus luchtig wordt.”',
                CorrectOptionDescription: 'Het creëert bubbeltjes, waardoor het deeg of beslag luchtig wordt.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '4',
                Text: 'Wat is de functie van bakpoeder bij het bakken van cake?',
                Options: ['Het geeft kleur aan de cake.', 'Het zorgt voor een knapperige korst.', 'Het vormt een gas, waardoor bubbeltjes ontstaan in het beslag.', 'Het voegt vocht toe aan het beslag.'],
                CorrectOption: 2,
                Hint: 'De functie van bakpoeder is een beetje hetzelfde als de functie van gist in brood. Waar zorgt het gist in het brood ook alweer voor?',
                CorrectOptionDescription: 'Het vormt een gas, waardoor bubbeltjes ontstaan in het beslag.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '5',
                Text: 'Welk tussenkopje past het best boven alinea 3?',
                Options: ['Emulgeren', 'Sauzen', 'Mayonaise', 'Mengen'],
                CorrectOption: 0,
                Hint: 'Waar wordt het meeste over gesproken in alinea 3? Wat wordt er hier uitgelegd?',
                CorrectOptionDescription: 'Emulgeren',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '6',
                Text: 'Wat is een “emulgator” (alinea 3)?',
                Options: ['Een stof die zorgt dat twee dingen die normaal niet willen mengen wel gemengd blijven.', 'Het mengsel dat je krijgt als je twee dingen hebt gemengd die niet willen mengen.', 'Mayonaise.', 'Een saus die met mayonaise is gemengd.'],
                CorrectOption: 0,
                Hint: 'Lees in alinea 3: “Het mengen … woord ‘emulgeren.” Het woord ‘emulgator’ betekent niet precies hetzelfde, maar heeft er wel mee te maken. Lees ook de zin erna: “Het zorgt … vermengd blijven.” Streep de minst logische antwoorden eerst weg.',
                CorrectOptionDescription: 'Een stof die zorgt dat twee dingen die normaal niet willen mengen wel gemengd blijven.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '7',
                Text: 'Wat wordt bedoeld met "karamelliseren" (alinea 4)?',
                Options: ['Het toevoegen van karamel aan gerechten.', 'Het koken van suiker tot het de gewenste temperatuur bereikt.', 'Het mengen van karamel met andere ingrediënten.', 'Het laten stollen van suiker.'],
                CorrectOption: 1,
                Hint: 'Lees: “Bij karamelliseren … temperatuur gebracht.” in alinea 4. Ga dan alle antwoorden langs.',
                CorrectOptionDescription: 'Het koken van suiker tot het de gewenste temperatuur bereikt.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '8',
                Text: 'Welke van de volgende stellingen over alinea 4 zijn waar?',
                Options: ['Alleen stelling i is waar.', 'Stellingen i en ii zijn waar.', 'Stellingen ii en iii zijn waar.', 'Alle stellingen zijn waar.'],
                CorrectOption: 3,
                Hint: 'Bekijk eerst alle stellingen één voor één. Controleer voor elke stelling of het waar is of niet. Wordt er gesproken over het maken van snoep in alinea 4? Wordt er gesproken over hoe hard de karamel wordt en hoe je het kan veranderen? Wordt er gesproken over de temperatuur bij het maken van karamel?',
                CorrectOptionDescription: 'Alle stellingen zijn waar.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '9',
                Text: 'Je wil harde karamel snoepjes maken. Welke temperatuur heb je nodig?',
                Options: ['Tussen de 118 en 132 graden Celsius', 'Tussen de 135 en 145 graden Celsius', 'Tussen de 150 en 160 graden Celsius', 'Meer dan 160 graden Celsius'],
                CorrectOption: 2,
                Hint: 'Lees: “Voor een … helemaal verbranden.” in alinea 4. Wat staat in deze zin over de temperatuur voor het maken van harde karamel?',
                CorrectOptionDescription: 'Tussen de 150 en 160 graden Celsius',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '10',
                Text: 'Lees: “Maar vergeet…een kunst.” in het slot. Waarom is het zo belangrijk dat koken een kunst is?',
                Options: ['Omdat het betekent dat je veel moet oefenen om er goed in te worden.', 'Omdat niet alleen wetenschap belangrijk is.', 'Omdat het ervoor zorgt dat je mooiere gerechten kan maken.', 'Het is helemaal niet belangrijk.'],
                CorrectOption: 0,
                Hint: 'Lees: “Je moet … ook oefenen.” Het signaalwoord “dus” geeft een conclusie aan. Deze zin sluit daarom aan op de zin ervoor, waarin staat dat koken ook een kunst is.',
                CorrectOptionDescription: 'Omdat het betekent dat je veel moet oefenen om er goed in te worden.',
                QuestionType: "Multiple Choice"
            }
        ]
    },
    {
        id: 5,
        QuizGroupId: '8000',
        Title: 'Gamen is goed voor je?',
        Description: 'Ontdek de voor- en nadelen van gamen voor kinderen en hoe het hun vaardigheden en gedrag kan beïnvloeden.',
        Banner: '../public/assets/images/Gaming-Background.png',
        EmbeddedText: `
            <p>Kinderen zitten veel te veel achter computers, tablets en telefoons, volgens de meeste mensen. En wat doen ze nou allemaal daarop? Niks nuttigs, zullen de meeste mensen zeggen. Maar toch is er wel iets, genaamd gamen. Nu zou je denken: "Hoe in vredesnaam is dat nou nuttig?" Nou, er zijn meerdere redenen daarvoor.</p>
            <p>Allereerst valt er heel veel te leren van games. Bij veel games moet je strategisch, of in oplossingen denken. Ook heb je een groot ruimtelijk inzicht nodig en al je aandacht erbij kunnen houden. Dat is goed voor je concentratie, dus. Als je er goed mee omgaat, zal je sneller, slimmer, en meer gefocust kunnen nadenken. <b>Dat</b> kan heel erg van pas komen in het echte leven, onder andere op school.</p>
            <p>__1__ spelen veel kinderen multiplayer games. Dit betekent dat meerdere kinderen tegelijkertijd met elkaar samen aan het spelen zijn. Dit leert hun natuurlijk om samen te werken. Het kan zelfs helpen om kinderen die normaal gesproken elkaar niet opzoeken, samen te brengen. Daarnaast bouwt het een vertrouwensband op tussen de spelers, vooral als ze vaak samenspelen.</p>
            <p>Een ander voordeel is het doorzettingsvermogen. Veel games bevatten uitdagende levels en obstakels die spelers moeten overwinnen. Door elke keer opnieuw te proberen en te falen, leren de kinderen om te gaan met frustratie. Dit is niet alleen nuttig in het gamen zelf, maar heeft ook invloed op hun echte leven. Ze zullen minder snel opgeven en beter gemotiveerd zijn.</p>
            <p>Bovendien kunnen bepaalde games elementen bevatten die kinderen onbewust stimuleren om meer te leren. Historische games kunnen interesse wekken in geschiedenis, terwijl ingewikkelde verhalen hun taalvaardigheid kunnen verbeteren. Creatieve games kunnen hen inspireren en misschien wel een interesse opwekken in kunst. Daarbij leert het hen creatieve oplossingen te bedenken.</p>
            <p>Helaas zijn het niet alleen maar positieve effecten. Hoewel gamen veel goede dingen voor je kan doen, zijn er ook een paar dingen waar je op moet letten. Bijvoorbeeld, als je te veel gamet, beweeg je minder. Daardoor word je minder fit en sneller moe. Dat is natuurlijk minder goed voor je schoolprestaties. Ook kan het juist zorgen voor <b>isolatie</b>. Als je op school elke pauze op je telefoon zou gamen, zou je niet meer in het echt met je klasgenoten spelen, en dan zou je best eenzaam zijn. Ten slotte kan het natuurlijk ook een grote afleiding zijn. Als je je alleen bezighoudt met games, zal je niet meer doen wat je allemaal hoort te doen op een dag.</p>
            <p>De waarheid is, als jij thuis iets hebt waar je lekker op kan gamen, dan weten je ouders ook wel dat er voordelen aan zijn. Ze gaan je natuurlijk niet iets geven wat slecht voor je is. Maar als je ouders zeggen dat het genoeg is, hebben ze daar waarschijnlijk wel een punt!</p>
        `,
        Difficulty: 'medium',
        QuizType: 'samenvatten',
        Created_at: 'creationDate',
        Modified_at: 'modificationDate',
        Questions: [
            {
                QuestionId: '1',
                Text: 'Waarnaar verwijst “dat” in alinea 2?',
                Options: ['Games', 'Het echte leven', 'Sneller, slimmer, en meer gefocust nadenken', 'Je aandacht erbij kunnen houden'],
                CorrectOption: 2,
                Hint: 'Houd de zin even apart. Vervang ‘dat’ door elk mogelijk antwoord. Welk antwoord is het meest logisch?',
                CorrectOptionDescription: 'Sneller, slimmer, en meer gefocust nadenken',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '2',
                Text: 'Wat wordt niet in alinea 2 genoemd als voordeel van het spelen van games?',
                Options: ['Het verbetert het ruimtelijk inzicht van kinderen.', 'Het leert kinderen strategisch en oplossingsgericht denken.', 'Het brengt kinderen samen en bevordert samenwerking.', 'Het verhoogt het concentratievermogen van kinderen.'],
                CorrectOption: 2,
                Hint: 'Ga eerst na welke voordelen worden benoemd. Lees daarvoor alinea 2 door en streep dan af wat wel wordt benoemd.',
                CorrectOptionDescription: 'Het brengt kinderen samen en bevordert samenwerking.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '3',
                Text: 'Welk mogelijke tussenkopje zou het beste passen bij alinea 3?',
                Options: ['"Superbrein op school"', '"Samen sta je sterk"', '"Solo of samen?"', '"Op vertrouwen kun je bouwen"'],
                CorrectOption: 3,
                Hint: 'Kijk naar welk antwoord over de gehele alinea gaat. Gaat het over goede prestaties op school, samenwerking, de verschillen tussen alleen en samenwerken of over vertrouwen?',
                CorrectOptionDescription: '"Op vertrouwen kun je bouwen"',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '4',
                Text: 'Welke eigenschappen worden ontwikkeld door levels steeds opnieuw te spelen totdat het lukt volgens alinea 4?',
                Options: ['Frustratie en motivatie', 'Doorzettingsvermogen en overwinning', 'Doorzettingsvermogen en motivatie', 'Motivatie en overwinning'],
                CorrectOption: 2,
                Hint: 'Lees alinea 4 goed door. Welke positieve eigenschappen worden er allemaal benoemd in de alinea? En welke hiervan worden beter door te gamen?',
                CorrectOptionDescription: 'Doorzettingsvermogen en motivatie',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '5',
                Text: 'Wat past het best op de open plek in alinea 3?',
                Options: ['Daarnaast', 'Daardoor', 'Ten eerste', 'Kortom'],
                CorrectOption: 0,
                Hint: 'Kijk ook naar de alinea ervoor. Wat voor verband is er tussen alinea 2 en 3? Welk signaalwoord geeft hetzelfde verband weer?',
                CorrectOptionDescription: 'Daarnaast',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '6',
                Text: 'Wat betekent het woord “isolatie” in alinea 6?',
                Options: ['Materiaal dat ervoor zorgt dat huizen niet te veel warmte verliezen in de winter en niet te veel warmte binnen krijgen in de zomer.', 'Terugtrekken van anderen, wat leidt tot afstand van je klasgenoten en eenzaamheid.', 'Het is als een schild dat wordt gebruikt om te voorkomen dat elektriciteit weglekt of ergens anders naartoe gaat waar het niet hoort.', 'Elke pauze op je telefoon zitten en gamen in plaats van buitenspelen.'],
                CorrectOption: 1,
                Hint: 'Lees: ‘Als je op school elke pauze op je telefoon zou gamen, zou je niet meer in het echt met je klasgenoten spelen, en dan zou je best eenzaam zijn.’ Welke betekenis van isolatie past er dan het beste bij?',
                CorrectOptionDescription: 'Terugtrekken van anderen, wat leidt tot afstand van je klasgenoten en eenzaamheid.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '7',
                Text: 'Wat wordt genoemd als de nadelen van te veel gamen in alinea 6?',
                Options: ['Minder sporten en slaaptekort', 'Isolatie, afleiding en vermoeidheid', 'Ruzie met ouders omdat je niet doet wat je hoort te doen op een dag.', 'Betere motivatie en doorzettingsvermogen'],
                CorrectOption: 1,
                Hint: 'Lees alinea 6 goed door. Welke nadelen worden letterlijk in die alinea genoemd?',
                CorrectOptionDescription: 'Isolatie, afleiding en vermoeidheid',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '8',
                Text: 'Welke van de volgende stellingen zijn waar?',
                Options: ['Gamen kan kinderen inspireren.', 'Het spelen van multiplayer games leidt altijd tot isolatie en eenzaamheid.', 'Doorzettingsvermogen dat ontwikkelt bij het spelen van games heeft geen invloed op het echte leven.', 'Alle stellingen zijn waar.'],
                CorrectOption: 0,
                Hint: 'Ga elke stelling na. Wat wordt er in alinea 3 verteld over multiplayer games? Wat wordt er verteld over het doorzettingsvermogen in alinea 4? En wat wordt er in alinea 5 verteld over inspiratie?',
                CorrectOptionDescription: 'Gamen kan kinderen inspireren.',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '9',
                Text: 'Vanaf welke alinea wordt verteld dat gamen ook negatieve effecten kan hebben?',
                Options: ['Alinea 2', 'Alinea 4', 'Alinea 6', 'Alinea 7'],
                CorrectOption: 2,
                Hint: 'In welke alinea worden nadelen van gamen benoemd?',
                CorrectOptionDescription: 'Alinea 6',
                QuestionType: "Multiple Choice"
            },
            {
                QuestionId: '10',
                Text: 'Waarom is het een goed idee om naar je ouders te luisteren als ze zeggen dat je moet stoppen met gamen volgens de tekst?',
                Options: ['Als je niet luistert worden je ouders boos en krijg je straf.', 'Je ouders hebben je iets gegeven wat eigenlijk niet goed voor je is.', 'Je mag eigenlijk niet gamen omdat het slecht voor je is.', 'Als je te lang doorgaat zijn er negatieve effecten zoals eenzaamheid.'],
                CorrectOption: 3,
                Hint: 'Bedenk goed naar waar de gehele tekst over gaat. Een aantal van de antwoorden sluiten niet aan op de tekst. Het doel van de tekst is om de positieve en negatieve effecten van gamen te laten zien.',
                CorrectOptionDescription: 'Als je te lang doorgaat zijn er negatieve effecten zoals eenzaamheid.',
                QuestionType: "Multiple Choice"
            }
        ]
    }
];

// Temporary function for uploading a quiz filled with test data and sends it to Firestore
async function updateQuizzes() {
    try {
        const quizzesRef = collection(db, "quizzes");

        // Loop through the quizzes array and create a document for each quiz
        for (const quiz of quizzes) {
            const quizId = (quiz.id || 0).toString();
            const quizDocRef = doc(quizzesRef, quizId);

            // Try to get the document
            const quizDocSnap = await getDoc(quizDocRef);

            // If the document doesn't exist, create it
            if (!quizDocSnap.exists()) {
                console.log("Creating new quiz document...", quizId);
                await setDoc(quizDocRef, quiz);
                console.log("Quiz document created!");
            }
        }

        console.log("All quiz documents updated!");

    } catch (error) {
        console.error("Error updating quizzes document:", error);
    }
};


async function getQuizById(quizDocRef) {
    const quizDocSnap = await getDoc(quizDocRef);

    if (quizDocSnap.exists()) {
        const quizDocData = quizDocSnap.data();
        // Process the quiz document data as needed
        return quizDocData;
    } else {
        console.log(`No quiz found with ID ${quizDocRef.id}`);
        return null;
    }
}

/* Binary Search Tree logic related to searching relevant quiz data*/
class Node {
    constructor(data, left = null, right = null) {
        this.data = data;
        this.left = left;
        this.right = right;
    }
}

class BST {
    constructor() {
        this.root = null;
    }
    add(data) {
        const node = this.root;
        if (node === null) {
            this.root = new Node(data);
            return;
        } else {
            const searchTree = function (node) {
                if (data < node.data) {
                    if (node.left === null) {
                        node.left = new Node(data);
                        return;
                    } else if (node.left !== null) {
                        return searchTree(node.left);
                    }
                } else if (data > node.data) {
                    if (node.right === null) {
                        node.right = new Node(data);
                        return;
                    } else if (node.right !== null) {
                        return searchTree(node.right);
                    }
                } else {
                    return null;
                }
            };
            return searchTree(node);
        }
    }

    generate(numNodes = 4096) {
        for (let i = 0; i < numNodes; i++) {
            this.add(i);
        }
    };

    find(value) {
        if (this.root === null) {
            return null;
        }
        return this._find(this.root, value);
    }

    _find(node, value) {
        if (node === null) {
            return null;
        }
        if (value < node.value) {
            return this._find(node.left, value);
        } else if (value > node.value) {
            return this._find(node.right, value);
        } else {
            return node;
        }
    }

    isPresent(data) {
        let current = this.root;
        while (current) {
            if (data === current.data) {
                return true;
            }
            if (data < current.data) {
                current = current.left;
            } else {
                current = current.right;
            }
        }
        return false;
    }
}

// findMin() {
//     let current = this.root;
//     while (current.left !== null) {
//         current = current.left;
//     }
//     return current.data;
// }
// findMax() {
//     let current = this.root;
//     while (current.right !== null) {
//         current = current.right;
//     }
//     return current.data;
// }

// isPresent(data) {
//     let current = this.root;
//     while (current) {
//         if (data === current.data) {
//             return true;
//         }
//         if (data < current.data) {
//             current = current.left;
//         } else {
//             current = current.right;
//         }
//     }
//     return false;
// }
// remove(data) {
//     const removeNode = function (node, data) {
//         if (node == null) {
//             return null;
//         }
//         if (data == node.data) {
//             // node has no children 
//             if (node.left == null && node.right == null) {
//                 return null;
//             }
//             // node has no left child 
//             if (node.left == null) {
//                 return node.right;
//             }
//             // node has no right child 
//             if (node.right == null) {
//                 return node.left;
//             }
//             // node has two children 
//             var tempNode = node.right;
//             while (tempNode.left !== null) {
//                 tempNode = tempNode.left;
//             }
//             node.data = tempNode.data;
//             node.right = removeNode(node.right, tempNode.data);
//             return node;
//         } else if (data < node.data) {
//             node.left = removeNode(node.left, data);
//             return node;
//         } else {
//             node.right = removeNode(node.right, data);
//             return node;
//         }
//     }
//     this.root = removeNode(this.root, data);
// }
// isBalanced() {
//     return (this.findMinHeight() >= this.findMaxHeight() - 1)
// }
// findMinHeight(node = this.root) {
//     if (node == null) {
//         return -1;
//     };
//     let left = this.findMinHeight(node.left);
//     let right = this.findMinHeight(node.right);
//     if (left < right) {
//         return left + 1;
//     } else {
//         return right + 1;
//     };
// }
// findMaxHeight(node = this.root) {
//     if (node == null) {
//         return -1;
//     };
//     let left = this.findMaxHeight(node.left);
//     let right = this.findMaxHeight(node.right);
//     if (left > right) {
//         return left + 1;
//     } else {
//         return right + 1;
//     };
// }


let quizIdInput;

// Cals the updateQuizzes function
updateQuizzes();
const runBtn = document.getElementById("run-btn");
runBtn.addEventListener("click", async () => {

    const quizIdInput = Number(document.getElementById("quiz-id-input").value);

    // Creates Binary Search Tree
    const bst = new BST();
    bst.generate();

    bst.add(1024);
    bst.add(3072);
    bst.add(256);
    bst.add(768);
    bst.add(2304);
    bst.add(767);
    bst.add(3);

    console.log("quizIdInput:", quizIdInput);
    const node = bst.find(quizIdInput);

    if (node) {
        console.log(`Node with value ${node.data} found!`);

        // Use the Firebase Firestore API to retrieve the quiz data for the node
        const quizDocRef = doc(db, "quizzes", `${quizIdInput}`);
        const quizData = await getQuizById(quizDocRef);

        console.log("Quiz data retrieved correctly:", quizData);

        if (quizData === null) {
            console.log("The retrieved quiz data is empty.");
        }
    } else {
        console.log(`Quiz with Id ${quizIdInput} not found in the BST`);
    }
});


// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {

        // Runs BST and Quiz retrieval code
        console.log('Current User Email:', user.email);
        // Cals the updateQuizzes function

    } else {
        // Redirect the user to the 'login_parent_tvt.html' page if the user is not logged in
        window.location.href = "login_parent_tvt.html";
    }
});


