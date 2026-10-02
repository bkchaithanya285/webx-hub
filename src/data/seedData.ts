import { ProblemStatement, Team, Reviewer, Volunteer, AppSettings, SelectionSettings, ReviewSettings } from '../types';

export const initialAppSettings: AppSettings = {
  eventName: "WEBX — Into the Web of Innovation",
  tagline: "The Control Center of WEBX",
  venue: "8th Block Seminar Hall",
  date: "3–4 October 2026",
  credits: "2 EE Credits",
  prizePool: "₹15,000",
  prizes: {
    first: "₹6,000",
    second: "₹5,000",
    third: "₹4,000"
  },
  landingPageEnabled: true,
  defaultMaxTeamsPerPS: 2
};

export const initialSelectionSettings: SelectionSettings = {
  releaseState: 'NOT_RELEASED',
  selectionState: 'CLOSED',
  status: 'NOT_RELEASED',
  releaseAt: undefined,
  lockStartedAt: null,
  lockUntil: null,
  unlockAt: null,
  closeAt: null,
  updatedAt: new Date().toISOString(),
  updatedBy: "System"
};

export const initialReviewSettings: ReviewSettings = {
  activeRound: 1,
  round1Status: 'OPEN',
  round2Status: 'CLOSED',
  round3Status: 'CLOSED',
  updatedAt: new Date().toISOString(),
  updatedBy: "System"
};

export const initialVolunteers: Volunteer[] = [];

export const initialAdmins = [
  {
    uid: "admin-1",
    email: "bkrishnachaitanya285@gmail.com",
    displayName: "Krishna Chaitanya",
    role: "admin" as const,
    active: true,
    createdAt: "2026-09-01T00:00:00Z",
    lastLoginAt: new Date().toISOString()
  },
  {
    uid: "admin-2",
    email: "taruntej161413@gmail.com",
    displayName: "Tarun Tej",
    role: "admin" as const,
    active: true,
    createdAt: "2026-09-01T00:00:00Z",
    lastLoginAt: new Date().toISOString()
  }
];

export const initialReviewers: Reviewer[] = [];

// 30 Detailed Problem Statements
import problemStatementsData from './problemStatements.json';
export const initialProblemStatements: ProblemStatement[] = problemStatementsData as unknown as ProblemStatement[];

