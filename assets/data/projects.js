// assets/data/projects.js
// Lijst van presentaties voor de sessies

const projects = [
    {
        group: 1,
        active: true,
        time: { start: "15:00", end: "15:20" },
        title: "Onder Druk",
        members: [
            "Jan Skrzynski",
            "Maarten Coppens",
            "Tristan De Ridder"
        ],
        notes: "Arda Segers gestopt",
        // images: [
        //     "assets/images/onder-druk-1.jpg",
        //     "assets/images/onder-druk-2.jpg"
        // ]
    },
    {
        group: 2,
        active: true,
        time: { start: "15:20", end: "15:40" },
        title: "Camouflagekaart",
        members: [
            "Bavo De Bondt",
            "Jarno Pennoit",
            "Justin Descan",
            "Mathijs De Langhe"
        ],
        images: [
            "assets/images/camouflagekaart.jpg"
        ]
    },
    {
        group: 3,
        active: true,
        time: { start: "15:40", end: "16:00" },
        title: "De Steenschat",
        members: [
            "Darwin De Mits",
            "Lies De Praeter",
            "Lukas Van Nuffel"
        ],
        // images: [
        //     "assets/images/de-steenschat-1.jpg",
        //     "assets/images/de-steenschat-2.jpg"
        // ]
    },
    {
        group: 4,
        active: true,
        time: { start: "16:00", end: "16:20" },
        title: "Beestige Tijdsreizigers",
        members: [
            "Mees Akveld",
            "Emie Van de Veire",
            "Joran Vreye",
            "Simon Van Tomme"
        ],
        images: [
            "assets/images/beestige-tijdsreizigers.jpg"
        ]
    },
    {
        group: 5,
        active: true,
        time: { start: "16:20", end: "16:40" },
        title: "Wingspan",
        members: [
            "Bram Criel",
            "Louis Dierickx",
            "Reinhart Schepens"
        ],
        images: [
            "assets/images/wingspan.jpg",
            // "assets/images/wingspan-2.jpg"
        ]
    },
    {
        group: 6,
        active: false,
        time: { start: "16:40", end: "17:00" },
        title: "Dino Safari",
        members: [
            "Teynur Yuseinov"
        ],
        notes: "Teynur neemt vermoedelijk niet meer deel voor deze examenkans",
        images: [
            "assets/images/dino-safari-1.jpg"
        ]
    }
];

export default projects;