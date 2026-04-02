/* ===========================
   TRANSLATIONS: EN / PL / tlhIngan Hol (Klingon)
   =========================== */

const TRANSLATIONS = {
    en: {
        // Desktop icons
        'icon-about': 'About Me',
        'icon-experience': 'Experience',
        'icon-skills': 'Skills',
        'icon-projects': 'Projects',
        'icon-education': 'Education',
        'icon-recommendations': 'Reviews',
        'icon-contact': 'Contact',
        'icon-terminal': 'Terminal',
        'icon-paint': 'Paint',
        'icon-winamp': 'Winamp',
        'icon-notepad': 'Notepad',
        'icon-cv': 'CV',
        'icon-browser': 'Tor Browser',
        'icon-tetris': 'Tetris',
        'icon-breakout': 'Breakout',
        'start-games': 'Games',

        // Window titles
        'title-winamp': 'Winamp',
        'title-browser': 'Tor Browser',
        'title-about': 'About Me',
        'title-experience': 'Experience',
        'title-skills': 'Device Manager \u2013 Skills',
        'title-projects': 'C:\\Projects',
        'title-education': 'Education',
        'title-recommendations': 'Reviews \u2013 What colleagues say',
        'title-contact': 'Contact',
        'title-paint': 'untitled - Paint',
        'title-terminal-win': 'C:\\WINDOWS\\system32\\cmd.exe',
        'title-terminal-mac': 'Terminal \u2014 zsh',
        'title-terminal-linux': 'jan@portfolio: ~',
        'title-notepad': 'Notepad - untitled.txt',

        // Menu bar
        'menu-file': 'File',
        'menu-edit': 'Edit',
        'menu-view': 'View',
        'menu-help': 'Help',
        'menu-action': 'Action',
        'menu-favorites': 'Favorites',

        // Start
        'start': 'Start',

        // About content
        'about-title': 'Senior Software Engineer w/ MLOps & Agents Mentor',
        'about-location': '\ud83d\udccd Poland \u00b7 Remote',
        'about-tagline': '"AWS, bare metal, Azure, Python, bash, Claude, MCPs, agents, RAGs, SQL/vector/noSQL, people, keeping quality despite increased AI usage."',
        'about-bio-1': 'Versatile and experienced professional, excelling in both DevOps and software engineering roles. Primary skills include <strong>AWS</strong>, <strong>Python</strong>, and <strong>DevOps</strong>, with a strong emphasis on Infrastructure as Code using Terraform + CDK, and CI/CD administration. Bachelor\u2019s Degree in Computer Science from Wroc\u0142aw University of Science and Technology.',
        'about-bio-2': 'Working remotely since 2018 (before COVID made it cool). Passionate about solving complex problems through an analytical approach. Thrives in smaller teams where autonomy matters. Strong time management and project/task management abilities.',
        'about-bio-3': '<strong>\ud83d\udd04 Continuous Improvement & Efficiency</strong><br>Drive continuous improvement initiatives to enhance system/web efficiency, reliability, and productivity. Collaborate with cross-functional teams to ensure projects are delivered on time and within requirements. Oversee engineering standards and best practices.',
        'about-bio-4': '<strong>\ud83d\udd27 Technical Expertise & Support</strong><br>Provide technical guidance and support to team members, resolving complex technical issues. Foster a culture of quality and compliance. Lead new development initiatives from concept to launch. Monitor industry trends and emerging technologies. Respect well-proven solutions and tools.',
        'about-bio-5': '\ud83d\udce9 Connect with me today!',
        'about-status-1': '10+ years of experience',
        'about-status-2': 'Remote since 2018',

        // Experience
        'exp-status-1': '9 positions',
        'exp-status-2': '10+ years in tech',

        // Santander
        'exp-santander-title': 'Senior Software Engineer w/ MLOps & Agents Mentor',
        'exp-santander-type': 'Contract',
        'exp-santander-loc': 'Poznań, Poland · Remote',
        'exp-santander-1': 'Modernized a core AI platform: decomposed a monolithic solution into microservices with clearer ownership and better scalability',
        'exp-santander-2': 'Delivered AI-powered SDLC tools across the org – LLM chatbot workflows, document analysis, Jira ticket analysis, test generation, image classification',
        'exp-santander-3': 'Improved platform reliability through better performance, logging, observability, deep code reviews, and fewer lines of more maintainable code',
        'exp-santander-4': 'Created multiple MCP servers, subagent specifications and internal Python package for database communication',
        'exp-santander-5': 'Key technical contributor: resolving production issues, reducing code complexity, and bringing strong Unix and platform troubleshooting expertise',

        // Nordea
        'exp-nordea-title': 'Senior MLOps Engineer',
        'exp-nordea-type': 'Contract',
        'exp-nordea-loc': 'Gdańsk, Poland · Hybrid',
        'exp-nordea-1': 'Contributed to MLOps, RAG, and AI platform solutions supporting ML workflows and scalable AI/ML adoption',
        'exp-nordea-2': 'Set up infrastructure-as-code foundations for structured, repeatable cloud provisioning',
        'exp-nordea-3': 'Designed reliable data pipelines – efficient, well orchestrated, and production ready',
        'exp-nordea-4': 'Helped define foundations for teams to build, deploy, and operate AI/ML solutions in a compliant, scalable way',
        'exp-nordea-5': 'Reduced manual effort and operational risk in a standardized AWS and Terraform ecosystem',

        // Charity
        'exp-charity-title': 'Infrastructure Specialist & WordPress Wizard',
        'exp-charity-type': 'Freelance · Charity',
        'exp-charity-loc': 'Lubuskie, Poland · Hybrid',
        'exp-charity-1': 'Set up and manage custom WordPress instance with data retention and high availability using EC2 and LAMP',

        // TUI
        'exp-tui-title': 'Senior DevOps Engineer w/ MLOps & Backend',
        'exp-tui-type': 'Freelance',
        'exp-tui-loc': 'Europe · Remote',
        'exp-tui-highlight': '🦆 Foundational member of Machine Learning Lab created by Principal ML Engineer at TUI 🦆',
        'exp-tui-section-1': 'ML Projects and Pipelines',
        'exp-tui-section-2': 'Internal Tools and Infrastructure',
        'exp-tui-section-3': 'External Collaboration and API Design',
        'exp-tui-1': 'Implementing and maintaining ML-specific pipelines (StepFunctions, Sagemaker, Glue, ECS)',
        'exp-tui-2': 'Designing projects using team\'s AI solutions (Sagemaker) with added API logic',
        'exp-tui-3': 'Improving self-hosted MLflow server – security fixes + automated upgrades',
        'exp-tui-4': 'Improving Data Ingestion with AWS Data Pipeline and Glue',
        'exp-tui-5': 'Supporting the first AI assistant and RAG pipeline at TUI',
        'exp-tui-6': 'Created internal tools package (bash, boto3, threading, docker)',
        'exp-tui-7': 'Deployed endpoint handling millions of requests/day',
        'exp-tui-8': 'Designed multi-env deployments (Terraform, CDK, CloudFormation)',
        'exp-tui-9': 'Designed and maintained CI/CD pipelines (GitLab)',
        'exp-tui-10': 'Rolled out code quality steps into dozens of pipelines (black, pylint, sonarqube, tests)',
        'exp-tui-11': 'Integrated Sonarqube, Datadog dashboards, AWS Security Hub',
        'exp-tui-12': 'Collaborating with external teams (FastAPI, Lambda, ECR, SQS, SNS, Sagemaker)',
        'exp-tui-13': 'Enhancing API performance and stability',

        // 3e9
        'exp-3e9-title': 'Remote Software Engineer',
        'exp-3e9-type': 'Freelance',
        'exp-3e9-loc': 'Europe · Remote',
        'exp-3e9-1': 'Python GUI for distributed IoT system (websockets, PyQt5, AWS Lambda, Greengrass)',
        'exp-3e9-2': 'Backend service for real-time communication (MS and Google mail APIs)',
        'exp-3e9-3': 'Odoo ERP/CRM features for Take&Go autonomous stores',
        'exp-3e9-4': 'Dockerized FastAPI project template for microservices',
        'exp-3e9-5': 'Async microservices for debit card payment (idempotency)',
        'exp-3e9-6': 'Migration from bare-metal to AWS (ECS + Lambda Python)',
        'exp-3e9-7': 'Architecture design and documentation for cloud migration',

        // Kodilla
        'exp-kodilla-title': 'Python Mentor',
        'exp-kodilla-type': 'Contract',
        'exp-kodilla-loc': 'Wrocław, Poland',
        'exp-kodilla-1': 'Backend, Big Data, Data Science, Machine Learning, Automated Testing',

        // Xebia
        'exp-xebia-title': 'Software Engineer',
        'exp-xebia-type': 'Full-time',
        'exp-xebia-loc': 'Wrocław, Poland',
        'exp-xebia-1': 'Migrating client\'s infrastructure to AWS using Terraform, Puppet, Packer',
        'exp-xebia-2': 'Designing CI/CD solution for AWS microservices',
        'exp-xebia-3': 'Developing and peer-reviewing Python3 code for AWS Lambda',
        'exp-xebia-4': 'Running AWS practical workshops for certification prep',

        // Clearcode
        'exp-clearcode-title': 'Software Engineer',
        'exp-clearcode-type': 'Part-time',
        'exp-clearcode-loc': 'Wrocław, Poland',
        'exp-clearcode-1': 'Designing DMP and exchange (AdTech) systems on AWS',
        'exp-clearcode-2': 'Hamburg-Wrocław 10-person team, infra/dev focus',
        'exp-clearcode-3': 'Project: <20ms @ 30k rps modular AWS system',

        // Nokia
        'exp-nokia-title': 'Working Student → Summer Trainee',
        'exp-nokia-type': 'Part-time',
        'exp-nokia-loc': 'Wrocław, Poland',
        'exp-nokia-1': 'Telco data analysis with Jupyter, bokeh, pandas',
        'exp-nokia-2': 'Machine learning team (numpy, sklearn)',
        'exp-nokia-3': 'CI and Docker for existing codebase (Jenkins, GitLab CI)',
        'exp-nokia-4': 'Python 2→3 migration, unit and functional tests',

        // Skills
        'skills-status-1': '40+ skills',
        'skills-status-2': '4 LinkedIn assessments passed',
        'cat-cloud': 'Cloud & Infrastructure',
        'cat-lang': 'Languages & Frameworks',
        'cat-devops': 'DevOps & Tools',
        'cat-data': 'Data & ML',
        'cat-testing': 'Testing & Quality',
        'cat-languages': 'Languages',
        'skill-certified': '✓ Certified',
        'skill-assessed': '✓ Assessed',
        'skill-native': 'Native',
        'skill-professional': 'Professional Working',
        'skill-endorsements': 'endorsements',
        'cat-langfw': 'Languages & Frameworks',
        'cat-ai': 'AI, Data & ML',

        // Projects
        'proj-workshops': 'Workshops & Presentations @ TUI',
        'proj-status-1': '15 public repositories',
        'proj-status-2': '148 \u2605 on top project',
        'proj-pylint-desc': 'List of pylint human readable message ids and dev readable codes',
        'proj-faceunlock-desc': 'Small package in your face!',
        'proj-hejtolosowanie-desc': 'Hejto voting tool',
        'proj-multidiary-desc': 'The new reddit',
        'proj-apteka-desc': 'Pharmacy project',
        'proj-rns-desc': 'x86 extension for RNS operations',
        'proj-mlops-name': 'MLOps Workshop',
        'proj-mlops-desc': 'Hackathon for TUI ML Lab \u2013 customer segmentation & end-to-end MLOps workflow. Hosted and mentored participants.',
        'proj-bedrock-name': 'Bedrock Agents Presentation',
        'proj-bedrock-desc': 'Building AI bots with Amazon Bedrock. Proofreader and Q&A support.',
        'proj-sd-name': 'Stable Diffusion Workshop',
        'proj-sd-desc': 'Deploying Stable Diffusion for text-to-image generation. Hosted and mentored participants.',

        // Education
        'edu-certs': 'Certifications',
        'edu-status-1': 'MSc + BSc Engineering',
        'edu-university': 'Wroclaw University of Science and Technology',
        'edu-masters': "Master's Degree, Computer Science",
        'edu-bachelors': 'Bachelor of Science in Engineering, Computer Science',
        'edu-aws-cert': 'AWS Certified Solutions Architect \u2013 Associate',
        'edu-aws-date': 'Issued Jan 2019',

        // Recommendations
        'rec-status-1': '11 recommendations on LinkedIn',
        'rec-status-2': 'All verified colleagues',

        // Contact
        'contact-remote': 'Remote since 2018 \u2013 available worldwide',
        'contact-status': 'Open for opportunities',

        // Context menu
        'ctx-wallpaper': '\ud83d\uddbc\ufe0f Change Wallpaper',
        'ctx-about-os': '\u2139\ufe0f About this OS',

        // Wallpaper picker
        'wp-title': 'Display Properties \u2013 Wallpaper',
        'wp-apply': 'Apply',
        'wp-cancel': 'Cancel',

        // Theme labels
        'theme-switch': 'Switch OS:',

        // Loading
        'loading-text': 'Starting Windows XP...',

        // Terminal
        'term-welcome-1': 'Jan Jurec Portfolio OS [Version 2.1.37]',
        'term-welcome-2': '(C) 2024 Jan Jurec. All rights reserved.',
        'term-welcome-3': 'Type "help" for available commands.',

        // Browser no-net texts
        'browser-nonet-ie-title': 'This page cannot be displayed',
        'browser-nonet-ie-desc': 'Check your Internet connection',
        'browser-nonet-safari-title': 'You Are Not Connected to the Internet',
        'browser-nonet-safari-desc': 'This page can\u2019t be displayed because your Mac isn\u2019t connected to the Internet.',
        'browser-nonet-tor-title': 'NO INTERNET',
        'browser-nonet-tor-desc': 'Unable to connect to the Tor network',
        'browser-nonet-hint': 'Press SPACE to play a game',

        // Browser loading
        'browser-loading-text': 'Loading page...',

        // Hypnotoad
        'hypnotoad-glory': 'ALL GLORY TO THE HYPNOTOAD',

        // Nosacz game
        'game-over': 'GAME OVER',
        'game-score': 'Score',
        'game-highscore': 'Best',
        'game-restart': 'SPACE to play again',
        'game-dk-unlock': 'Master of Onions unlocked in Winamp!',

        // Saw/Jigsaw game
        'saw-intro': 'I want to play a game...',
        'saw-intro-2': 'You have been trapped in vim. Now prove your worth.',
        'saw-intro-3': 'Answer my questions... or lose everything.',
        'saw-rules': 'Rules: Answer correctly within 30 seconds. Wrong answer = lose a life. No lives = game over.',
        'saw-question': 'Question',
        'saw-time-up': 'TIME\'S UP!',
        'saw-wrong': 'WRONG! The answer was',
        'saw-correct': 'Correct.',
        'saw-taunt-1': 'Impressive... but don\'t get comfortable.',
        'saw-taunt-2': 'Well done. But the next one won\'t be so easy.',
        'saw-taunt-3': 'You live... for now.',
        'saw-taunt-4': 'Lucky guess. Or was it?',
        'saw-taunt-5': 'The puppet is not amused.',
        'saw-taunt-6': 'Correct. But time is running out for your friends...',
        'saw-defeat': 'YOU HAVE BEEN DEFEATED.',
        'saw-defeat-2': 'All your files... gone. All your icons... consumed.',
        'saw-defeat-sub': 'Refresh the page... if you dare.',
        'saw-victory': 'You survived... all 150 questions. Impressive.',
        'saw-victory-2': 'But remember... vim is always watching.',
        'saw-type-anything': 'Type anything to begin...',

        // Paint window
        'paint-file-save': 'File: Save',
        'paint-file-download': 'File: Download',
        'paint-edit-undo': 'Edit: Undo',
        'paint-edit-clear': 'Edit: Clear',
        'paint-tool-pencil': 'Pencil',
        'paint-tool-brush': 'Brush',
        'paint-tool-eraser': 'Eraser',
        'paint-tool-fill': 'Fill',
        'paint-tool-spray': 'Spray Can',
        'paint-tool-stamp': 'Stamp',
        'paint-status-ready': 'Ready',
    },

    pl: {
        'icon-about': 'O mnie',
        'icon-experience': 'Do\u015bwiadczenie',
        'icon-skills': 'Umiej\u0119tno\u015bci',
        'icon-projects': 'Projekty',
        'icon-education': 'Wykszta\u0142cenie',
        'icon-recommendations': 'Opinie',
        'icon-contact': 'Kontakt',
        'icon-terminal': 'Terminal',
        'icon-paint': 'Paint',
        'icon-winamp': 'Winamp',
        'icon-notepad': 'Notatnik',
        'icon-cv': 'CV',
        'icon-browser': 'Przeglądarka Tor',
        'icon-tetris': 'Tetris',
        'icon-breakout': 'Breakout',
        'start-games': 'Gry',

        'title-winamp': 'Winamp',
        'title-browser': 'Przeglądarka Tor',
        'title-about': 'O mnie',
        'title-experience': 'Do\u015bwiadczenie',
        'title-skills': 'Mened\u017cer urz\u0105dze\u0144 \u2013 Umiej\u0119tno\u015bci',
        'title-projects': 'C:\\Projekty',
        'title-education': 'Wykszta\u0142cenie',
        'title-recommendations': 'Opinie \u2013 Co m\u00f3wi\u0105 wsp\u00f3\u0142pracownicy',
        'title-contact': 'Kontakt',
        'title-paint': 'bez tytu\u0142u - Paint',
        'title-terminal-win': 'C:\\WINDOWS\\system32\\cmd.exe',
        'title-terminal-mac': 'Terminal \u2014 zsh',
        'title-terminal-linux': 'jan@portfolio: ~',
        'title-notepad': 'Notatnik - bez nazwy.txt',

        'menu-file': 'Plik',
        'menu-edit': 'Edycja',
        'menu-view': 'Widok',
        'menu-help': 'Pomoc',
        'menu-action': 'Akcja',
        'menu-favorites': 'Ulubione',

        'start': 'Start',

        'about-title': 'Starszy In\u017cynier Oprogramowania w/ MLOps & Mentor Agent\u00f3w',
        'about-location': '\ud83d\udccd Polska \u00b7 Zdalnie',
        'about-tagline': '"AWS, bare metal, Azure, Python, bash, Claude, MCP, agenci, RAG, SQL/vector/noSQL, ludzie, utrzymanie jako\u015bci mimo zwi\u0119kszonego u\u017cycia AI."',
        'about-bio-1': 'Wszechstronny i do\u015bwiadczony profesjonalista, bieg\u0142y zar\u00f3wno w DevOps jak i in\u017cynierii oprogramowania. G\u0142\u00f3wne umiej\u0119tno\u015bci to <strong>AWS</strong>, <strong>Python</strong> i <strong>DevOps</strong>, z naciskiem na Infrastructure as Code (Terraform + CDK) oraz administracj\u0119 CI/CD. Licencjat z informatyki na Politechnice Wroc\u0142awskiej.',
        'about-bio-2': 'Praca zdalna od 2018 roku (zanim COVID to upowszechni\u0142). Pasjonat rozwi\u0105zywania z\u0142o\u017conych problem\u00f3w analitycznym podej\u015bciem. Najlepiej dzia\u0142a w mniejszych zespo\u0142ach, gdzie liczy si\u0119 autonomia. Silne umiej\u0119tno\u015bci zarz\u0105dzania czasem i projektami.',
        'about-bio-3': '<strong>\ud83d\udd04 Ci\u0105g\u0142e doskonalenie i wydajno\u015b\u0107</strong><br>Inicjuje dzia\u0142ania zwi\u0119kszaj\u0105ce wydajno\u015b\u0107, niezawodno\u015b\u0107 i produktywno\u015b\u0107 system\u00f3w. Wsp\u00f3\u0142praca z zespo\u0142ami mi\u0119dzyfunkcyjnymi. Nadz\u00f3r nad standardami in\u017cynieryjnymi i najlepszymi praktykami.',
        'about-bio-4': '<strong>\ud83d\udd27 Wiedza techniczna i wsparcie</strong><br>Wsparcie techniczne dla cz\u0142onk\u00f3w zespo\u0142u, rozwi\u0105zywanie z\u0142o\u017conych problem\u00f3w. Kultura jako\u015bci i zgodno\u015bci. Prowadzenie inicjatyw od koncepcji do wdro\u017cenia. Monitorowanie trend\u00f3w i nowych technologii. Szacunek dla sprawdzonych rozwi\u0105za\u0144.',
        'about-bio-5': '\ud83d\udce9 Skontaktuj si\u0119 ze mn\u0105!',
        'about-status-1': '10+ lat do\u015bwiadczenia',
        'about-status-2': 'Zdalnie od 2018',

        'exp-status-1': '9 stanowisk',
        'exp-status-2': '10+ lat w IT',

        // Santander
        'exp-santander-title': 'Starszy Inżynier Oprogramowania w/ MLOps & Mentor Agentów',
        'exp-santander-type': 'Kontrakt',
        'exp-santander-loc': 'Poznań, Polska · Zdalnie',
        'exp-santander-1': 'Zmodernizowano kluczową platformę AI: rozłożono monolityczne rozwiązanie na mikroserwisy z jaśniejszym podziałem odpowiedzialności i lepszą skalowalnością',
        'exp-santander-2': 'Dostarczono narzędzia SDLC napędzane AI w całej organizacji – chatbot LLM, analiza dokumentów, analiza zgłoszeń Jira, generowanie testów, klasyfikacja obrazów',
        'exp-santander-3': 'Poprawiono niezawodność platformy dzięki lepszej wydajności, logowaniu, obserwowalności, szczegółowym code review i mniejszej ilości bardziej utrzymywalnego kodu',
        'exp-santander-4': 'Stworzono wiele serwerów MCP, specyfikacji subagentów oraz wewnętrzny pakiet Python do komunikacji z bazą danych',
        'exp-santander-5': 'Kluczowy kontrybutor techniczny: rozwiązywanie problemów produkcyjnych, redukcja złożoności kodu, silna wiedza z zakresu Unix i diagnostyki platform',

        // Nordea
        'exp-nordea-title': 'Starszy Inżynier MLOps',
        'exp-nordea-type': 'Kontrakt',
        'exp-nordea-loc': 'Gdańsk, Polska · Hybrydowo',
        'exp-nordea-1': 'Wkład w rozwiązania MLOps, RAG i platformy AI wspierające workflow ML oraz skalowalną adopcję AI/ML',
        'exp-nordea-2': 'Budowa fundamentów infrastructure-as-code dla ustrukturyzowanego, powtarzalnego provisioningu chmury',
        'exp-nordea-3': 'Projektowanie niezawodnych pipeline\'ów danych – wydajnych, dobrze zorkiestrowanych i gotowych na produkcję',
        'exp-nordea-4': 'Pomoc w definiowaniu fundamentów umożliwiających zespołom budowanie, wdrażanie i obsługę rozwiązań AI/ML w sposób zgodny i skalowalny',
        'exp-nordea-5': 'Redukcja pracy ręcznej i ryzyka operacyjnego w ustandaryzowanym ekosystemie AWS i Terraform',

        // Charity
        'exp-charity-title': 'Specjalista ds. Infrastruktury & Czarodziej WordPress',
        'exp-charity-type': 'Freelance · Charytatywnie',
        'exp-charity-loc': 'Lubuskie, Polska · Hybrydowo',
        'exp-charity-1': 'Konfiguracja i zarządzanie instancją WordPress z retencją danych i wysoką dostępnością na EC2 i LAMP',

        // TUI
        'exp-tui-title': 'Starszy Inżynier DevOps w/ MLOps & Backend',
        'exp-tui-type': 'Freelance',
        'exp-tui-loc': 'Europa · Zdalnie',
        'exp-tui-highlight': '🦆 Członek założyciel Machine Learning Lab stworzonego przez Principal ML Engineer w TUI 🦆',
        'exp-tui-section-1': 'Projekty ML i Pipeline\'y',
        'exp-tui-section-2': 'Wewnętrzne narzędzia i infrastruktura',
        'exp-tui-section-3': 'Współpraca zewnętrzna i projektowanie API',
        'exp-tui-1': 'Implementacja i utrzymanie pipeline\'ów ML (StepFunctions, Sagemaker, Glue, ECS)',
        'exp-tui-2': 'Projektowanie rozwiązań z użyciem AI zespołu (Sagemaker) z dodaną logiką API',
        'exp-tui-3': 'Ulepszanie self-hosted serwera MLflow – poprawki bezpieczeństwa + automatyczne aktualizacje',
        'exp-tui-4': 'Ulepszanie ingestion danych z AWS Data Pipeline i Glue',
        'exp-tui-5': 'Wsparcie pierwszego asystenta AI i pipeline\'u RAG w TUI',
        'exp-tui-6': 'Stworzenie wewnętrznego pakietu narzędzi (bash, boto3, threading, docker)',
        'exp-tui-7': 'Wdrożenie endpointu obsługującego miliony żądań dziennie',
        'exp-tui-8': 'Projektowanie wdrożeń multi-env (Terraform, CDK, CloudFormation)',
        'exp-tui-9': 'Projektowanie i utrzymanie pipeline\'ów CI/CD (GitLab)',
        'exp-tui-10': 'Wdrożenie kroków jakości kodu w dziesiątkach pipeline\'ów (black, pylint, sonarqube, testy)',
        'exp-tui-11': 'Integracja Sonarqube, dashboardów Datadog, AWS Security Hub',
        'exp-tui-12': 'Współpraca z zespołami zewnętrznymi (FastAPI, Lambda, ECR, SQS, SNS, Sagemaker)',
        'exp-tui-13': 'Poprawa wydajności i stabilności API',

        // 3e9
        'exp-3e9-title': 'Zdalny Inżynier Oprogramowania',
        'exp-3e9-type': 'Freelance',
        'exp-3e9-loc': 'Europa · Zdalnie',
        'exp-3e9-1': 'GUI Python dla rozproszonego systemu IoT (websockets, PyQt5, AWS Lambda, Greengrass)',
        'exp-3e9-2': 'Serwis backendowy do komunikacji w czasie rzeczywistym (API MS i Google mail)',
        'exp-3e9-3': 'Funkcjonalności Odoo ERP/CRM dla autonomicznych sklepów Take&Go',
        'exp-3e9-4': 'Zdockeryzowany szablon projektu FastAPI dla mikroserwisów',
        'exp-3e9-5': 'Asynchroniczne mikroserwisy do płatności kartą debetową (idempotentność)',
        'exp-3e9-6': 'Migracja z bare-metal do AWS (ECS + Lambda Python)',
        'exp-3e9-7': 'Projektowanie architektury i dokumentacja migracji do chmury',

        // Kodilla
        'exp-kodilla-title': 'Mentor Python',
        'exp-kodilla-type': 'Kontrakt',
        'exp-kodilla-loc': 'Wrocław, Polska',
        'exp-kodilla-1': 'Backend, Big Data, Data Science, Machine Learning, Testowanie Automatyczne',

        // Xebia
        'exp-xebia-title': 'Inżynier Oprogramowania',
        'exp-xebia-type': 'Pełny etat',
        'exp-xebia-loc': 'Wrocław, Polska',
        'exp-xebia-1': 'Migracja infrastruktury klienta do AWS z użyciem Terraform, Puppet, Packer',
        'exp-xebia-2': 'Projektowanie rozwiązania CI/CD dla mikroserwisów AWS',
        'exp-xebia-3': 'Tworzenie i recenzowanie kodu Python3 dla AWS Lambda',
        'exp-xebia-4': 'Prowadzenie praktycznych warsztatów AWS do przygotowania do certyfikacji',

        // Clearcode
        'exp-clearcode-title': 'Inżynier Oprogramowania',
        'exp-clearcode-type': 'Pół etatu',
        'exp-clearcode-loc': 'Wrocław, Polska',
        'exp-clearcode-1': 'Projektowanie systemów DMP i exchange (AdTech) na AWS',
        'exp-clearcode-2': '10-osobowy zespół Hamburg-Wrocław, fokus na infra/dev',
        'exp-clearcode-3': 'Projekt: <20ms @ 30k rps modularny system AWS',

        // Nokia
        'exp-nokia-title': 'Student pracujący → Praktykant letni',
        'exp-nokia-type': 'Pół etatu',
        'exp-nokia-loc': 'Wrocław, Polska',
        'exp-nokia-1': 'Analiza danych telko z Jupyter, bokeh, pandas',
        'exp-nokia-2': 'Zespół machine learning (numpy, sklearn)',
        'exp-nokia-3': 'CI i Docker dla istniejącej bazy kodu (Jenkins, GitLab CI)',
        'exp-nokia-4': 'Migracja Python 2→3, testy jednostkowe i funkcjonalne',

        'skills-status-1': '40+ umiej\u0119tno\u015bci',
        'skills-status-2': '4 testy LinkedIn zdane',
        'cat-cloud': 'Chmura i Infrastruktura',
        'cat-lang': 'J\u0119zyki i Frameworki',
        'cat-devops': 'DevOps i Narz\u0119dzia',
        'cat-data': 'Dane i ML',
        'cat-testing': 'Testowanie i Jako\u015b\u0107',
        'cat-languages': 'J\u0119zyki',
        'skill-certified': '\u2713 Certyfikowany',
        'skill-assessed': '\u2713 Oceniony',
        'skill-native': 'Ojczysty',
        'skill-professional': 'Profesjonalny',
        'skill-endorsements': 'popar\u0107',
        'cat-langfw': 'J\u0119zyki i Frameworki',
        'cat-ai': 'AI, Dane i ML',

        'proj-workshops': 'Warsztaty i Prezentacje @ TUI',
        'proj-status-1': '15 publicznych repozytori\u00f3w',
        'proj-status-2': '148 \u2605 w topowym projekcie',
        'proj-pylint-desc': 'Lista czytelnych wiadomo\u015bci pylint i kod\u00f3w dla programist\u00f3w',
        'proj-faceunlock-desc': 'Ma\u0142y pakiet prosto w twarz!',
        'proj-hejtolosowanie-desc': 'Narz\u0119dzie do g\u0142osowania na Hejto',
        'proj-multidiary-desc': 'Nowy reddit',
        'proj-apteka-desc': 'Projekt apteka',
        'proj-rns-desc': 'Rozszerzenie x86 dla operacji RNS',
        'proj-mlops-name': 'Warsztaty MLOps',
        'proj-mlops-desc': 'Hackathon dla TUI ML Lab \u2013 segmentacja klient\u00f3w i pe\u0142ny workflow MLOps. Prowadzenie i mentoring uczestnik\u00f3w.',
        'proj-bedrock-name': 'Prezentacja Bedrock Agents',
        'proj-bedrock-desc': 'Budowanie bot\u00f3w AI z Amazon Bedrock. Korekta i wsparcie Q&A.',
        'proj-sd-name': 'Warsztaty Stable Diffusion',
        'proj-sd-desc': 'Wdra\u017canie Stable Diffusion do generowania obraz\u00f3w z tekstu. Prowadzenie i mentoring uczestnik\u00f3w.',

        'edu-certs': 'Certyfikaty',
        'edu-status-1': 'Magister + In\u017cynier',
        'edu-university': 'Politechnika Wroc\u0142awska',
        'edu-masters': 'Magister, Informatyka',
        'edu-bachelors': 'In\u017cynier, Informatyka',
        'edu-aws-cert': 'AWS Certified Solutions Architect \u2013 Associate',
        'edu-aws-date': 'Wydany sty 2019',

        'rec-status-1': '11 rekomendacji na LinkedIn',
        'rec-status-2': 'Zweryfikowani wsp\u00f3\u0142pracownicy',

        'contact-remote': 'Zdalnie od 2018 \u2013 dost\u0119pny na ca\u0142ym \u015bwiecie',
        'contact-status': 'Otwarty na propozycje',

        'ctx-wallpaper': '\ud83d\uddbc\ufe0f Zmie\u0144 tapet\u0119',
        'ctx-about-os': '\u2139\ufe0f O tym systemie',

        'wp-title': 'W\u0142a\u015bciwo\u015bci ekranu \u2013 Tapeta',
        'wp-apply': 'Zastosuj',
        'wp-cancel': 'Anuluj',

        'theme-switch': 'Zmie\u0144 OS:',

        'loading-text': 'Uruchamianie Windows XP...',

        'term-welcome-1': 'Jan Jurec Portfolio OS [Wersja 2.1.37]',
        'term-welcome-2': '(C) 2024 Jan Jurec. Wszelkie prawa zastrze\u017cone.',
        'term-welcome-3': 'Wpisz "help" aby zobaczy\u0107 dost\u0119pne komendy.',

        // Browser no-net texts
        'browser-nonet-ie-title': 'Nie mo\u017cna wy\u015bwietli\u0107 strony',
        'browser-nonet-ie-desc': 'Sprawd\u017a po\u0142\u0105czenie z Internetem',
        'browser-nonet-safari-title': 'Brak po\u0142\u0105czenia z Internetem',
        'browser-nonet-safari-desc': 'Nie mo\u017cna wy\u015bwietli\u0107 strony, poniewa\u017c Mac nie jest po\u0142\u0105czony z Internetem.',
        'browser-nonet-tor-title': 'NIE MASZ INTERNETU',
        'browser-nonet-tor-desc': 'Nie mo\u017cna po\u0142\u0105czy\u0107 z sieci\u0105 Tor',
        'browser-nonet-hint': 'Naci\u015bnij SPACJ\u0118 aby zagra\u0107 w gr\u0119',

        // Browser loading
        'browser-loading-text': 'Trwa \u0142adowanie strony...',

        // Hypnotoad
        'hypnotoad-glory': 'CA\u0141A CHWA\u0141A HYPNO\u017bABIE',

        // Nosacz game
        'game-over': 'KONIEC GRY',
        'game-score': 'Wynik',
        'game-highscore': 'Rekord',
        'game-restart': 'SPACJA aby zagra\u0107 ponownie',
        'game-dk-unlock': 'Master of Onions odblokowany w Winampie!',

        // Saw/Jigsaw game
        'saw-intro': 'Chcę zagrać w grę...',
        'saw-intro-2': 'Zostałeś uwięziony w vimie. Udowodnij swoją wartość.',
        'saw-intro-3': 'Odpowiedz na moje pytania... albo stracisz wszystko.',
        'saw-rules': 'Zasady: Odpowiedz poprawnie w 30 sekund. Zła odpowiedź = tracisz życie. Brak żyć = koniec gry.',
        'saw-question': 'Pytanie',
        'saw-time-up': 'CZAS MINĄŁ!',
        'saw-wrong': 'ŹLE! Prawidłowa odpowiedź to',
        'saw-correct': 'Poprawnie.',
        'saw-taunt-1': 'Imponujące... ale nie przyzwyczajaj się.',
        'saw-taunt-2': 'Nieźle. Ale następne nie będzie takie łatwe.',
        'saw-taunt-3': 'Żyjesz... na razie.',
        'saw-taunt-4': 'Szczęśliwy strzał. A może nie?',
        'saw-taunt-5': 'Kukiełka nie jest pod wrażeniem.',
        'saw-taunt-6': 'Poprawnie. Ale czas ucieka twoim przyjaciołom...',
        'saw-defeat': 'PONIOSŁEŚ KLĘSKĘ.',
        'saw-defeat-2': 'Wszystkie twoje pliki... zniknęły. Wszystkie ikony... pochłonięte.',
        'saw-defeat-sub': 'Odśwież stronę... jeśli się odważysz.',
        'saw-victory': 'Przeżyłeś... wszystkie 150 pytań. Imponujące.',
        'saw-victory-2': 'Ale pamiętaj... vim zawsze patrzy.',
        'saw-type-anything': 'Wpisz cokolwiek, aby rozpocząć...',

        // Paint window
        'paint-file-save': 'Plik: Zapisz',
        'paint-file-download': 'Plik: Pobierz',
        'paint-edit-undo': 'Edycja: Cofnij',
        'paint-edit-clear': 'Edycja: Wyczyść',
        'paint-tool-pencil': 'Ołówek',
        'paint-tool-brush': 'Pędzel',
        'paint-tool-eraser': 'Gumka',
        'paint-tool-fill': 'Wypełnienie',
        'paint-tool-spray': 'Aerograf',
        'paint-tool-stamp': 'Stempel',
        'paint-status-ready': 'Gotowy',
    },

    klingon: {
        'icon-about': 'jIH',
        'icon-experience': 'noH ta',
        'icon-skills': 'laH',
        'icon-projects': 'ngoH',
        'icon-education': 'ghojmoH',
        'icon-recommendations': 'naD',
        'icon-contact': 'QumwI\'',
        'icon-terminal': 'De\'wI\'',
        'icon-paint': 'rItlh',
        'icon-winamp': 'QoQ muchHom',
        'icon-notepad': 'ghItlh',
        'icon-cv': 'CV',
        'icon-browser': 'HaSta QumwI\'',
        'icon-tetris': 'Tetris',
        'icon-breakout': 'Breakout',
        'start-games': 'Quj',

        'title-winamp': 'QoQ muchHom',
        'title-browser': 'HaSta QumwI\'',
        'title-about': 'jIH - SuvwI\' nughI\'',
        'title-experience': 'may\' ta \u2013 noH mIw',
        'title-skills': 'nuH pat \u2013 laH',
        'title-projects': 'C:\\ngoH_tlhap',
        'title-education': 'ghojmoH \u2013 DuSaQ',
        'title-recommendations': 'naD mu\' \u2013 pIn\'a\' jatlh',
        'title-contact': 'QumwI\' \u2013 jIHvaD yIjatlh',
        'title-paint': 'pagh - rItlh',
        'title-terminal-win': 'C:\\QIN\\ra\'ghom\\Qum.exe',
        'title-terminal-mac': 'De\'wI\' \u2014 tlhIngan Shell',
        'title-terminal-linux': 'jan@yo\'SeH: ~',
        'title-notepad': 'ghItlh De\'wI\' - pagh pong.txt',

        'menu-file': 'teywI\'',
        'menu-edit': 'choH',
        'menu-view': 'legh',
        'menu-help': 'QaH',
        'menu-action': 'vang',
        'menu-favorites': 'parHa\'',

        'start': 'yImev\'egh!',

        'about-title': 'Software Engineer la\' nIvbogh | MLOps | Agents ghojmoHwI\'',
        'about-location': '\ud83d\udccd tera\' Sep \u00b7 najHa\' vum',
        'about-tagline': '"AWS, baS, Azure, Python, bash, Claude, MCP, Duy\'a\', RAG, SQL/vector/noSQL, nuvpu\', QaQ\'eghmoH AI lo\'taHvIS."',
        'about-bio-1': 'SuvwI\' po\' DevOps je software engineering. laH potlh: <strong>AWS</strong>, <strong>Python</strong>, <strong>DevOps</strong>. Infrastructure as Code lo\'taH \u2013 Terraform + CDK, CI/CD SeHwI\'. Computer Science paQDI\'norgh Wroc\u0142aw DuSaQ\'a\' vo\'.',
        'about-bio-2': 'najHa\' vum 2018 vo\' (COVID qaSpa\'). Qatlh ghu\' lugh\'eghmoH. tlhoy\'qu\' team machDaq. poH SeH laH HoS.',
        'about-bio-3': '<strong>\ud83d\udd04 QaQ\'eghmoH mIw</strong><br>pat nIteb DuQ, QapmeH mIw lugh\'eghmoH. ghom law\' tlhej vum. mIw QaQ pab.',
        'about-bio-4': '<strong>\ud83d\udd27 laH SIQDI\' je boQ</strong><br>pIn qeS nob, Qatlh ghu\' lugh\'eghmoH. QaQ mIw chenmoH. ngoH chu\' DevmeH qaSmoH. chu\' Sov nej. QaQ mIw quvHa\'moHbe\'.',
        'about-bio-5': '\ud83d\udce9 DaH jIQum!',
        'about-status-1': 'DIS 10 boq tu\'lu\'',
        'about-status-2': 'najHa\' 2018 vo\'',

        'exp-status-1': 'quS 9',
        'exp-status-2': 'DIS 10 boq \'ej nIv',

        // Santander
        'exp-santander-title': 'Software Engineer la\' nIvbogh | MLOps & Agents ghojmoHwI\'',
        'exp-santander-type': 'mIw\'a\'',
        'exp-santander-loc': 'Poznań, tera\' Sep · najHa\'',
        'exp-santander-1': 'AI pat potlh chu\'eghmoH: wa\' pat tIn wIpeSpu\' – microservices chenmoH, ghajwI\' lugh, nIvqu\' Dunmo\'',
        'exp-santander-2': 'AI SDLC nuH nob – LLM QumwI\', ghItlh noD, Jira noD, toD chenmoH, mIllogh ghov',
        'exp-santander-3': 'pat voqHa\'moH: QapmeH nIvqu\', logging, observability, code review, ghItlh puS \'ach QaQ law\'',
        'exp-santander-4': 'MCP server law\' chenmoH, subagent nab je Python ngoH De\'wI\' QummeH',
        'exp-santander-5': 'SuvwI\' potlh: production Qagh junmoH, ghItlh ngeDmoH, Unix je pat lughmoH laH HoS',

        // Nordea
        'exp-nordea-title': 'MLOps Engineer la\' nIvbogh',
        'exp-nordea-type': 'mIw\'a\'',
        'exp-nordea-loc': 'Gdańsk, tera\' Sep · ngaS',
        'exp-nordea-1': 'MLOps, RAG, je AI pat boQ – ML mIw je AI/ML Sam nIvqu\'',
        'exp-nordea-2': 'infrastructure-as-code nIteb chenmoH – lugh, qa\'meH engmey',
        'exp-nordea-3': 'De\' mIw lugh chenmoH – nIteb, SeHlu\', may\'meH DareH',
        'exp-nordea-4': 'ghommeH nIteb chenmoH – AI/ML pat Sam, lugh, nIvqu\'',
        'exp-nordea-5': 'ghopDu\' vum choHHa\' je Qagh lunobHa\' – AWS je Terraform pat',

        // Charity
        'exp-charity-title': 'engwI\' pIn je WordPress pIn\'a\'',
        'exp-charity-type': 'tlhab vum · pung',
        'exp-charity-loc': 'Lubuskie, tera\' Sep · ngaS',
        'exp-charity-1': 'WordPress pat chenmoH je SeH – De\' pol, QapmeH pat EC2 je LAMP',

        // TUI
        'exp-tui-title': 'DevOps Engineer la\' nIvbogh | MLOps & Backend',
        'exp-tui-type': 'tlhab vum',
        'exp-tui-loc': 'yur\'op · najHa\'',
        'exp-tui-highlight': '🦆 Machine Learning Lab chenmoHwI\' – TUI Principal ML Engineer qaSmoHta\' 🦆',
        'exp-tui-section-1': 'ML ngoH je mIw',
        'exp-tui-section-2': 'qach nuH je engmey',
        'exp-tui-section-3': 'Hut ghom tlhej vum je API nab',
        'exp-tui-1': 'ML mIw chenmoH je SeH (StepFunctions, Sagemaker, Glue, ECS)',
        'exp-tui-2': 'ghom AI pat lo\' (Sagemaker) ngoH nab – API mIw chel',
        'exp-tui-3': 'MLflow server lughmoH – Hung lughmoH + automated upgrade',
        'exp-tui-4': 'De\' tlhap nIvqu\'moH – AWS Data Pipeline je Glue',
        'exp-tui-5': 'TUI AI boQ wa\'DIch je RAG mIw boQ',
        'exp-tui-6': 'qach nuH ngoH chenmoH (bash, boto3, threading, docker)',
        'exp-tui-7': 'endpoint Sam – jaj Hoch tlhoy\' nob',
        'exp-tui-8': 'law\' yoS Sam nab (Terraform, CDK, CloudFormation)',
        'exp-tui-9': 'CI/CD mIw chenmoH je SeH (GitLab)',
        'exp-tui-10': 'ghItlh QaQ mIw chel – mIw law\'Daq (black, pylint, sonarqube, toD)',
        'exp-tui-11': 'Sonarqube, Datadog HaSta, AWS Security Hub rar',
        'exp-tui-12': 'Hut ghom tlhej vum (FastAPI, Lambda, ECR, SQS, SNS, Sagemaker)',
        'exp-tui-13': 'API nIteb je HoS lughmoH',

        // 3e9
        'exp-3e9-title': 'najHa\' Software Engineer',
        'exp-3e9-type': 'tlhab vum',
        'exp-3e9-loc': 'yur\'op · najHa\'',
        'exp-3e9-1': 'Python GUI – IoT pat Sam (websockets, PyQt5, AWS Lambda, Greengrass)',
        'exp-3e9-2': 'Backend Qum pat – poH tugh (MS je Google QIn API)',
        'exp-3e9-3': 'Odoo ERP/CRM laH – Take&Go Duyya\' nIteb',
        'exp-3e9-4': 'Docker FastAPI ngoH nab – microservices',
        'exp-3e9-5': 'async microservices – Huch nob pat (idempotency)',
        'exp-3e9-6': 'bare-metal vo\' AWS choH (ECS + Lambda Python)',
        'exp-3e9-7': 'engmey nab je ghItlh – cloud choHmeH',

        // Kodilla
        'exp-kodilla-title': 'Python ghojmoHwI\'',
        'exp-kodilla-type': 'mIw\'a\'',
        'exp-kodilla-loc': 'Wrocław, tera\' Sep',
        'exp-kodilla-1': 'Backend, De\' tIn, Data Science, Machine Learning, toD nIteb',

        // Xebia
        'exp-xebia-title': 'Software Engineer',
        'exp-xebia-type': 'Hoch poH',
        'exp-xebia-loc': 'Wrocław, tera\' Sep',
        'exp-xebia-1': 'qorDu\' engmey AWS choH – Terraform, Puppet, Packer',
        'exp-xebia-2': 'CI/CD pat nab – AWS microservices',
        'exp-xebia-3': 'Python3 ghItlh chenmoH je noD – AWS Lambda',
        'exp-xebia-4': 'AWS ghojmoH vum – chaw\' DareHmeH',

        // Clearcode
        'exp-clearcode-title': 'Software Engineer',
        'exp-clearcode-type': 'poH bID',
        'exp-clearcode-loc': 'Wrocław, tera\' Sep',
        'exp-clearcode-1': 'DMP je exchange (AdTech) pat nab – AWS',
        'exp-clearcode-2': 'Hamburg-Wrocław ghom wa\'maH, engmey/Dev',
        'exp-clearcode-3': 'ngoH: <20ms @ 30k rps AWS pat nab',

        // Nokia
        'exp-nokia-title': 'ghojwI\' vum → bIQ\'a\' ghojwI\'',
        'exp-nokia-type': 'poH bID',
        'exp-nokia-loc': 'Wrocław, tera\' Sep',
        'exp-nokia-1': 'Telco De\' noD – Jupyter, bokeh, pandas',
        'exp-nokia-2': 'machine learning ghom (numpy, sklearn)',
        'exp-nokia-3': 'CI je Docker – ghItlh QaQ (Jenkins, GitLab CI)',
        'exp-nokia-4': 'Python 2→3 choH, toD unit je functional',

        'skills-status-1': 'laH 40+',
        'skills-status-2': 'LinkedIn Qap 4 potlh',
        'cat-cloud': 'engmey QulDu\' je',
        'cat-lang': 'Hol je Framework',
        'cat-devops': 'DevOps je lI\'wI\'',
        'cat-data': 'De\' je ghot yejHa\'',
        'cat-testing': 'noD je QaQ',
        'cat-languages': 'Holmey',
        'skill-certified': '\u2713 chaw\'lu\'',
        'skill-assessed': '\u2713 noHlu\'',
        'skill-native': 'boghDI\' Hol',
        'skill-professional': 'po\' vum',
        'skill-endorsements': 'naD',
        'cat-langfw': 'Hol je Framework',
        'cat-ai': 'AI, De\' je ghot',

        'proj-workshops': 'ghojmoH \'ej maqwI\' @ TUI',
        'proj-status-1': 'ngoH 15 nab tu\'lu\'',
        'proj-status-2': '148 \u2605 Hov\'egh ngoH',
        'proj-pylint-desc': 'pylint QIn pong lugh laHwI\' je Dev ghItlh',
        'proj-faceunlock-desc': 'ngoH mach qab DungDaq!',
        'proj-hejtolosowanie-desc': 'Hejto wuq lI\'wI\'',
        'proj-multidiary-desc': 'reddit chu\'',
        'proj-apteka-desc': 'Hergh ngoH',
        'proj-rns-desc': 'x86 ngoH\'egh RNS ta\'meH',
        'proj-mlops-name': 'MLOps ghojmoH',
        'proj-mlops-desc': 'TUI ML Lab Hackathon \u2013 nuvpu\' che\'meH je MLOps mIw naQ. ghojmoHwI\' je DevwI\'.',
        'proj-bedrock-name': 'Bedrock Agents maqwI\'',
        'proj-bedrock-desc': 'Amazon Bedrock AI Duy chenmoH. lughmoH je QaH.',
        'proj-sd-name': 'Stable Diffusion ghojmoH',
        'proj-sd-desc': 'Stable Diffusion Sam \u2013 mu\' vo\' mIllogh chenmoH. ghojmoHwI\' je DevwI\'.',

        'edu-certs': 'ta\' chaw\'',
        'edu-status-1': 'ta\'wIj + be\'nI\' Hovtay\'',
        'edu-university': 'Wroclaw DuSaQ\'a\' Sov je laH',
        'edu-masters': 'ta\'wIj, De\'wI\' Sov',
        'edu-bachelors': 'be\'nI\' Hovtay\', De\'wI\' Sov',
        'edu-aws-cert': 'AWS chaw\' Solutions Architect',
        'edu-aws-date': 'noblu\' tera\' jar wa\' 2019',

        'rec-status-1': 'naD 11 LinkedIn Daq',
        'rec-status-2': 'Hoch pIn\'a\' toblu\'pu\'',

        'contact-remote': 'najHa\' 2018 vo\' \u2013 qo\' Hoch Daq SuqlaH',
        'contact-status': 'QapmeH jIHvaD yIngu\'',

        'ctx-wallpaper': '\ud83d\uddbc\ufe0f rItlh choH',
        'ctx-about-os': '\u2139\ufe0f pat De\'',

        'wp-title': 'HaSta\'egh \u2013 rItlh',
        'wp-apply': 'lo\'',
        'wp-cancel': 'qIl',

        'theme-switch': 'pat choH:',

        'loading-text': 'taHtaH Windows XP... Qapla\'!',

        'term-welcome-1': 'Jan Jurec yo\'SeH pat [mIw 2.1.37]',
        'term-welcome-2': '(C) 2024 Jan Jurec. Hoch chaw\' rarlu\'.',
        'term-welcome-3': '"help" yIghItlh. QaH DaSuqmeH.',

        // Browser no-net texts
        'browser-nonet-ie-title': 'HaSta leghlaHbe\'',
        'browser-nonet-ie-desc': 'QumwI\' yI\'ol',
        'browser-nonet-safari-title': 'QumwI\' tu\'lu\'be\'',
        'browser-nonet-safari-desc': 'HaSta leghlaHbe\' - QumwI\' Qapbe\'.',
        'browser-nonet-tor-title': 'QUM TU\'LU\'BE\'',
        'browser-nonet-tor-desc': 'Tor QumwI\' rarlaHbe\'',
        'browser-nonet-hint': 'SPACE yIchel - Quj DatIv',

        // Browser loading
        'browser-loading-text': 'HaSta loDlu\'taH...',

        // Hypnotoad
        'hypnotoad-glory': 'HYPNOTOAD BATLH HoCH',

        // Nosacz game
        'game-over': 'QUJ VANPU\'',
        'game-score': 'mI\'',
        'game-highscore': 'mI\' QaQ',
        'game-restart': 'SPACE yIchel - Quj chu\'',
        'game-dk-unlock': 'QoQ muchHom Daq Master of Onions poSmoHlu\'!',

        // Saw/Jigsaw game
        'saw-intro': 'Quj vIQuj neH...',
        'saw-intro-2': 'vim DavoqHa\'pu\'. DaH bItobnIS.',
        'saw-intro-3': 'yujmeywIj yIjang... pagh Hoch DacheghmoH.',
        'saw-rules': 'chutmey: cha\'maH wej lup yIjang. muj = yIn DachIl. yIn pagh = Quj vanpu\'.',
        'saw-question': 'yu\'',
        'saw-time-up': 'QIt VANPU\'!',
        'saw-wrong': 'muj! jang qaq ghaH',
        'saw-correct': 'lugh.',
        'saw-taunt-1': 'nIteb... \'ach yImev.',
        'saw-taunt-2': 'majQa\'. \'ach veb Qatlh law\'.',
        'saw-taunt-3': 'bIyIn... DaH.',
        'saw-taunt-4': 'Do\' neH. ghap qar\'a\'?',
        'saw-taunt-5': 'naQjejHomwIj belHa\'.',
        'saw-taunt-6': 'lugh. \'ach juppu\'lI\' poH vanlu\'...',
        'saw-defeat': 'BIGHOBTA\'.',
        'saw-defeat-2': 'De\'lI\' Hoch... lojmIt. nagh\'e\' Hoch... Soplu\'.',
        'saw-defeat-sub': 'DuHIvqa\'... bIDareHchugh.',
        'saw-victory': 'bIyInqa\'... Hoch wa\'vatlh vaghmaH. nIteb.',
        'saw-victory-2': '\'ach qaw... vim reH bIleghlu\'.',
        'saw-type-anything': 'vay\' yIghItlh...',

        // Paint window
        'paint-file-save': 'teywI\': pol',
        'paint-file-download': 'teywI\': Suq',
        'paint-edit-undo': 'choH: DoghQo\'',
        'paint-edit-clear': 'choH: Qaw\'',
        'paint-tool-pencil': 'ghItlhwI\'',
        'paint-tool-brush': 'rItlhwI\'',
        'paint-tool-eraser': 'Qaw\'wI\'',
        'paint-tool-fill': 'tebwI\'',
        'paint-tool-spray': 'tlhIchwI\'',
        'paint-tool-stamp': 'QumwI\'',
        'paint-status-ready': 'DareH',
    }
};

let currentLang = localStorage.getItem('jan-portfolio-lang') || 'en';

function t(key) {
    return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key])
        || (TRANSLATIONS.en[key])
        || key;
}