// 60 Official Teams Seeded from WEBX Participants Roster
export const initialTeams: Team[] = [
  {
    "teamId": "WEB-001",
    "teamName": "TEAM TARGARYENS",
    "teamLeadMemberId": "MEM-001-1",
    "teamLeadRegNo": "9924005189",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-001-9924005189-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-001-1",
        "teamId": "WEB-001",
        "name": "MANGALA JAYA KRISHNA",
        "registrationNumber": "9924005189",
        "email": "9924005189@klu.ac.in",
        "phone": "9392811889",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-001-2",
        "teamId": "WEB-001",
        "name": "GOLLA ABHILASH",
        "registrationNumber": "99240040794",
        "email": "99240040794@klu.ac.in",
        "phone": "6301226266",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-001-3",
        "teamId": "WEB-001",
        "name": "ERRABHUMI PRAKASH REDDY",
        "registrationNumber": "99240040799",
        "email": "99240040799@klu.ac.in",
        "phone": "8121701506",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-001-4",
        "teamId": "WEB-001",
        "name": "J KRUSHIKA",
        "registrationNumber": "99240040792",
        "email": "99240040792@klu.ac.in",
        "phone": "8897337082",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-002",
    "teamName": "GUARDIAN MINDS",
    "teamLeadMemberId": "MEM-002-1",
    "teamLeadRegNo": "99240040717",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-002-99240040717-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-002-1",
        "teamId": "WEB-002",
        "name": "PUTLURU PRASHANTHI",
        "registrationNumber": "99240040717",
        "email": "99240040717@klu.ac.in",
        "phone": "8688543982",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-002-2",
        "teamId": "WEB-002",
        "name": "MODUPALLI SATHWIKA",
        "registrationNumber": "99240040651",
        "email": "99240040651@klu.ac.in",
        "phone": "8978433968",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-002-3",
        "teamId": "WEB-002",
        "name": "ANUGU SUDHIKSHA",
        "registrationNumber": "99240040192",
        "email": "99240040192@klu.ac.in",
        "phone": "7801075785",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-002-4",
        "teamId": "WEB-002",
        "name": "RACHAPALLI REDDY RIKITHA",
        "registrationNumber": "99240040147",
        "email": "99240040147@klu.ac.in",
        "phone": "7989819910",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-003",
    "teamName": "SWAMY SHARANAM",
    "teamLeadMemberId": "MEM-003-1",
    "teamLeadRegNo": "99240040852",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-003-99240040852-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-003-1",
        "teamId": "WEB-003",
        "name": "BATAKALA MANIKANTA",
        "registrationNumber": "99240040852",
        "email": "99240040852@klu.ac.in",
        "phone": "9063583984",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-003-2",
        "teamId": "WEB-003",
        "name": "DOKKARI AKSHAY KUMAR YADAV",
        "registrationNumber": "99240040903",
        "email": "99240040903@klu.ac.in",
        "phone": "7032105900",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-003-3",
        "teamId": "WEB-003",
        "name": "CHAPALA VAMSI",
        "registrationNumber": "9924005035",
        "email": "9924005035@klu.ac.in",
        "phone": "8519848564",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-003-4",
        "teamId": "WEB-003",
        "name": "MOLAKALA HIMAGIRI",
        "registrationNumber": "99240041245",
        "email": "99240041245@klu.ac.in",
        "phone": "6309354272",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-004",
    "teamName": "TEAM SHAKTHI",
    "teamLeadMemberId": "MEM-004-1",
    "teamLeadRegNo": "99240040181",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-004-99240040181-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-004-1",
        "teamId": "WEB-004",
        "name": "VEMUGODU MALLIKARJUNA REDDY",
        "registrationNumber": "99240040181",
        "email": "99240040181@klu.ac.in",
        "phone": "9603484372",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-004-2",
        "teamId": "WEB-004",
        "name": "DEGA RAKESH",
        "registrationNumber": "99240040777",
        "email": "99240040777@klu.ac.in",
        "phone": "8374248157",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-004-3",
        "teamId": "WEB-004",
        "name": "DASARI ADITHYA PARANDHAM",
        "registrationNumber": "99240040776",
        "email": "99240040776@klu.ac.in",
        "phone": "9505982347",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-004-4",
        "teamId": "WEB-004",
        "name": "DADIREDDYGARI VARSHITHA",
        "registrationNumber": "99240040687",
        "email": "99240040687@klu.ac.in",
        "phone": "9346446802",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-005",
    "teamName": "GENZNEX",
    "teamLeadMemberId": "MEM-005-1",
    "teamLeadRegNo": "99240040864",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-005-99240040864-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-005-1",
        "teamId": "WEB-005",
        "name": "CHIMAKURTHY VISHNU VARDHAN",
        "registrationNumber": "99240040864",
        "email": "99240040864@klu.ac.in",
        "phone": "7416959710",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-005-2",
        "teamId": "WEB-005",
        "name": "CHALASANI SAIVIKAS",
        "registrationNumber": "99240040865",
        "email": "99240040865@klu.ac.in",
        "phone": "9502175034",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-005-3",
        "teamId": "WEB-005",
        "name": "SRIGHAKOLLAPU PHANINDRA V.V.NAGA BHAGAVAN",
        "registrationNumber": "99240040856",
        "email": "99240040856@klu.ac.in",
        "phone": "9542542572",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-005-4",
        "teamId": "WEB-005",
        "name": "CHAGAMREDDY MAHESH",
        "registrationNumber": "99240040871",
        "email": "99240040871@klu.ac.in",
        "phone": "9912105415",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-006",
    "teamName": "TEAM NARUTO",
    "teamLeadMemberId": "MEM-006-1",
    "teamLeadRegNo": "99240040828",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-006-99240040828-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-006-1",
        "teamId": "WEB-006",
        "name": "POLUBOYINA ARYA VARDHAN",
        "registrationNumber": "99240040828",
        "email": "99240040828@klu.ac.in",
        "phone": "8341835934",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-006-2",
        "teamId": "WEB-006",
        "name": "NALLAGGARI BHAVYA SREE",
        "registrationNumber": "9924005120",
        "email": "9924005120@klu.ac.in",
        "phone": "9391150187",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-006-3",
        "teamId": "WEB-006",
        "name": "VIJJANA CHARAN SRI SATYA SAI",
        "registrationNumber": "9924005368",
        "email": "9924005368@klu.ac.in",
        "phone": "9866778550",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-006-4",
        "teamId": "WEB-006",
        "name": "GAVINI MURALI KRISHNA",
        "registrationNumber": "9924005140",
        "email": "9924005140@klu.ac.in",
        "phone": "8688178799",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-007",
    "teamName": "ATLAS",
    "teamLeadMemberId": "MEM-007-1",
    "teamLeadRegNo": "99230041026",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-007-99230041026-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-007-1",
        "teamId": "WEB-007",
        "name": "MANCHIKANTI VENKATA KESAR SUNEEL KUMAR",
        "registrationNumber": "99230041026",
        "email": "99230041026@klu.ac.in",
        "phone": "7680802189",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-007-2",
        "teamId": "WEB-007",
        "name": "D SRI VYSHNAV REDDY",
        "registrationNumber": "99240040881",
        "email": "99240040881@klu.ac.in",
        "phone": "9381413733",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-007-3",
        "teamId": "WEB-007",
        "name": "PEDDAKOTLA BHUMIKA",
        "registrationNumber": "99230041037",
        "email": "99230041037@klu.ac.in",
        "phone": "9849017926",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-007-4",
        "teamId": "WEB-007",
        "name": "BOLLA RAJYALAKSHMI",
        "registrationNumber": "99230041031",
        "email": "99230041031@klu.ac.in",
        "phone": "8106493754",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-008",
    "teamName": "ALIGNS",
    "teamLeadMemberId": "MEM-008-1",
    "teamLeadRegNo": "9923005172",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-008-9923005172-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-008-1",
        "teamId": "WEB-008",
        "name": "MAMIDI UTTEJ NAGA VENKAT",
        "registrationNumber": "9923005172",
        "email": "9923005172@klu.ac.in",
        "phone": "9502694990",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-008-2",
        "teamId": "WEB-008",
        "name": "ALAMURU SREEVALLI",
        "registrationNumber": "99230041069",
        "email": "99230041069@klu.ac.in",
        "phone": "6302098936",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-008-3",
        "teamId": "WEB-008",
        "name": "CHINNAKOTLA HIMAJA",
        "registrationNumber": "9923005070",
        "email": "9923005070@klu.ac.in",
        "phone": "7780484509",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-008-4",
        "teamId": "WEB-008",
        "name": "YERUKUKA GANGADHRI GARI MADHAVI",
        "registrationNumber": "9923005052",
        "email": "9923005052@klu.ac.in",
        "phone": "9989739438",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-009",
    "teamName": "TEAM GOLD FISH",
    "teamLeadMemberId": "MEM-009-1",
    "teamLeadRegNo": "99240040837",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-009-99240040837-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-009-1",
        "teamId": "WEB-009",
        "name": "SIRIGIRI JASWANTH",
        "registrationNumber": "99240040837",
        "email": "99240040837@klu.ac.in",
        "phone": "9014525750",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-009-2",
        "teamId": "WEB-009",
        "name": "AMARA SATYA GAYATRI KUMARI",
        "registrationNumber": "99240041321",
        "email": "99240041321@klu.ac.in",
        "phone": "8121205343",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-009-3",
        "teamId": "WEB-009",
        "name": "BHUKYA VIKAS NAIK",
        "registrationNumber": "99240040847",
        "email": "99240040847@klu.ac.in",
        "phone": "8328184374",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-009-4",
        "teamId": "WEB-009",
        "name": "BANKA VENKATA SAI ESWAR",
        "registrationNumber": "99240040836",
        "email": "99240040836@klu.ac.in",
        "phone": "7396784629",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-010",
    "teamName": "TEAM POLA",
    "teamLeadMemberId": "MEM-010-1",
    "teamLeadRegNo": "99240040939",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-010-99240040939-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-010-1",
        "teamId": "WEB-010",
        "name": "INNAMURI YADUNANDAN GUPTA",
        "registrationNumber": "99240040939",
        "email": "99240040939@klu.ac.in",
        "phone": "9704256540",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-010-2",
        "teamId": "WEB-010",
        "name": "VEMURI BHUVANRAJ",
        "registrationNumber": "99240040333",
        "email": "99240040333@klu.ac.in",
        "phone": "6301067756",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-010-3",
        "teamId": "WEB-010",
        "name": "POLA ESHWAR",
        "registrationNumber": "999240040198",
        "email": "999240040198@klu.ac.in",
        "phone": "7842509697",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-010-4",
        "teamId": "WEB-010",
        "name": "KUDUMULA GOPIGARI SIREESHA",
        "registrationNumber": "99240040597",
        "email": "99240040597@klu.ac.in",
        "phone": "7416169154",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-011",
    "teamName": "CODECRAZE",
    "teamLeadMemberId": "MEM-011-1",
    "teamLeadRegNo": "9923005180",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-011-9923005180-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-011-1",
        "teamId": "WEB-011",
        "name": "KANIPAKAM SHANMUGA",
        "registrationNumber": "9923005180",
        "email": "9923005180@klu.ac.in",
        "phone": "9392689981",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-011-2",
        "teamId": "WEB-011",
        "name": "BULLE ABHINAY",
        "registrationNumber": "9923005009",
        "email": "9923005009@klu.ac.in",
        "phone": "9063913158",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-011-3",
        "teamId": "WEB-011",
        "name": "BOYA BRAMHA SAI",
        "registrationNumber": "9923005178",
        "email": "9923005178@klu.ac.in",
        "phone": "6281203016",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-011-4",
        "teamId": "WEB-011",
        "name": "KURUMALA JYOTHI",
        "registrationNumber": "9924008097",
        "email": "9924008097@klu.ac.in",
        "phone": "9347446912",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-012",
    "teamName": "TECH TITANS",
    "teamLeadMemberId": "MEM-012-1",
    "teamLeadRegNo": "9924005383",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-012-9924005383-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-012-1",
        "teamId": "WEB-012",
        "name": "MADDIBOYINA KIRAN BABU",
        "registrationNumber": "9924005383",
        "email": "9924005383@klu.ac.in",
        "phone": "9392498117",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-012-2",
        "teamId": "WEB-012",
        "name": "Y SUMANTH REDDY",
        "registrationNumber": "9924005001",
        "email": "9924005001@klu.ac.in",
        "phone": "7995825087",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-012-3",
        "teamId": "WEB-012",
        "name": "Y SURYA KUMARI",
        "registrationNumber": "9924005457",
        "email": "9924005457@klu.ac.in",
        "phone": "9494094310",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-012-4",
        "teamId": "WEB-012",
        "name": "B SUMANTH",
        "registrationNumber": "9924005220",
        "email": "9924005220@klu.ac.in",
        "phone": "9032690614",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-013",
    "teamName": "WINTER SOLDIER",
    "teamLeadMemberId": "MEM-013-1",
    "teamLeadRegNo": "99240040191",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-013-99240040191-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-013-1",
        "teamId": "WEB-013",
        "name": "ARIVENI VENKAT",
        "registrationNumber": "99240040191",
        "email": "99240040191@klu.ac.in",
        "phone": "8919936822",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-013-2",
        "teamId": "WEB-013",
        "name": "SINGIRESU CHANDRIKA",
        "registrationNumber": "9924005196",
        "email": "9924005196@klu.ac.in",
        "phone": "9346145593",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-013-3",
        "teamId": "WEB-013",
        "name": "SIDHARAPU LOHITHA",
        "registrationNumber": "99240040819",
        "email": "99240040819@klu.ac.in",
        "phone": "7995126018",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-013-4",
        "teamId": "WEB-013",
        "name": "MALLIREDDY ABHISHEKREDDY",
        "registrationNumber": "9924008035",
        "email": "9924008035@klu.ac.in",
        "phone": "7337467951",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-014",
    "teamName": "ALPHA SPIDER",
    "teamLeadMemberId": "MEM-014-1",
    "teamLeadRegNo": "99230040737",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-014-99230040737-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-014-1",
        "teamId": "WEB-014",
        "name": "PULI HEMANTH KUMAR REDDY",
        "registrationNumber": "99230040737",
        "email": "99230040737@klu.ac.in",
        "phone": "9392632003",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-014-2",
        "teamId": "WEB-014",
        "name": "POLAKALA MADHURIMA",
        "registrationNumber": "99230040731",
        "email": "99230040731@klu.ac.in",
        "phone": "7396488696",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-014-3",
        "teamId": "WEB-014",
        "name": "MEDURI BHARGAV RAKESH",
        "registrationNumber": "99230040667",
        "email": "99230040667@klu.ac.in",
        "phone": "9666295876",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-014-4",
        "teamId": "WEB-014",
        "name": "REMATA SOMANATHA REDDY",
        "registrationNumber": "99230041058",
        "email": "99230041058@klu.ac.in",
        "phone": "6305147805",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-015",
    "teamName": "TEAM ALPHA",
    "teamLeadMemberId": "MEM-015-1",
    "teamLeadRegNo": "99240040117",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-015-99240040117-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-015-1",
        "teamId": "WEB-015",
        "name": "NANDYALA HARSHA VARDHAN",
        "registrationNumber": "99240040117",
        "email": "99240040117@klu.ac.in",
        "phone": "9063618945",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-015-2",
        "teamId": "WEB-015",
        "name": "GARA RITHIK SAI",
        "registrationNumber": "99240040914",
        "email": "99240040914@klu.ac.in",
        "phone": "7569534932",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-015-3",
        "teamId": "WEB-015",
        "name": "GATTUPALLI GURU CHARAN",
        "registrationNumber": "99240040916",
        "email": "99240040916@klu.ac.in",
        "phone": "8074946034",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-015-4",
        "teamId": "WEB-015",
        "name": "KAVADAPU MADHAVA",
        "registrationNumber": "99240041216",
        "email": "99240041216@klu.ac.in",
        "phone": "8074999510",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-016",
    "teamName": "NEXA",
    "teamLeadMemberId": "MEM-016-1",
    "teamLeadRegNo": "99240040812",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-016-99240040812-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-016-1",
        "teamId": "WEB-016",
        "name": "SINGAM SETTY GREESHMA ROYAL",
        "registrationNumber": "99240040812",
        "email": "99240040812@klu.ac.in",
        "phone": "7671810135",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-016-2",
        "teamId": "WEB-016",
        "name": "GUDA KAVYA REDDY",
        "registrationNumber": "99240040128",
        "email": "99240040128@klu.ac.in",
        "phone": "9014471930",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-016-3",
        "teamId": "WEB-016",
        "name": "GARLANKA HEMALATHA",
        "registrationNumber": "99240040822",
        "email": "99240040822@klu.ac.in",
        "phone": "7702948629",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-016-4",
        "teamId": "WEB-016",
        "name": "CHALLA NAVYASREE",
        "registrationNumber": "99240040866",
        "email": "99240040866@klu.ac.in",
        "phone": "9502752246",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-017",
    "teamName": "TEAM CODE CRAFTERS",
    "teamLeadMemberId": "MEM-017-1",
    "teamLeadRegNo": "9923005170",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-017-9923005170-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-017-1",
        "teamId": "WEB-017",
        "name": "GOLLA OBULA NARASIMHA",
        "registrationNumber": "9923005170",
        "email": "9923005170@klu.ac.in",
        "phone": "8790082505",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-017-2",
        "teamId": "WEB-017",
        "name": "PULETIPALLI DASTAGIRI",
        "registrationNumber": "9923005173",
        "email": "9923005173@klu.ac.in",
        "phone": "7671067573",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-017-3",
        "teamId": "WEB-017",
        "name": "P RAGHUPATHI REDDY",
        "registrationNumber": "9923005159",
        "email": "9923005159@klu.ac.in",
        "phone": "6305117959",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-017-4",
        "teamId": "WEB-017",
        "name": "R.BALA GANGI REDDY",
        "registrationNumber": "9923005125",
        "email": "9923005125@klu.ac.in",
        "phone": "9390632083",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-018",
    "teamName": "TEAM FALCONS",
    "teamLeadMemberId": "MEM-018-1",
    "teamLeadRegNo": "99240040886",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-018-99240040886-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-018-1",
        "teamId": "WEB-018",
        "name": "DONKINA DURGA NAGA VENKATA PHANI KUMAR",
        "registrationNumber": "99240040886",
        "email": "99240040886@klu.ac.in",
        "phone": "9908355686",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-018-2",
        "teamId": "WEB-018",
        "name": "CHUNDRU KARTHIK",
        "registrationNumber": "99240041085",
        "email": "99240041085@klu.ac.in",
        "phone": "8074324598",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-018-3",
        "teamId": "WEB-018",
        "name": "VENNAPUSA VIVEKANANDA REDDY",
        "registrationNumber": "9825005005",
        "email": "9825005005@klu.ac.in",
        "phone": "8309587546",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-018-4",
        "teamId": "WEB-018",
        "name": "K SUPRIYA",
        "registrationNumber": "99240041325",
        "email": "99240041325@klu.ac.in",
        "phone": "9059281919",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-019",
    "teamName": "SPARK",
    "teamLeadMemberId": "MEM-019-1",
    "teamLeadRegNo": "99240040894",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-019-99240040894-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-019-1",
        "teamId": "WEB-019",
        "name": "DODDAVULA DINESH REDDY",
        "registrationNumber": "99240040894",
        "email": "99240040894@klu.ac.in",
        "phone": "7093939575",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-019-2",
        "teamId": "WEB-019",
        "name": "GUDDITI MANIKANTA",
        "registrationNumber": "99240040492",
        "email": "99240040492@klu.ac.in",
        "phone": "9441227695",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-019-3",
        "teamId": "WEB-019",
        "name": "GUNTIMADUGU DHARANI VARMA",
        "registrationNumber": "99240040495",
        "email": "99240040495@klu.ac.in",
        "phone": "6281230634",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-019-4",
        "teamId": "WEB-019",
        "name": "GUDURU SATHWIK GOWD",
        "registrationNumber": "99240040055",
        "email": "99240040055@klu.ac.in",
        "phone": "9121629415",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-020",
    "teamName": "CODENEXUS",
    "teamLeadMemberId": "MEM-020-1",
    "teamLeadRegNo": "9924005204",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-020-9924005204-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-020-1",
        "teamId": "WEB-020",
        "name": "POTHURI PREETHIKA",
        "registrationNumber": "9924005204",
        "email": "9924005204@klu.ac.in",
        "phone": "9652891870",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-020-2",
        "teamId": "WEB-020",
        "name": "NARABOYINA MOUNIKA",
        "registrationNumber": "99240040666",
        "email": "99240040666@klu.ac.in",
        "phone": "8125143935",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-020-3",
        "teamId": "WEB-020",
        "name": "NAMA CHINMAY RAGHU TEJA",
        "registrationNumber": "99240040658",
        "email": "99240040658@klu.ac.in",
        "phone": "7989561881",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-020-4",
        "teamId": "WEB-020",
        "name": "NAPA GOWTHAM KUMAR",
        "registrationNumber": "99240040663",
        "email": "99240040663@klu.ac.in",
        "phone": "8520922285",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-021",
    "teamName": "SOLUTION SQUAD",
    "teamLeadMemberId": "MEM-021-1",
    "teamLeadRegNo": "99240040681",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-021-99240040681-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-021-1",
        "teamId": "WEB-021",
        "name": "PANUGANTI V S M RISHI KARTHIKEYA",
        "registrationNumber": "99240040681",
        "email": "99240040681@klu.ac.in",
        "phone": "7386401544",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-021-2",
        "teamId": "WEB-021",
        "name": "KOTHA BHAVANA",
        "registrationNumber": "99240040575",
        "email": "99240040575@klu.ac.in",
        "phone": "7995802086",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-021-3",
        "teamId": "WEB-021",
        "name": "PATIBANDLA MOKSHAGNA",
        "registrationNumber": "99240040691",
        "email": "99240040691@klu.ac.in",
        "phone": "8500450915",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-021-4",
        "teamId": "WEB-021",
        "name": "MULLAGURI MANI KUMAR",
        "registrationNumber": "99240040649",
        "email": "99240040649@klu.ac.in",
        "phone": "9390311406",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-022",
    "teamName": "DOOMSDAY",
    "teamLeadMemberId": "MEM-022-1",
    "teamLeadRegNo": "99240041412",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-022-99240041412-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-022-1",
        "teamId": "WEB-022",
        "name": "JUVVIGUNTA BASANTH BHANUDASS",
        "registrationNumber": "99240041412",
        "email": "99240041412@klu.ac.in",
        "phone": "7981986987",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-022-2",
        "teamId": "WEB-022",
        "name": "KORNANA LOKESH",
        "registrationNumber": "99240041416",
        "email": "99240041416@klu.ac.in",
        "phone": "7671951510",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-022-3",
        "teamId": "WEB-022",
        "name": "NARUKULLA PARDHU",
        "registrationNumber": "99240041425",
        "email": "99240041425@klu.ac.in",
        "phone": "9121813879",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-022-4",
        "teamId": "WEB-022",
        "name": "SURE MANOJ KUMAR",
        "registrationNumber": "99240041352",
        "email": "99240041352@klu.ac.in",
        "phone": "7989962639",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-023",
    "teamName": "MAGIC SQUAD",
    "teamLeadMemberId": "MEM-023-1",
    "teamLeadRegNo": "99240041033",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-023-99240041033-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-023-1",
        "teamId": "WEB-023",
        "name": "MATTA UMA MAHESWAR REDDY",
        "registrationNumber": "99240041033",
        "email": "99240041033@klu.ac.in",
        "phone": "9989442317",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-023-2",
        "teamId": "WEB-023",
        "name": "MANNE SIVA MOHAN REDDY",
        "registrationNumber": "99240041035",
        "email": "99240041035@klu.ac.in",
        "phone": "7093964833",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-023-3",
        "teamId": "WEB-023",
        "name": "V.PRADEEK REDDY",
        "registrationNumber": "99240041089",
        "email": "99240041089@klu.ac.in",
        "phone": "9849965467",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-023-4",
        "teamId": "WEB-023",
        "name": "B.SHANMUKHA REDDY",
        "registrationNumber": "99240040414",
        "email": "99240040414@klu.ac.in",
        "phone": "9963966593",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-024",
    "teamName": "APXGP",
    "teamLeadMemberId": "MEM-024-1",
    "teamLeadRegNo": "99240041034",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-024-99240041034-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-024-1",
        "teamId": "WEB-024",
        "name": "MEGHAM NAGA VENKATA BRUNDHA",
        "registrationNumber": "99240041034",
        "email": "99240041034@klu.ac.in",
        "phone": "7780108662",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-024-2",
        "teamId": "WEB-024",
        "name": "MACHIKA RADHA KRISHNA",
        "registrationNumber": "99240041002",
        "email": "99240041002@klu.ac.in",
        "phone": "9392756278",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-024-3",
        "teamId": "WEB-024",
        "name": "CHENNUPATI DEEKSHITHA SAI",
        "registrationNumber": "9924008099",
        "email": "9924008099@klu.ac.in",
        "phone": "9502393548",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-024-4",
        "teamId": "WEB-024",
        "name": "ATTETI POOJITHA",
        "registrationNumber": "99240040294",
        "email": "99240040294@klu.ac.in",
        "phone": "9059754847",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-025",
    "teamName": "TITANS",
    "teamLeadMemberId": "MEM-025-1",
    "teamLeadRegNo": "9923005006",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-025-9923005006-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-025-1",
        "teamId": "WEB-025",
        "name": "BESTA ABHINAV KRISHNA",
        "registrationNumber": "9923005006",
        "email": "9923005006@klu.ac.in",
        "phone": "8885599316",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-025-2",
        "teamId": "WEB-025",
        "name": "LAKKIREDDY SREEHARI REDDY",
        "registrationNumber": "9824005005",
        "email": "9824005005@klu.ac.in",
        "phone": "9392881758",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-025-3",
        "teamId": "WEB-025",
        "name": "VADLA PAVAN",
        "registrationNumber": "9923005139",
        "email": "9923005139@klu.ac.in",
        "phone": "9391826757",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-025-4",
        "teamId": "WEB-025",
        "name": "GORLA RAVI",
        "registrationNumber": "9923005314",
        "email": "9923005314@klu.ac.in",
        "phone": "9177912109",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-026",
    "teamName": "WEB CATALYST",
    "teamLeadMemberId": "MEM-026-1",
    "teamLeadRegNo": "99240040943",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-026-99240040943-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-026-1",
        "teamId": "WEB-026",
        "name": "DERANGULA DEVENDRA",
        "registrationNumber": "99240040943",
        "email": "99240040943@klu.ac.in",
        "phone": "8019996605",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-026-2",
        "teamId": "WEB-026",
        "name": "PUPPALA SAMBASIVA",
        "registrationNumber": "99240041258",
        "email": "99240041258@klu.ac.in",
        "phone": "9398148669",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-026-3",
        "teamId": "WEB-026",
        "name": "THOKKALA MADHU GNANESWAR",
        "registrationNumber": "99240040239",
        "email": "99240040239@klu.ac.in",
        "phone": "7338835738",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-026-4",
        "teamId": "WEB-026",
        "name": "MIDDILI SUSHANTH REDDY",
        "registrationNumber": "99240040237",
        "email": "99240040237@klu.ac.in",
        "phone": "8688817226",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-027",
    "teamName": "CODE WARRIORS",
    "teamLeadMemberId": "MEM-027-1",
    "teamLeadRegNo": "99240040768",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-027-99240040768-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-027-1",
        "teamId": "WEB-027",
        "name": "GUTLAPALLI LOSHINI",
        "registrationNumber": "99240040768",
        "email": "99240040768@klu.ac.in",
        "phone": "7702642289",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-027-2",
        "teamId": "WEB-027",
        "name": "K.REVATHI",
        "registrationNumber": "99240040551",
        "email": "99240040551@klu.ac.in",
        "phone": "9398302801",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-027-3",
        "teamId": "WEB-027",
        "name": "CHAKALI GURUDEEPAK",
        "registrationNumber": "9924005228",
        "email": "9924005228@klu.ac.in",
        "phone": "8688509957",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-027-4",
        "teamId": "WEB-027",
        "name": "BATTA SANTHOSH",
        "registrationNumber": "9924005064",
        "email": "9924005064@klu.ac.in",
        "phone": "8333935378",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-028",
    "teamName": "COSMOS",
    "teamLeadMemberId": "MEM-028-1",
    "teamLeadRegNo": "9923005043",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-028-9923005043-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-028-1",
        "teamId": "WEB-028",
        "name": "T NAGA SESHU",
        "registrationNumber": "9923005043",
        "email": "9923005043@klu.ac.in",
        "phone": "9392539374",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-028-2",
        "teamId": "WEB-028",
        "name": "VELU BALU",
        "registrationNumber": "9923005143",
        "email": "9923005143@klu.ac.in",
        "phone": "8143522038",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-028-3",
        "teamId": "WEB-028",
        "name": "B.SRI ADHITHYA VARSHINI",
        "registrationNumber": "9923005301",
        "email": "9923005301@klu.ac.in",
        "phone": "7708189489",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-028-4",
        "teamId": "WEB-028",
        "name": "K.ROSHINI",
        "registrationNumber": "9923005297",
        "email": "9923005297@klu.ac.in",
        "phone": "9751936011",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-029",
    "teamName": "WEB DEFENDERS",
    "teamLeadMemberId": "MEM-029-1",
    "teamLeadRegNo": "99240040900",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-029-99240040900-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-029-1",
        "teamId": "WEB-029",
        "name": "DHANUNJAY MAITY",
        "registrationNumber": "99240040900",
        "email": "99240040900@klu.ac.in",
        "phone": "9121623023",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-029-2",
        "teamId": "WEB-029",
        "name": "SHAIK MOHAMMAD FARHAN",
        "registrationNumber": "99240040772",
        "email": "99240040772@klu.ac.in",
        "phone": "7660890139",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-029-3",
        "teamId": "WEB-029",
        "name": "SHAIK NOOR",
        "registrationNumber": "99240040753",
        "email": "99240040753@klu.ac.in",
        "phone": "6300813023",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-029-4",
        "teamId": "WEB-029",
        "name": "MOHAMMAD ABDUL MUNAF",
        "registrationNumber": "99240040643",
        "email": "99240040643@klu.ac.in",
        "phone": "9392963723",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-030",
    "teamName": "AVENGERS",
    "teamLeadMemberId": "MEM-030-1",
    "teamLeadRegNo": "99230040796",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-030-99230040796-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-030-1",
        "teamId": "WEB-030",
        "name": "VANAM GOUTHAM REDDY",
        "registrationNumber": "99230040796",
        "email": "99230040796@klu.ac.in",
        "phone": "8125436350",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-030-2",
        "teamId": "WEB-030",
        "name": "KAMARAJU GARI PAVITHRA",
        "registrationNumber": "99230040320",
        "email": "99230040320@klu.ac.in",
        "phone": "8919597847",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-030-3",
        "teamId": "WEB-030",
        "name": "AVULA SIVA GANESH REDDY",
        "registrationNumber": "99230040262",
        "email": "99230040262@klu.ac.in",
        "phone": "8330923377",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-030-4",
        "teamId": "WEB-030",
        "name": "KAPPATRALA EDIGA MADHU SUDHAN GOUD",
        "registrationNumber": "99230040330",
        "email": "99230040330@klu.ac.in",
        "phone": "7780312021",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-031",
    "teamName": "GARUDA",
    "teamLeadMemberId": "MEM-031-1",
    "teamLeadRegNo": "9923005176",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-031-9923005176-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-031-1",
        "teamId": "WEB-031",
        "name": "MUNAGALA PRASANNA KUMAR",
        "registrationNumber": "9923005176",
        "email": "9923005176@klu.ac.in",
        "phone": "9392166898",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-031-2",
        "teamId": "WEB-031",
        "name": "SIKHAKOLLI PRUDHVI KUMAR",
        "registrationNumber": "9923005128",
        "email": "9923005128@klu.ac.in",
        "phone": "9963405424",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-031-3",
        "teamId": "WEB-031",
        "name": "CHEREDDY SANTHOSH",
        "registrationNumber": "9923005068",
        "email": "9923005068@klu.ac.in",
        "phone": "7386076474",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-031-4",
        "teamId": "WEB-031",
        "name": "BATTU VENKATA VINOD",
        "registrationNumber": "9923005148",
        "email": "9923005148@klu.ac.in",
        "phone": "7816018653",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-032",
    "teamName": "THE MARVEL",
    "teamLeadMemberId": "MEM-032-1",
    "teamLeadRegNo": "9923005166",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-032-9923005166-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-032-1",
        "teamId": "WEB-032",
        "name": "AYODHYAPURAM AKASH KUMAR REDDY",
        "registrationNumber": "9923005166",
        "email": "9923005166@klu.ac.in",
        "phone": "7330668803",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-032-2",
        "teamId": "WEB-032",
        "name": "UPPU VISHNU BRAHMAYYA",
        "registrationNumber": "99230041061",
        "email": "99230041061@klu.ac.in",
        "phone": "9356986804",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-032-3",
        "teamId": "WEB-032",
        "name": "NEELAM SASIDHAR",
        "registrationNumber": "99230041063",
        "email": "99230041063@klu.ac.in",
        "phone": "8143971988",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-032-4",
        "teamId": "WEB-032",
        "name": "KALAPALA GOPI NADH",
        "registrationNumber": "99230041054",
        "email": "99230041054@klu.ac.in",
        "phone": "9494970836",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-033",
    "teamName": "TEAM SPIDEY",
    "teamLeadMemberId": "MEM-033-1",
    "teamLeadRegNo": "99240041418",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-033-99240041418-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-033-1",
        "teamId": "WEB-033",
        "name": "KURUVA JANARDHAN",
        "registrationNumber": "99240041418",
        "email": "99240041418@klu.ac.in",
        "phone": "8919100511",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-033-2",
        "teamId": "WEB-033",
        "name": "HALVI LINGA",
        "registrationNumber": "99240040938",
        "email": "99240040938@klu.ac.in",
        "phone": "8555950633",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-033-3",
        "teamId": "WEB-033",
        "name": "U.UDHAY KUMAR",
        "registrationNumber": "99240041428",
        "email": "99240041428@klu.ac.in",
        "phone": "6301389569",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-033-4",
        "teamId": "WEB-033",
        "name": "CHILIPIREDDY PAVAN KUMAR REDDY",
        "registrationNumber": "99240040345",
        "email": "99240040345@klu.ac.in",
        "phone": "9381252248",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-034",
    "teamName": "HACKHIVE",
    "teamLeadMemberId": "MEM-034-1",
    "teamLeadRegNo": "99240040754",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-034-99240040754-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-034-1",
        "teamId": "WEB-034",
        "name": "SHAIK SHAMS",
        "registrationNumber": "99240040754",
        "email": "99240040754@klu.ac.in",
        "phone": "7995356019",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-034-2",
        "teamId": "WEB-034",
        "name": "SIBBALA CHANDANA",
        "registrationNumber": "99240040750",
        "email": "99240040750@klu.ac.in",
        "phone": "7842042979",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-034-3",
        "teamId": "WEB-034",
        "name": "M RAGHAVA",
        "registrationNumber": "99240041044",
        "email": "99240041044@klu.ac.in",
        "phone": "9346193641",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-034-4",
        "teamId": "WEB-034",
        "name": "V SHRUTHI",
        "registrationNumber": "99240040166",
        "email": "99240040166@klu.ac.in",
        "phone": "9345528610",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-035",
    "teamName": "TEAM DRAGON",
    "teamLeadMemberId": "MEM-035-1",
    "teamLeadRegNo": "99240040896",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-035-99240040896-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-035-1",
        "teamId": "WEB-035",
        "name": "A S DEERAJ",
        "registrationNumber": "99240040896",
        "email": "99240040896@klu.ac.in",
        "phone": "9390335408",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-035-2",
        "teamId": "WEB-035",
        "name": "DERANGULA RAVITEJA",
        "registrationNumber": "99240040893",
        "email": "99240040893@klu.ac.in",
        "phone": "9346294572",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-035-3",
        "teamId": "WEB-035",
        "name": "DESHAM SANTOSH REDDY",
        "registrationNumber": "99240040892",
        "email": "99240040892@klu.ac.in",
        "phone": "8328028215",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-035-4",
        "teamId": "WEB-035",
        "name": "RAJULAVARI KAKATHI BHANU TEJA",
        "registrationNumber": "99240040322",
        "email": "99240040322@klu.ac.in",
        "phone": "8179328098",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-036",
    "teamName": "MATRIX",
    "teamLeadMemberId": "MEM-036-1",
    "teamLeadRegNo": "99230040255",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-036-99230040255-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-036-1",
        "teamId": "WEB-036",
        "name": "ANKIREDDY HITHESWAR REDDY",
        "registrationNumber": "99230040255",
        "email": "99230040255@klu.ac.in",
        "phone": "9581874494",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-036-2",
        "teamId": "WEB-036",
        "name": "CHITTIBOINA BHARGAV RAM",
        "registrationNumber": "99230040922",
        "email": "99230040922@klu.ac.in",
        "phone": "7569312845",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-036-3",
        "teamId": "WEB-036",
        "name": "KAMSALA YUVASAI VIGHNESH",
        "registrationNumber": "99230040974",
        "email": "99230040974@klu.ac.in",
        "phone": "8331942544",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-036-4",
        "teamId": "WEB-036",
        "name": "PASURLA MASTHAN REDDY",
        "registrationNumber": "99230040993",
        "email": "99230040993@klu.ac.in",
        "phone": "6300445506",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-037",
    "teamName": "CODE HASHIRA",
    "teamLeadMemberId": "MEM-037-1",
    "teamLeadRegNo": "9923005094",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-037-9923005094-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-037-1",
        "teamId": "WEB-037",
        "name": "KATTI MAHESH BABU",
        "registrationNumber": "9923005094",
        "email": "9923005094@klu.ac.in",
        "phone": "6281528636",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-037-2",
        "teamId": "WEB-037",
        "name": "BHUMIREDDY VENKATA SAKETH REDDY",
        "registrationNumber": "9824005001",
        "email": "9824005001@klu.ac.in",
        "phone": "9573559955",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-037-3",
        "teamId": "WEB-037",
        "name": "KUPPAM POOJESH",
        "registrationNumber": "9923005101",
        "email": "9923005101@klu.ac.in",
        "phone": "7386562752",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-037-4",
        "teamId": "WEB-037",
        "name": "E HEMASAGAR",
        "registrationNumber": "9923005151",
        "email": "9923005151@klu.ac.in",
        "phone": "7386763146",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-038",
    "teamName": "TEAM IP",
    "teamLeadMemberId": "MEM-038-1",
    "teamLeadRegNo": "99240040417",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-038-99240040417-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-038-1",
        "teamId": "WEB-038",
        "name": "UDAY KUMAR BULLE",
        "registrationNumber": "99240040417",
        "email": "99240040417@klu.ac.in",
        "phone": "6301011617",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-038-2",
        "teamId": "WEB-038",
        "name": "TALAMARLA PRAVEEN",
        "registrationNumber": "99240040408",
        "email": "99240040408@klu.ac.in",
        "phone": "9391408186",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-038-3",
        "teamId": "WEB-038",
        "name": "SUDALAGUNTA PRAVEEN KUMAR",
        "registrationNumber": "99240040889",
        "email": "99240040889@klu.ac.in",
        "phone": "9032844051",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-038-4",
        "teamId": "WEB-038",
        "name": "CHITRA NAGAMUNINDRA",
        "registrationNumber": "99240040030",
        "email": "99240040030@klu.ac.in",
        "phone": "9391721323",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-039",
    "teamName": "CODECRAFTERS",
    "teamLeadMemberId": "MEM-039-1",
    "teamLeadRegNo": "99240041004",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-039-99240041004-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-039-1",
        "teamId": "WEB-039",
        "name": "KURLI SHIVANANDA REDDY",
        "registrationNumber": "99240041004",
        "email": "99240041004@klu.ac.in",
        "phone": "9701316837",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-039-2",
        "teamId": "WEB-039",
        "name": "D LEPAKSHI REDDY",
        "registrationNumber": "99240041006",
        "email": "99240041006@klu.ac.in",
        "phone": "9390150173",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-039-3",
        "teamId": "WEB-039",
        "name": "MADAM YOGENDRA",
        "registrationNumber": "99240041005",
        "email": "99240041005@klu.ac.in",
        "phone": "8919916006",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-039-4",
        "teamId": "WEB-039",
        "name": "LAMBADI RAVI TEJA",
        "registrationNumber": "99240040273",
        "email": "99240040273@klu.ac.in",
        "phone": "7013695193",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-040",
    "teamName": "TEAM IRON MAN",
    "teamLeadMemberId": "MEM-040-1",
    "teamLeadRegNo": "99240040810",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-040-99240040810-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-040-1",
        "teamId": "WEB-040",
        "name": "ARDITTI VENKATA SAI",
        "registrationNumber": "99240040810",
        "email": "99240040810@klu.ac.in",
        "phone": "7995742055",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-040-2",
        "teamId": "WEB-040",
        "name": "BAREDDY PAVAN KUMAR REDDY",
        "registrationNumber": "99240040839",
        "email": "99240040839@klu.ac.in",
        "phone": "7729873260",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-040-3",
        "teamId": "WEB-040",
        "name": "CHILAKA JAGADEESWAR REDDY",
        "registrationNumber": "99240040863",
        "email": "99240040863@klu.ac.in",
        "phone": "6301341285",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-040-4",
        "teamId": "WEB-040",
        "name": "ANKIREDDY JASWANTH REDDY",
        "registrationNumber": "99240040806",
        "email": "99240040806@klu.ac.in",
        "phone": "8919679142",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-041",
    "teamName": "WEB SHOOTERS",
    "teamLeadMemberId": "MEM-041-1",
    "teamLeadRegNo": "99230040378",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-041-99230040378-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-041-1",
        "teamId": "WEB-041",
        "name": "MUTHUKURI ESWAR GANESH",
        "registrationNumber": "99230040378",
        "email": "99230040378@klu.ac.in",
        "phone": "7386115885",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-041-2",
        "teamId": "WEB-041",
        "name": "KANUPARTHI GANESH PREETHAM REDDY",
        "registrationNumber": "99230040329",
        "email": "99230040329@klu.ac.in",
        "phone": "6302845847",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-041-3",
        "teamId": "WEB-041",
        "name": "K.MAHIDHAR SAI",
        "registrationNumber": "99230040322",
        "email": "99230040322@klu.ac.in",
        "phone": "8688002956",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-041-4",
        "teamId": "WEB-041",
        "name": "DEVARAJUGATTU JANARDHANA",
        "registrationNumber": "99230041079",
        "email": "99230041079@klu.ac.in",
        "phone": "8309404791",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-042",
    "teamName": "CODE CRAFTERS",
    "teamLeadMemberId": "MEM-042-1",
    "teamLeadRegNo": "99230040829",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-042-99230040829-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-042-1",
        "teamId": "WEB-042",
        "name": "YUVEJ KUMAR",
        "registrationNumber": "99230040829",
        "email": "99230040829@klu.ac.in",
        "phone": "9640304868",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-042-2",
        "teamId": "WEB-042",
        "name": "KOTIPALLI NAGA SATYA SRI TEJASWINI",
        "registrationNumber": "99240040588",
        "email": "99240040588@klu.ac.in",
        "phone": "9392436877",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-042-3",
        "teamId": "WEB-042",
        "name": "MAJJI MAHALAKSHMI SATYA VARA PRASAD",
        "registrationNumber": "99240040607",
        "email": "99240040607@klu.ac.in",
        "phone": "7981775853",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-042-4",
        "teamId": "WEB-042",
        "name": "SALIF KHAN",
        "registrationNumber": "9924005162",
        "email": "9924005162@klu.ac.in",
        "phone": "9966878655",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-043",
    "teamName": "TECH SQUAD",
    "teamLeadMemberId": "MEM-043-1",
    "teamLeadRegNo": "99240040780",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-043-99240040780-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-043-1",
        "teamId": "WEB-043",
        "name": "TADIKONDA SANJAY YEDUKONDALU",
        "registrationNumber": "99240040780",
        "email": "99240040780@klu.ac.in",
        "phone": "7993622973",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-043-2",
        "teamId": "WEB-043",
        "name": "ADIGARLA PRAVEEN",
        "registrationNumber": "99240041207",
        "email": "99240041207@klu.ac.in",
        "phone": "7286073036",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-043-3",
        "teamId": "WEB-043",
        "name": "KARNE HEMANTH",
        "registrationNumber": "99240040361",
        "email": "99240040361@klu.ac.in",
        "phone": "8074036237",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-043-4",
        "teamId": "WEB-043",
        "name": "CHINTHALAPALLI MANIDEEP",
        "registrationNumber": "99240040029",
        "email": "99240040029@klu.ac.in",
        "phone": "7673904959",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-044",
    "teamName": "MIDNIGHT HAWK",
    "teamLeadMemberId": "MEM-044-1",
    "teamLeadRegNo": "99240041431",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-044-99240041431-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-044-1",
        "teamId": "WEB-044",
        "name": "GOGULA SIREESHA",
        "registrationNumber": "99240041431",
        "email": "99240041431@klu.ac.in",
        "phone": "8520065111",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-044-2",
        "teamId": "WEB-044",
        "name": "BHEEMIREDDY DIVYA SREE",
        "registrationNumber": "99240041324",
        "email": "99240041324@klu.ac.in",
        "phone": "8639787392",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-044-3",
        "teamId": "WEB-044",
        "name": "BHUMIREDDY PALLE BHAVYA",
        "registrationNumber": "99240040849",
        "email": "99240040849@klu.ac.in",
        "phone": "6302932288",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-044-4",
        "teamId": "WEB-044",
        "name": "C H GURU VENKATA RAHAVENDRA",
        "registrationNumber": "99240040524",
        "email": "99240040524@klu.ac.in",
        "phone": "6304940167",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-045",
    "teamName": "CORTEXCREW",
    "teamLeadMemberId": "MEM-045-1",
    "teamLeadRegNo": "99240040526",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-045-99240040526-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-045-1",
        "teamId": "WEB-045",
        "name": "GOPIREDDY NAVADEEP REDDY",
        "registrationNumber": "99240040526",
        "email": "99240040526@klu.ac.in",
        "phone": "9392420596",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-045-2",
        "teamId": "WEB-045",
        "name": "KAMALAMARRY JAHNAVI",
        "registrationNumber": "99240040947",
        "email": "99240040947@klu.ac.in",
        "phone": "6301052416",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-045-3",
        "teamId": "WEB-045",
        "name": "DASARI SARUPYA",
        "registrationNumber": "99240040440",
        "email": "99240040440@klu.ac.in",
        "phone": "7995711292",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-045-4",
        "teamId": "WEB-045",
        "name": "ASURI SAINT PAUL",
        "registrationNumber": "99240040014",
        "email": "99240040014@klu.ac.in",
        "phone": "9676586749",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-046",
    "teamName": "JAI JAWAN JAI KISAN",
    "teamLeadMemberId": "MEM-046-1",
    "teamLeadRegNo": "99240040860",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-046-99240040860-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-046-1",
        "teamId": "WEB-046",
        "name": "CHERUKU SAIVIGNESH",
        "registrationNumber": "99240040860",
        "email": "99240040860@klu.ac.in",
        "phone": "7661993393",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-046-2",
        "teamId": "WEB-046",
        "name": "CHEEKATLA MOHAN SAI",
        "registrationNumber": "99240040867",
        "email": "99240040867@klu.ac.in",
        "phone": "7702320090",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-046-3",
        "teamId": "WEB-046",
        "name": "ADI ANDHRA DIVVENDRA",
        "registrationNumber": "99240040800",
        "email": "99240040800@klu.ac.in",
        "phone": "6302043733",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-046-4",
        "teamId": "WEB-046",
        "name": "PAPPIREDDY ISHITHA REDDY",
        "registrationNumber": "99240040880",
        "email": "99240040880@klu.ac.in",
        "phone": "8341619339",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-047",
    "teamName": "FOUR KINGS",
    "teamLeadMemberId": "MEM-047-1",
    "teamLeadRegNo": "9924005440",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-047-9924005440-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-047-1",
        "teamId": "WEB-047",
        "name": "T YASWANTH RAJ",
        "registrationNumber": "9924005440",
        "email": "9924005440@klu.ac.in",
        "phone": "7670820545",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-047-2",
        "teamId": "WEB-047",
        "name": "GUNTOOR MARUTHI",
        "registrationNumber": "9924008022",
        "email": "9924008022@klu.ac.in",
        "phone": "9989282218",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-047-3",
        "teamId": "WEB-047",
        "name": "MUTYALA SAI KIRAN",
        "registrationNumber": "99240041269",
        "email": "99240041269@klu.ac.in",
        "phone": "9949261109",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-047-4",
        "teamId": "WEB-047",
        "name": "A YOGI NANDA PRABHAS",
        "registrationNumber": "9924005002",
        "email": "9924005002@klu.ac.in",
        "phone": "8096266277",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-048",
    "teamName": "THE UNIVERS",
    "teamLeadMemberId": "MEM-048-1",
    "teamLeadRegNo": "99240040805",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-048-99240040805-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-048-1",
        "teamId": "WEB-048",
        "name": "ARAVEETI PRAJWAL REDDY",
        "registrationNumber": "99240040805",
        "email": "99240040805@klu.ac.in",
        "phone": "8431652685",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-048-2",
        "teamId": "WEB-048",
        "name": "SHAIK DADA KHALANDAR",
        "registrationNumber": "99240041165",
        "email": "99240041165@klu.ac.in",
        "phone": "8555932840",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-048-3",
        "teamId": "WEB-048",
        "name": "TANAKANTI NITHIN",
        "registrationNumber": "99240041215",
        "email": "99240041215@klu.ac.in",
        "phone": "8885685597",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-048-4",
        "teamId": "WEB-048",
        "name": "SHAIK FAIZUNUL",
        "registrationNumber": "99240041174",
        "email": "99240041174@klu.ac.in",
        "phone": "9030178471",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-049",
    "teamName": "SECRET WARRIORS",
    "teamLeadMemberId": "MEM-049-1",
    "teamLeadRegNo": "99240040217",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-049-99240040217-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-049-1",
        "teamId": "WEB-049",
        "name": "DEVARAPU SUDHAKAR",
        "registrationNumber": "99240040217",
        "email": "99240040217@klu.ac.in",
        "phone": "9030041127",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-049-2",
        "teamId": "WEB-049",
        "name": "KUMMARI MADHUSUDANA RAO",
        "registrationNumber": "99240040080",
        "email": "99240040080@klu.ac.in",
        "phone": "7671002751",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-049-3",
        "teamId": "WEB-049",
        "name": "KONDATI NARESH",
        "registrationNumber": "9924005085",
        "email": "9924005085@klu.ac.in",
        "phone": "9912163873",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-049-4",
        "teamId": "WEB-049",
        "name": "DESAM BHANU PRAKASH REDDY",
        "registrationNumber": "9924008076",
        "email": "9924008076@klu.ac.in",
        "phone": "7680812742",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-050",
    "teamName": "BLESSED MINDS",
    "teamLeadMemberId": "MEM-050-1",
    "teamLeadRegNo": "99240040876",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-050-99240040876-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-050-1",
        "teamId": "WEB-050",
        "name": "CHAPPIDI AJAYKUMAR VENKAT RAMANA",
        "registrationNumber": "99240040876",
        "email": "99240040876@klu.ac.in",
        "phone": "7981715201",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-050-2",
        "teamId": "WEB-050",
        "name": "KOPPARAPU NAGA VENKATA SAI MANIKANTA",
        "registrationNumber": "99240040736",
        "email": "99240040736@klu.ac.in",
        "phone": "7569871614",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-050-3",
        "teamId": "WEB-050",
        "name": "MADAM ESWAR KISHORE",
        "registrationNumber": "99240040276",
        "email": "99240040276@klu.ac.in",
        "phone": "9059084557",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-050-4",
        "teamId": "WEB-050",
        "name": "BURRI NARENDRA",
        "registrationNumber": "9924005190",
        "email": "9924005190@klu.ac.in",
        "phone": "7569177179",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-051",
    "teamName": "WEB WARRIORS",
    "teamLeadMemberId": "MEM-051-1",
    "teamLeadRegNo": "9924005425",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-051-9924005425-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-051-1",
        "teamId": "WEB-051",
        "name": "JAGADABI VAISHNAVI",
        "registrationNumber": "9924005425",
        "email": "9924005425@klu.ac.in",
        "phone": "7893768098",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-051-2",
        "teamId": "WEB-051",
        "name": "MADDELA BHARATH",
        "registrationNumber": "99240041001",
        "email": "99240041001@klu.ac.in",
        "phone": "9030678492",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-051-3",
        "teamId": "WEB-051",
        "name": "SHAIK NOORE SABHA",
        "registrationNumber": "99240040771",
        "email": "99240040771@klu.ac.in",
        "phone": "8500701004",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-051-4",
        "teamId": "WEB-051",
        "name": "GEVINI NAVADEEP",
        "registrationNumber": "99240040908",
        "email": "99240040908@klu.ac.in",
        "phone": "9398311489",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-052",
    "teamName": "TEAM SPIRIT",
    "teamLeadMemberId": "MEM-052-1",
    "teamLeadRegNo": "9924005391",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-052-9924005391-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-052-1",
        "teamId": "WEB-052",
        "name": "CHINNAPAREDDY YOGANANDA REDDY",
        "registrationNumber": "9924005391",
        "email": "9924005391@klu.ac.in",
        "phone": "8919288276",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-052-2",
        "teamId": "WEB-052",
        "name": "TEKURI SIVA SAI KUMAR",
        "registrationNumber": "9924005054",
        "email": "9924005054@klu.ac.in",
        "phone": "9398659300",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-052-3",
        "teamId": "WEB-052",
        "name": "KONDURU ABHIRAMA RAJU",
        "registrationNumber": "99240040086",
        "email": "99240040086@klu.ac.in",
        "phone": "9494809590",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-052-4",
        "teamId": "WEB-052",
        "name": "KOTA PUSHPAK CHOWDARY",
        "registrationNumber": "99240040598",
        "email": "99240040598@klu.ac.in",
        "phone": "6302686234",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-053",
    "teamName": "TEAM TITANS",
    "teamLeadMemberId": "MEM-053-1",
    "teamLeadRegNo": "99240040171",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-053-99240040171-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-053-1",
        "teamId": "WEB-053",
        "name": "SHREEKANTHACHARI R S",
        "registrationNumber": "99240040171",
        "email": "99240040171@klu.ac.in",
        "phone": "9380905239",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-053-2",
        "teamId": "WEB-053",
        "name": "TIRUMALA RAM PRASAD",
        "registrationNumber": "99240040258",
        "email": "99240040258@klu.ac.in",
        "phone": "7993749400",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-053-3",
        "teamId": "WEB-053",
        "name": "KOLA VINAY DURGA",
        "registrationNumber": "99240040260",
        "email": "99240040260@klu.ac.in",
        "phone": "9014722434",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-053-4",
        "teamId": "WEB-053",
        "name": "PUTTABOINA VENKATA RAMANA",
        "registrationNumber": "99240040153",
        "email": "99240040153@klu.ac.in",
        "phone": "7569164712",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-054",
    "teamName": "THE RED SEA",
    "teamLeadMemberId": "MEM-054-1",
    "teamLeadRegNo": "99240040436",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-054-99240040436-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-054-1",
        "teamId": "WEB-054",
        "name": "TATIPARTHI RAVINDRA REDDY",
        "registrationNumber": "99240040436",
        "email": "99240040436@klu.ac.in",
        "phone": "9344689730",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-054-2",
        "teamId": "WEB-054",
        "name": "SINGU SHANMUK SAI",
        "registrationNumber": "99240040804",
        "email": "99240040804@klu.ac.in",
        "phone": "8978190467",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-054-3",
        "teamId": "WEB-054",
        "name": "ITHA REVANTH MANI PULLARAO",
        "registrationNumber": "99240040933",
        "email": "99240040933@klu.ac.in",
        "phone": "9951289644",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-054-4",
        "teamId": "WEB-054",
        "name": "TALLAM SAI HASIKA",
        "registrationNumber": "99240040438",
        "email": "99240040438@klu.ac.in",
        "phone": "8919136307",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-055",
    "teamName": "RED SQUADRON",
    "teamLeadMemberId": "MEM-055-1",
    "teamLeadRegNo": "99230040442",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-055-99230040442-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-055-1",
        "teamId": "WEB-055",
        "name": "UPPALA DINESH",
        "registrationNumber": "99230040442",
        "email": "99230040442@klu.ac.in",
        "phone": "9959243185",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-055-2",
        "teamId": "WEB-055",
        "name": "ANIMALA GURU SAI NATH",
        "registrationNumber": "9923005003",
        "email": "9923005003@klu.ac.in",
        "phone": "9949821926",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-055-3",
        "teamId": "WEB-055",
        "name": "MUDIVARTHI VISHWAK SAI",
        "registrationNumber": "9923005157",
        "email": "9923005157@klu.ac.in",
        "phone": "9676029787",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-055-4",
        "teamId": "WEB-055",
        "name": "CHINTHAKAYALA SAI CHARAN",
        "registrationNumber": "9923005071",
        "email": "9923005071@klu.ac.in",
        "phone": "9952037664",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-056",
    "teamName": "STRANGER THINGS",
    "teamLeadMemberId": "MEM-056-1",
    "teamLeadRegNo": "9824005012",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-056-9824005012-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-056-1",
        "teamId": "WEB-056",
        "name": "VUTAKANTI SREEKANTH REDDY",
        "registrationNumber": "9824005012",
        "email": "9824005012@klu.ac.in",
        "phone": "6302725382",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-056-2",
        "teamId": "WEB-056",
        "name": "BASWA DINESH",
        "registrationNumber": "9923005005",
        "email": "9923005005@klu.ac.in",
        "phone": "7780403422",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-056-3",
        "teamId": "WEB-056",
        "name": "CHEMBETI VINAY HARSHA",
        "registrationNumber": "9923005067",
        "email": "9923005067@klu.ac.in",
        "phone": "7416661129",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-056-4",
        "teamId": "WEB-056",
        "name": "ANKIREDDYPALLI PAVAN KUMAR REDDY",
        "registrationNumber": "9923005059",
        "email": "9923005059@klu.ac.in",
        "phone": "7815986268",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-057",
    "teamName": "BYTE FORCE",
    "teamLeadMemberId": "MEM-057-1",
    "teamLeadRegNo": "9824005007",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-057-9824005007-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-057-1",
        "teamId": "WEB-057",
        "name": "BOPPADALA NAGA SANJAY",
        "registrationNumber": "9824005007",
        "email": "9824005007@klu.ac.in",
        "phone": "9963915525",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-057-2",
        "teamId": "WEB-057",
        "name": "MORUMPALLI BHANU PRAKASH REDDY",
        "registrationNumber": "9824005010",
        "email": "9824005010@klu.ac.in",
        "phone": "6302393740",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-057-3",
        "teamId": "WEB-057",
        "name": "SATYAVADA BHAVESH SHERAN",
        "registrationNumber": "9824005006",
        "email": "9824005006@klu.ac.in",
        "phone": "83744024955",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-057-4",
        "teamId": "WEB-057",
        "name": "VALIPI VISHNU VARDHAN",
        "registrationNumber": "9923006001",
        "email": "9923006001@klu.ac.in",
        "phone": "9381839410",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-058",
    "teamName": "TECHNOVA",
    "teamLeadMemberId": "MEM-058-1",
    "teamLeadRegNo": "9923005124",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-058-9923005124-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-058-1",
        "teamId": "WEB-058",
        "name": "RAAVULA VINAY",
        "registrationNumber": "9923005124",
        "email": "9923005124@klu.ac.in",
        "phone": "8790041892",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-058-2",
        "teamId": "WEB-058",
        "name": "APPALA VENKATA SAI NIKHIL",
        "registrationNumber": "9824005002",
        "email": "9824005002@klu.ac.in",
        "phone": "9490036940",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-058-3",
        "teamId": "WEB-058",
        "name": "KOLA ADARSH",
        "registrationNumber": "9923005097",
        "email": "9923005097@klu.ac.in",
        "phone": "8019192006",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-058-4",
        "teamId": "WEB-058",
        "name": "AKULA YASWANTH",
        "registrationNumber": "9824006004",
        "email": "9824006004@klu.ac.in",
        "phone": "7075853719",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-059",
    "teamName": "QUANTUM CODERS",
    "teamLeadMemberId": "MEM-059-1",
    "teamLeadRegNo": "99240040858",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-059-99240040858-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-059-1",
        "teamId": "WEB-059",
        "name": "CHALLAGUNDLA SIVA JYOTHIKA",
        "registrationNumber": "99240040858",
        "email": "99240040858@klu.ac.in",
        "phone": "9059015217",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-059-2",
        "teamId": "WEB-059",
        "name": "NUSUM NAGA BHAVANI",
        "registrationNumber": "99240040296",
        "email": "99240040296@klu.ac.in",
        "phone": "9963230708",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-059-3",
        "teamId": "WEB-059",
        "name": "CHIDAY NANDEESWAR",
        "registrationNumber": "99240041255",
        "email": "99240041255@klu.ac.in",
        "phone": "9014218798",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-059-4",
        "teamId": "WEB-059",
        "name": "BARU LOKESWARA RAO",
        "registrationNumber": "99240040842",
        "email": "99240040842@klu.ac.in",
        "phone": "7989465120",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  },
  {
    "teamId": "WEB-060",
    "teamName": "FAHH",
    "teamLeadMemberId": "MEM-060-1",
    "teamLeadRegNo": "9924005324",
    "status": "verified",
    "problemStatementId": null,
    "problemSelectedAt": null,
    "qrTokenHash": "webx-token-WEB-060-9924005324-sec",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-30T00:00:00.000Z",
    "members": [
      {
        "memberId": "MEM-060-1",
        "teamId": "WEB-060",
        "name": "NERUSU GANESH",
        "registrationNumber": "9924005324",
        "email": "9924005324@klu.ac.in",
        "phone": "9133720118",
        "isTeamLead": true,
        "status": "active"
      },
      {
        "memberId": "MEM-060-2",
        "teamId": "WEB-060",
        "name": "KOTTHA ABHINAI",
        "registrationNumber": "9924005087",
        "email": "9924005087@klu.ac.in",
        "phone": "7702502768",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-060-3",
        "teamId": "WEB-060",
        "name": "SHAIK SAMEER AHMAD",
        "registrationNumber": "9924005177",
        "email": "9924005177@klu.ac.in",
        "phone": "7893524640",
        "isTeamLead": false,
        "status": "active"
      },
      {
        "memberId": "MEM-060-4",
        "teamId": "WEB-060",
        "name": "JETTIBOYINA BALA SAI SANKARA GANESH",
        "registrationNumber": "9924005400",
        "email": "9924005400@klu.ac.in",
        "phone": "9866400149",
        "isTeamLead": false,
        "status": "active"
      }
    ]
  }
];
